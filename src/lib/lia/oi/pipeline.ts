import { LIA_OI_BUDGETS, LIA_OI_LIVE_UNAVAILABLE } from "@/config/lia-oi";
import { analyzeCandidate } from "@/lib/lia/oi/analyze";
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
import { buildSearchPlan } from "@/lib/lia/oi/planner";
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

  for (const q of queries.slice(0, LIA_OI_BUDGETS.maxQueriesPerPlan)) {
    try {
      const chunk = await provider.search(q, {
        limit: options.limit,
        budgetMax: options.budgetMax,
        region: options.region,
      });
      hits.push(...chunk);
    } catch (error) {
      errors += 1;
      // Не логируем API key / body
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

/**
 * Запрос владельца → plan → (stub|live) search → filter → normalize → dedup → analyze → score.
 */
export async function runOwnerSearchPipeline(input: {
  query: string;
  userId: string;
}): Promise<LiaOiSearchPipelineResult> {
  const modeInfo = resolveOiSearchMode();
  const plan = buildSearchPlan(input.query);
  const perQueryLimit = Math.min(
    LIA_OI_BUDGETS.maxResultsPerQuery,
    Math.max(
      2,
      Math.ceil(
        LIA_OI_BUDGETS.maxCandidatesPerRun / Math.max(plan.queries.length, 1),
      ),
    ),
  );

  const { hits: rawHits, errors, fatal } = await searchAllQueries(plan.queries, {
    limit: perQueryLimit,
    budgetMax: plan.budgetMax ?? null,
    region: plan.regions[0],
  });

  const providerUnavailable = fatal && modeInfo.mode === "live";
  if (providerUnavailable) {
    console.error(
      "[lia-oi] external search unavailable for owner run; mode=live",
    );
  }

  const { hits: filtered, stats: filterStats } = cheapFilterHits(rawHits, {
    budgetMax: plan.budgetMax,
  });

  const normalized = filtered.map(normalizeHit);
  // Не смешиваем stub и live в одном run без маркировки — provider один на run.
  const beforeDedup = normalized.length;
  const deduped = dedupeCandidates(normalized).slice(
    0,
    LIA_OI_BUDGETS.maxCandidatesPerRun,
  );
  const duplicatesRemoved = Math.max(0, beforeDedup - deduped.length);

  const catalogPagesSeen = deduped.filter((c) => c.isCatalogSource).length;

  // Предварительный score → выбор TOP DETAIL для safe-fetch
  const working = deduped
    .slice(0, LIA_OI_BUDGETS.maxAiAnalysesPerRun)
    .map((c) => analyzeCandidate(c, plan))
    .sort((a, b) => b.score.overall - a.score.overall);

  const enrich =
    modeInfo.mode === "live"
      ? await enrichTopDetailCandidates(working)
      : { candidates: working, stats: { pagesFetched: 0, pagesFetchFailed: 0 } };

  // После enrichment — пересчёт анализа/score
  const analyzed = enrich.candidates
    .map((c) => analyzeCandidate(c, plan))
    .sort((a, b) => {
      // DETAIL выше каталогов при близком overall
      if (a.isCatalogSource !== b.isCatalogSource) {
        return a.isCatalogSource ? 1 : -1;
      }
      return b.score.overall - a.score.overall;
    });

  const detailPages = analyzed.filter((c) => c.pageType === "DETAIL").length;
  const catalogPagesDemoted = analyzed.filter((c) => c.isCatalogSource).length;

  const stats: LiaOiPipelineStats = {
    queriesRun: Math.min(plan.queries.length, LIA_OI_BUDGETS.maxQueriesPerPlan),
    signalsRaw: rawHits.length,
    filteredOut:
      filterStats.droppedEmpty +
      filterStats.droppedUrl +
      filterStats.droppedJunk +
      filterStats.droppedBudget,
    duplicatesRemoved,
    afterDedup: deduped.length,
    analyzed: analyzed.length,
    providerErrors: errors,
    providerUnavailable,
    catalogPagesSeen,
    catalogPagesDemoted,
    detailPages,
    pagesFetched: enrich.stats.pagesFetched,
    pagesFetchFailed: enrich.stats.pagesFetchFailed,
  };

  const request: LiaOiSearchRequest = {
    id: oiId("req"),
    query: input.query,
    plan,
    createdAt: new Date().toISOString(),
    createdBy: input.userId,
    candidateIds: analyzed.map((c) => c.id),
    stubMode: modeInfo.mode === "stub",
    searchMode: modeInfo.mode,
    providerLabel: modeInfo.providerLabel,
    stats,
  };

  for (const c of analyzed) {
    c.searchRequestId = request.id;
  }

  upsertCandidates(analyzed);
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
      `Гипотез/запросов: ${stats.queriesRun}.`,
      `Интернет-результатов: ${stats.signalsRaw}. Отброшено фильтром: ${stats.filteredOut}. Дублей: ${stats.duplicatesRemoved}.`,
      `После dedup: ${stats.afterDedup}. Проанализировано: ${stats.analyzed}.`,
      `DETAIL: ${stats.detailPages ?? 0}. Каталогов (понижены): ${stats.catalogPagesDemoted ?? 0}.`,
      `safe-fetch: ok=${stats.pagesFetched ?? 0}, fail=${stats.pagesFetchFailed ?? 0}.`,
      "",
      "Search Plan queries:",
      ...plan.queries.map((q, i) => `  ${i + 1}. ${q}`),
      "",
      ...analyzed.slice(0, 5).map(
        (c, i) =>
          `${i + 1}. [${c.pageType}] ${c.title} — opp ${c.score.opportunity}/100, quality ${c.score.quality}% · ${c.isStub ? "STUB" : "LIVE"}`,
      ),
    ]
      .filter(Boolean)
      .join("\n"),
    stats: {
      signals: stats.signalsRaw,
      filteredOut: stats.filteredOut,
      duplicatesRemoved: stats.duplicatesRemoved,
      afterDedup: stats.afterDedup,
      analyzed: stats.analyzed,
      highPriority: analyzed.filter((c) => c.score.priority === "HIGH_PRIORITY")
        .length,
      providerErrors: stats.providerErrors,
      detailPages: stats.detailPages ?? 0,
      catalogPagesDemoted: stats.catalogPagesDemoted ?? 0,
      pagesFetched: stats.pagesFetched ?? 0,
    },
    candidateIds: analyzed.map((c) => c.id),
    createdAt: new Date().toISOString(),
    stubMode: modeInfo.mode === "stub",
  };
  addReport(report);

  maybeBuildHypotheses(analyzed);

  return {
    request,
    plan,
    signalsScanned: stats.signalsRaw,
    afterDedup: stats.afterDedup,
    candidates: analyzed,
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
  return listCandidates().slice(0, limit);
}
