import { LIA_OI_BUDGETS, LIA_OI_LIVE_UNAVAILABLE } from "@/config/lia-oi";
import { analyzeCandidate } from "@/lib/lia/oi/analyze";
import { applyBuckets } from "@/lib/lia/oi/buckets";
import { dedupeCandidates } from "@/lib/lia/oi/dedup";
import { enrichTopDetailCandidates } from "@/lib/lia/oi/enrich";
import { cheapFilterHits } from "@/lib/lia/oi/filter";
import { oiId } from "@/lib/lia/oi/id";
import { getInternetSearchProvider } from "@/lib/lia/oi/internet";
import {
  resolveOiSearchMode,
  safeProviderErrorMessage,
} from "@/lib/lia/oi/mode";
import { normalizeHit } from "@/lib/lia/oi/normalize";
import {
  buildPass2Queries,
  buildSearchPlan,
} from "@/lib/lia/oi/planner";
import {
  addReport,
  getLiaOiStore,
  listCandidates,
  saveSearchRequest,
  setHypotheses,
  upsertCandidates,
} from "@/lib/lia/oi/store";
import type {
  LiaOiCandidate,
  LiaOiHypothesis,
  LiaOiPipelineStats,
  LiaOiReport,
  LiaOiSearchRequest,
  LiaOiTodayStats,
} from "@/types/lia-oi";
import type { InternetSearchHit } from "@/lib/lia/oi/internet/types";

export type LiaOiSearchPipelineResult = {
  request: LiaOiSearchRequest;
  plan: LiaOiSearchRequest["plan"];
  signalsScanned: number;
  afterDedup: number;
  candidates: LiaOiCandidate[];
  /** Stage 2A.2 buckets */
  topOpportunities: LiaOiCandidate[];
  needsResearch: LiaOiCandidate[];
  sourceCatalogs: LiaOiCandidate[];
  rejected: LiaOiCandidate[];
  stubMode: boolean;
  searchMode: "stub" | "live";
  providerLabel: string;
  stats: LiaOiPipelineStats;
  providerUnavailable: boolean;
  ownerMessage?: string;
};

async function searchAllQueries(
  queries: string[],
  options: { limit: number; budgetMax: number | null; region?: string },
): Promise<{ hits: InternetSearchHit[]; errors: number; fatal: boolean }> {
  const provider = getInternetSearchProvider();
  let errors = 0;
  const hits: InternetSearchHit[] = [];

  for (const q of queries) {
    try {
      const chunk = await provider.search(q, {
        limit: options.limit,
        budgetMax: options.budgetMax,
        region: options.region,
      });
      hits.push(...chunk);
    } catch (error) {
      errors += 1;
      console.error(
        "[lia-oi] internet search query failed:",
        safeProviderErrorMessage(error),
      );
    }
  }

  return {
    hits,
    errors,
    fatal: errors > 0 && hits.length === 0,
  };
}

function processHits(
  rawHits: InternetSearchHit[],
  plan: ReturnType<typeof buildSearchPlan>,
): {
  filteredOut: number;
  duplicatesRemoved: number;
  deduped: LiaOiCandidate[];
} {
  const { hits: filtered, stats: filterStats } = cheapFilterHits(rawHits, {
    budgetMax: plan.budgetMax,
  });
  const normalized = filtered.map((h) => normalizeHit(h, plan));
  const beforeDedup = normalized.length;
  const deduped = dedupeCandidates(normalized).slice(
    0,
    LIA_OI_BUDGETS.maxCandidatesPerRun,
  );
  return {
    filteredOut:
      filterStats.droppedEmpty +
      filterStats.droppedUrl +
      filterStats.droppedJunk +
      filterStats.droppedBudget,
    duplicatesRemoved: Math.max(0, beforeDedup - deduped.length),
    deduped,
  };
}

/**
 * Запрос владельца → plan → multi-pass search → filter → normalize →
 * dedup → analyze → enrich → buckets.
 */
