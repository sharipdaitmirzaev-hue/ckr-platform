import { LIA_OI_BUDGETS } from "@/config/lia-oi";
import { analyzeCandidate } from "@/lib/lia/oi/analyze";
import { dedupeCandidates } from "@/lib/lia/oi/dedup";
import { oiId } from "@/lib/lia/oi/id";
import { getInternetSearchProvider } from "@/lib/lia/oi/internet/stub";
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
  LiaOiReport,
  LiaOiSearchRequest,
  LiaOiTodayStats,
} from "@/types/lia-oi";

export type LiaOiSearchPipelineResult = {
  request: LiaOiSearchRequest;
  plan: LiaOiSearchRequest["plan"];
  signalsScanned: number;
  afterDedup: number;
  candidates: LiaOiCandidate[];
  stubMode: true;
};

/**
 * Режим A: запрос владельца → plan → stub search → normalize → dedup → analyze → score.
 */
export async function runOwnerSearchPipeline(input: {
  query: string;
  userId: string;
}): Promise<LiaOiSearchPipelineResult> {
  const plan = buildSearchPlan(input.query);
  const provider = getInternetSearchProvider();
  const limit = Math.ceil(
    LIA_OI_BUDGETS.maxCandidatesPerRun / Math.max(plan.queries.length, 1),
  );

  const hitChunks = await Promise.all(
    plan.queries.map((q) =>
      provider.search(q, {
        limit: Math.max(2, limit),
        budgetMax: plan.budgetMax,
        region: plan.regions[0],
      }),
    ),
  );
  const hits = hitChunks.flat();
  const normalized = hits.map(normalizeHit);
  const deduped = dedupeCandidates(normalized).slice(
    0,
    LIA_OI_BUDGETS.maxCandidatesPerRun,
  );

  const analyzed = deduped
    .slice(0, LIA_OI_BUDGETS.maxAiAnalysesPerRun)
    .map((c) => analyzeCandidate(c, plan));

  for (const c of analyzed) {
    c.searchRequestId = undefined;
  }

  const request: LiaOiSearchRequest = {
    id: oiId("req"),
    query: input.query,
    plan,
    createdAt: new Date().toISOString(),
    createdBy: input.userId,
    candidateIds: analyzed.map((c) => c.id),
    stubMode: true,
  };

  for (const c of analyzed) {
    c.searchRequestId = request.id;
  }

  upsertCandidates(analyzed);
  saveSearchRequest(request);

  const report: LiaOiReport = {
    id: oiId("rep"),
    kind: "search_result",
    title: `Результат поиска: ${input.query.slice(0, 80)}`,
    body: [
      "Режим: StubInternetSearchProvider (demo).",
      `План: intent=${plan.intent}, регионы=${plan.regions.join(", ")}, бюджет_max=${plan.budgetMax ?? "—"}.`,
      `Сигналов: ${hits.length}. После dedup: ${deduped.length}. В ленту: ${analyzed.length}.`,
      "",
      ...analyzed.slice(0, 5).map(
        (c, i) =>
          `${i + 1}. ${c.title} — потенциал ${c.score.overall}/100, уверенность ${c.score.confidence}/100.`,
      ),
    ].join("\n"),
    stats: {
      signals: hits.length,
      afterDedup: deduped.length,
      analyzed: analyzed.length,
      highPriority: analyzed.filter((c) => c.score.priority === "HIGH_PRIORITY")
        .length,
    },
    candidateIds: analyzed.map((c) => c.id),
    createdAt: new Date().toISOString(),
    stubMode: true,
  };
  addReport(report);

  maybeBuildHypotheses(analyzed);

  return {
    request,
    plan,
    signalsScanned: hits.length,
    afterDedup: deduped.length,
    candidates: analyzed,
    stubMode: true,
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
        "Stub-сигналы земли/площадки и программы поддержки можно собрать в проектную гипотезу. Это INFERENCE, не готовая сделка.",
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
        "Stub-карточка гостиницы может сочетаться с инвестором/управляющей командой из базы ЦКР (matching — этап 3).",
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

/** Гарантирует, что в кабинете есть демо-лента даже до первого поиска. */
export async function ensureLiaOiSeed(userId = "system"): Promise<void> {
  const store = getLiaOiStore();
  if (store.seeded && store.candidates.size > 0) return;
  await runOwnerSearchPipeline({
    query: "Инвестор ищет проект до 30 млн рублей по России",
    userId,
  });
  // дайджест
  const candidates = listCandidates();
  const digest = buildDigestReport(candidates);
  addReport(digest);
  store.seeded = true;
}

export function buildDigestReport(candidates: LiaOiCandidate[]): LiaOiReport {
  const high = candidates.filter((c) => c.score.priority === "HIGH_PRIORITY");
  const interesting = candidates.filter((c) => c.score.overall >= 55);
  return {
    id: oiId("rep"),
    kind: "daily_digest",
    title: `ЛИЯ · Дайджест stub-разведки · ${new Date().toLocaleDateString("ru-RU")}`,
    body: [
      "Внешний поиск в demo/stub режиме.",
      "",
      `Просмотрено сигналов (stub): ${Math.max(candidates.length * 12, 40)}`,
      `Новых релевантных после dedup: ${candidates.length}`,
      `Глубоко проанализировано: ${candidates.length}`,
      `Рекомендую посмотреть: ${interesting.length}`,
      `Высокий приоритет: ${high.length}`,
      `Новых бизнес-гипотез: ${getLiaOiStore().hypotheses.length}`,
      "",
      "ТОП:",
      ...candidates.slice(0, 5).map(
        (c, i) =>
          `${i + 1}. ${c.title} · потенциал ${c.score.overall}/100 · уверенность ${c.score.confidence}/100`,
      ),
    ].join("\n"),
    stats: {
      signals: Math.max(candidates.length * 12, 40),
      afterDedup: candidates.length,
      analyzed: candidates.length,
      worthAttention: interesting.length,
      highPriority: high.length,
      hypotheses: getLiaOiStore().hypotheses.length,
    },
    candidateIds: candidates.map((c) => c.id),
    createdAt: new Date().toISOString(),
    stubMode: true,
  };
}

export function getTodayStats(): LiaOiTodayStats {
  const candidates = listCandidates();
  const interesting = candidates.filter((c) => c.score.overall >= 55);
  const high = candidates.filter((c) => c.score.priority === "HIGH_PRIORITY");
  return {
    signalsScanned: Math.max(candidates.length * 12, candidates.length ? 40 : 0),
    newAfterDedup: candidates.length,
    analyzed: candidates.length,
    worthAttention: interesting.length,
    highPriority: high.length,
    newHypotheses: getLiaOiStore().hypotheses.length,
    stubMode: true,
    generatedAt: new Date().toISOString(),
  };
}

export function getRecommendedCandidates(limit = 5): LiaOiCandidate[] {
  return listCandidates().slice(0, limit);
}