export async function runOwnerSearchPipeline(input: {
  query: string;
  userId: string;
}): Promise<LiaOiSearchPipelineResult> {
  const modeInfo = resolveOiSearchMode();
  const plan = buildSearchPlan(input.query);
  const perQueryLimit = LIA_OI_BUDGETS.maxResultsPerQuery;

  // --- Pass 1 ---
  const pass1 = plan.pass1Queries?.length
    ? plan.pass1Queries
    : plan.queries.slice(0, LIA_OI_BUDGETS.maxQueriesPass1);

  const search1 = await searchAllQueries(pass1, {
    limit: perQueryLimit,
    budgetMax: plan.budgetMax ?? null,
    region: plan.regions[0],
  });

  let allHits = [...search1.hits];
  let providerErrors = search1.errors;
  let searchPasses = 1;
  let queriesRun = pass1.length;

  let { filteredOut, duplicatesRemoved, deduped } = processHits(allHits, plan);

  let working = deduped
    .slice(0, LIA_OI_BUDGETS.maxAiAnalysesPerRun)
    .map((c) => analyzeCandidate(c, plan))
    .sort((a, b) => b.score.overall - a.score.overall);

  // Preliminary bucket peek for pass-2 decision
  const peek = applyBuckets(working);
  const needPass2 =
    modeInfo.mode === "live" &&
    peek.counts.TOP_OPPORTUNITIES < LIA_OI_BUDGETS.minTopForPass2Skip &&
    queriesRun < LIA_OI_BUDGETS.maxQueriesPerRun;

  if (needPass2) {
    const remaining = LIA_OI_BUDGETS.maxQueriesPerRun - queriesRun;
    const pass2 = buildPass2Queries(
      plan,
      {
        topCount: peek.counts.TOP_OPPORTUNITIES,
        detailCount: working.filter((c) => c.pageType === "DETAIL").length,
        fitCount: working.filter((c) => c.budgetFit === "FIT").length,
        unknownPriceCount: working.filter((c) => c.priceStatus === "UNKNOWN")
          .length,
        opportunityCount: working.filter((c) => c.contentIntent === "OPPORTUNITY")
          .length,
      },
      Math.min(remaining, LIA_OI_BUDGETS.maxQueriesPass2),
    );

    if (pass2.length) {
      plan.pass2Queries = pass2;
      plan.queries = [...pass1, ...pass2];
      const search2 = await searchAllQueries(pass2, {
        limit: perQueryLimit,
        budgetMax: plan.budgetMax ?? null,
        region: plan.regions[0],
      });
      allHits = [...allHits, ...search2.hits];
      providerErrors += search2.errors;
      searchPasses = 2;
      queriesRun += pass2.length;

      ({ filteredOut, duplicatesRemoved, deduped } = processHits(allHits, plan));
      working = deduped
        .slice(0, LIA_OI_BUDGETS.maxAiAnalysesPerRun)
        .map((c) => analyzeCandidate(c, plan))
        .sort((a, b) => b.score.overall - a.score.overall);
    }
  }

  const providerUnavailable =
    search1.fatal &&
    allHits.length === 0 &&
    modeInfo.mode === "live";
  if (providerUnavailable) {
    console.error(
      "[lia-oi] external search unavailable for owner run; mode=live",
    );
  }

  const catalogPagesSeen = working.filter((c) => c.isCatalogSource).length;

  const enrich =
    modeInfo.mode === "live"
      ? await enrichTopDetailCandidates(working, plan)
      : { candidates: working, stats: { pagesFetched: 0, pagesFetchFailed: 0 } };

  const analyzed = enrich.candidates
    .map((c) => analyzeCandidate(c, plan))
    .sort((a, b) => {
      if (a.budgetFit === "OVER_BUDGET" && b.budgetFit !== "OVER_BUDGET") return 1;
      if (b.budgetFit === "OVER_BUDGET" && a.budgetFit !== "OVER_BUDGET") return -1;
      if (a.isCatalogSource !== b.isCatalogSource) {
        return a.isCatalogSource ? 1 : -1;
      }
      return b.score.overall - a.score.overall;
    });

  const bucketed = applyBuckets(analyzed);
  const top = bucketed.top.slice(0, LIA_OI_BUDGETS.maxTopOpportunities);
  // Не добиваем TOP мусором — честно меньше 10
  const feed = [
    ...top,
    ...bucketed.needsResearch,
    ...bucketed.catalogs,
    ...bucketed.rejected,
  ];

  const detailPages = feed.filter((c) => c.pageType === "DETAIL").length;
  const opportunityCount = feed.filter(
    (c) => c.contentIntent === "OPPORTUNITY",
  ).length;
  const overBudget = feed.filter((c) => c.budgetFit === "OVER_BUDGET").length;
  const unknownPrice = feed.filter((c) => c.priceStatus === "UNKNOWN").length;

  const stats: LiaOiPipelineStats = {
    queriesRun,
    signalsRaw: allHits.length,
    filteredOut,
    duplicatesRemoved,
    afterDedup: deduped.length,
    analyzed: feed.length,
    providerErrors,
    providerUnavailable,
    catalogPagesSeen,
    catalogPagesDemoted: bucketed.counts.SOURCE_CATALOGS,
    detailPages,
    pagesFetched: enrich.stats.pagesFetched,
    pagesFetchFailed: enrich.stats.pagesFetchFailed,
    searchPasses,
    opportunityCount,
    topOpportunities: top.length,
    needsResearch: bucketed.counts.NEEDS_RESEARCH,
    sourceCatalogs: bucketed.counts.SOURCE_CATALOGS,
    rejected: bucketed.counts.REJECTED,
    overBudget,
    unknownPrice,
  };

  const request: LiaOiSearchRequest = {
    id: oiId("req"),
    query: input.query,
    plan,
    createdAt: new Date().toISOString(),
    createdBy: input.userId,
    candidateIds: feed.map((c) => c.id),
    stubMode: modeInfo.mode === "stub",
    searchMode: modeInfo.mode,
    providerLabel: modeInfo.providerLabel,
    stats,
  };

  for (const c of feed) {
    c.searchRequestId = request.id;
  }

  upsertCandidates(feed);
  saveSearchRequest(request);

  const modeLine =
    modeInfo.mode === "live"
      ? `Режим: LIVE — ${modeInfo.engine}`
      : "Режим: DEMO/STUB";

  const report: LiaOiReport = {
    id: oiId("rep"),
    kind: "search_result",
    title: `Результат поиска: ${input.query.slice(0, 80)}`,
    body: [
      modeLine,
      providerUnavailable ? LIA_OI_LIVE_UNAVAILABLE : null,
      `План: intent=${plan.intent}, регионы=${plan.regions.join(", ")}, бюджет_max=${plan.budgetMax ?? "—"}.`,
      `HARD: geo=${plan.hardConstraints?.geography}, max_budget=${plan.hardConstraints?.maxBudgetRub ?? "—"}.`,
      `Serper queries: ${stats.queriesRun} (passes=${stats.searchPasses}).`,
      `Raw: ${stats.signalsRaw}. TOP: ${stats.topOpportunities}. Research: ${stats.needsResearch}. Catalogs: ${stats.sourceCatalogs}. Rejected: ${stats.rejected}.`,
      `OVER_BUDGET: ${stats.overBudget}. UNKNOWN_PRICE: ${stats.unknownPrice}. DETAIL: ${stats.detailPages}.`,
      `safe-fetch: ok=${stats.pagesFetched ?? 0}, fail=${stats.pagesFetchFailed ?? 0}.`,
      "",
      "Search Plan queries:",
      ...plan.queries.map((q, i) => `  ${i + 1}. ${q}`),
      "",
      ...top.slice(0, 5).map(
        (c, i) =>
          `${i + 1}. [${c.contentIntent}/${c.pageType}] ${c.title} — ${c.budgetFit} · opp ${c.score.opportunity}/100`,
      ),
    ]
      .filter(Boolean)
      .join("\n"),
    stats: {
      afterDedup: stats.afterDedup,
      analyzed: stats.analyzed,
      highPriority: top.filter((c) => c.score.priority === "HIGH_PRIORITY")
        .length,
      providerErrors: stats.providerErrors,
      detailPages: stats.detailPages ?? 0,
      topOpportunities: stats.topOpportunities ?? 0,
      needsResearch: stats.needsResearch ?? 0,
      rejected: stats.rejected ?? 0,
      overBudget: stats.overBudget ?? 0,
      pagesFetched: stats.pagesFetched ?? 0,
      queriesRun: stats.queriesRun,
    },
    candidateIds: feed.map((c) => c.id),
    createdAt: new Date().toISOString(),
    stubMode: modeInfo.mode === "stub",
  };
  addReport(report);

  maybeBuildHypotheses(feed);

  return {
    request,
    plan,
    signalsScanned: stats.signalsRaw,
    afterDedup: stats.afterDedup,
    candidates: feed,
    topOpportunities: top,
    needsResearch: bucketed.needsResearch,
    sourceCatalogs: bucketed.catalogs,
    rejected: bucketed.rejected,
    stubMode: modeInfo.mode === "stub",
    searchMode: modeInfo.mode,
    providerLabel: modeInfo.providerLabel,
    stats,
    providerUnavailable,
    ownerMessage: providerUnavailable ? LIA_OI_LIVE_UNAVAILABLE : undefined,
  };
}

function maybeBuildHypotheses(candidates: LiaOiCandidate[]) {
  const land = candidates.find((c) => /земл|участ/i.test(c.title));
  const support = candidates.find((c) => /льгот|поддерж/i.test(c.title));
  const hotel = candidates.find((c) => /гостиниц|туризм/i.test(c.title));

  const hypotheses: LiaOiHypothesis[] = [];
  if (land && support) {
    hypotheses.push({
      id: oiId("hyp"),
      title: "Гипотеза: производство/переработка с опорой на льготное финансирование",
      summary:
        "Сигналы земли/площадки и программы поддержки можно собрать в проектную гипотезу. Это INFERENCE, не готовая сделка.",
      supportingCandidateIds: [land.id, support.id],
      missingPieces: [
        "Подтверждение ВРИ и коммуникаций",
        "Реальный инвестор/оператор",
        "Финансовая модель",
      ],
      investmentScale: "15–40 млн ₽ (оценка, ESTIMATE)",
      createdAt: new Date().toISOString(),
      status: "DRAFT",
    });
  }
  if (hotel) {
    hypotheses.push({
      id: oiId("hyp"),
      title: "Гипотеза: туристический объект + партнёр ЦКР",
      summary:
        "Карточка гостиницы/туризма может сочетаться с инвестором/управляющей командой из базы ЦКР (matching — отдельный этап).",
      supportingCandidateIds: [hotel.id],
      missingPieces: ["Сезонность и загрузка", "Юридическая структура"],
      investmentScale: hotel.askingPrice
        ? `${Math.round(hotel.askingPrice / 1_000_000)}+ млн ₽`
        : "уточняется",
      createdAt: new Date().toISOString(),
      status: "DRAFT",
    });
  }
  if (hypotheses.length) setHypotheses(hypotheses);
}

/**
 * Seed только для STUB-режима (demo-лента).
 * В LIVE не подмешиваем stub-корпус.
 */
export async function ensureLiaOiSeed(userId = "system"): Promise<void> {
  const store = getLiaOiStore();
  if (store.seeded) return;

  const mode = resolveOiSearchMode();
  if (mode.mode === "live") {
    store.seeded = true;
    return;
  }

  await runOwnerSearchPipeline({
    query: "Инвестор ищет проект до 30 млн рублей по России",
    userId,
  });
  const candidates = listCandidates();
  const digest = buildDigestReport(candidates);
  addReport(digest);
  store.seeded = true;
}

export function buildDigestReport(candidates: LiaOiCandidate[]): LiaOiReport {
  const mode = resolveOiSearchMode();
  const high = candidates.filter((c) => c.score.priority === "HIGH_PRIORITY");
  const interesting = candidates.filter((c) => c.score.overall >= 55);
  const stubOnly = candidates.every((c) => c.isStub);
  return {
    id: oiId("rep"),
    kind: "daily_digest",
    title: `ЛИЯ · Дайджест ${mode.mode === "live" ? "LIVE" : "stub"} · ${new Date().toLocaleDateString("ru-RU")}`,
    body: [
      mode.mode === "live"
        ? `Внешний поиск: LIVE — ${mode.engine}`
        : "Внешний поиск в demo/stub режиме.",
      stubOnly && mode.mode === "live"
        ? "Внимание: в ленте пока только stub-карточки (не смешивать с live без проверки)."
        : null,
      "",
      `Просмотрено сигналов: ${Math.max(candidates.length * 3, candidates.length)}`,
      `После dedup: ${candidates.length}`,
      `Проанализировано: ${candidates.length}`,
      `Рекомендую посмотреть: ${interesting.length}`,
      `Высокий приоритет: ${high.length}`,
      `Новых бизнес-гипотез: ${getLiaOiStore().hypotheses.length}`,
      "",
      "ТОП:",
      ...candidates.slice(0, 5).map(
        (c, i) =>
          `${i + 1}. ${c.title} · ${c.isStub ? "STUB" : "LIVE"} · потенциал ${c.score.overall}/100`,
      ),
    ]
      .filter(Boolean)
      .join("\n"),
    stats: {
      afterDedup: candidates.length,
      analyzed: candidates.length,
      worthAttention: interesting.length,
      highPriority: high.length,
      hypotheses: getLiaOiStore().hypotheses.length,
    },
    candidateIds: candidates.map((c) => c.id),
    createdAt: new Date().toISOString(),
    stubMode: mode.mode === "stub",
  };
}

export function getTodayStats(): LiaOiTodayStats {
  const mode = resolveOiSearchMode();
  const candidates = listCandidates();
  const interesting = candidates.filter((c) => c.score.overall >= 55);
  const high = candidates.filter((c) => c.score.priority === "HIGH_PRIORITY");
  return {
    signalsScanned: candidates.length
      ? Math.max(candidates.length * 3, candidates.length)
      : 0,
    newAfterDedup: candidates.length,
    analyzed: candidates.length,
    worthAttention: interesting.length,
    highPriority: high.length,
    newHypotheses: getLiaOiStore().hypotheses.length,
    stubMode: mode.mode === "stub",
    searchMode: mode.mode,
    providerLabel: mode.providerLabel,
    generatedAt: new Date().toISOString(),
  };
}

export function getRecommendedCandidates(limit = 5): LiaOiCandidate[] {
  return listCandidates()
    .filter((c) => c.resultBucket === "TOP_OPPORTUNITIES" || !c.resultBucket)
    .slice(0, limit);
}
