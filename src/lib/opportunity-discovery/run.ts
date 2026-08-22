/**
 * Stage 4O — Discovery orchestrator.
 * INTERNAL-FIRST. External only on explicit owner action.
 */

import { isNoiseRealness } from "@/lib/opportunity-discovery/candidate";
import { dedupeCandidates } from "@/lib/opportunity-discovery/dedup";
import { runExternalSearch, type ExternalSearchHooks } from "@/lib/opportunity-discovery/external";
import { searchInternalCatalog } from "@/lib/opportunity-discovery/internal";
import { runInternalSearch } from "@/lib/opportunity-discovery/internal-db";
import {
  buildSearchPlan,
  isInternalSufficient,
} from "@/lib/opportunity-discovery/plan";
import type {
  DiscoveryCandidate,
  DiscoveryRunMetrics,
  DiscoveryRunResult,
  InternalCatalogRow,
  OpportunitySearchContext,
} from "@/lib/opportunity-discovery/types";

export type RunDiscoveryInput = {
  context: OpportunitySearchContext;
  userId: string;
  /** Owner must set true to hit external / internet. */
  expandExternal?: boolean;
  catalog?: InternalCatalogRow[];
  externalHooks?: ExternalSearchHooks;
};

function countSuitability(list: DiscoveryCandidate[]) {
  return {
    suitable: list.filter((c) => c.suitability === "SUITABLE").length,
    possible: list.filter((c) => c.suitability === "POSSIBLE").length,
    needsCheck: list.filter((c) => c.suitability === "NEEDS_CHECK").length,
    weak: list.filter((c) => c.suitability === "WEAK").length,
    rejected: list.filter((c) => c.suitability === "NOT_SUITABLE").length,
  };
}

function countRealness(list: DiscoveryCandidate[]) {
  return {
    real: list.filter((c) => c.realness === "REAL" || c.realness === "UNKNOWN")
      .length,
    seed: list.filter((c) => c.realness === "SEED").length,
    smoke: list.filter((c) => c.realness === "SMOKE").length,
    stub: list.filter((c) => c.realness === "STUB" || c.realness === "DEMO")
      .length,
  };
}

function buildMetrics(input: {
  mode: OpportunitySearchContext["mode"];
  startedAt: string;
  finishedAt: string;
  internalSources: number;
  externalQueries: number;
  results: number;
  newCandidates: number;
  duplicates: number;
  list: DiscoveryCandidate[];
}): DiscoveryRunMetrics {
  const suit = countSuitability(input.list);
  const real = countRealness(input.list);
  return {
    mode: input.mode,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    durationMs: Math.max(
      0,
      new Date(input.finishedAt).getTime() -
        new Date(input.startedAt).getTime(),
    ),
    internalSources: input.internalSources,
    externalQueries: input.externalQueries,
    results: input.results,
    detailAttempts: 0,
    detailSuccess: 0,
    newCandidates: input.newCandidates,
    duplicates: input.duplicates,
    good: suit.suitable,
    acceptable: suit.possible + suit.needsCheck,
    weak: suit.weak,
    rejected: suit.rejected,
    real: real.real,
    seed: real.seed,
    smoke: real.smoke,
    stub: real.stub,
    autoPublish: false,
    autoOutreach: false,
    matchingEngine: false,
    scheduler: false,
  };
}

/**
 * Pure/sync path for unit tests (catalog + optional external hook results).
 */
export function runDiscoverySync(input: {
  context: OpportunitySearchContext;
  catalog: InternalCatalogRow[];
  expandExternal?: boolean;
  externalCandidates?: DiscoveryCandidate[];
}): DiscoveryRunResult {
  const startedAt = new Date().toISOString();
  const plan = buildSearchPlan(input.context, {
    includeExternal: input.expandExternal === true,
  });

  const internal = searchInternalCatalog(input.context, {
    catalog: input.catalog,
  }).filter((c) => !isNoiseRealness(c.realness));

  const suit = countSuitability(internal);
  const internalSufficient = isInternalSufficient(suit);

  let external: DiscoveryCandidate[] = [];
  let externalRan = false;
  if (input.expandExternal) {
    externalRan = true;
    external = (input.externalCandidates ?? []).filter(
      (c) => !isNoiseRealness(c.realness),
    );
  }

  const { kept, duplicates } = dedupeCandidates([...internal, ...external]);
  const finishedAt = new Date().toISOString();

  return {
    plan,
    context: input.context,
    internal,
    external,
    candidates: kept,
    metrics: buildMetrics({
      mode: input.context.mode,
      startedAt,
      finishedAt,
      internalSources: 7,
      externalQueries: externalRan ? 1 : 0,
      results: kept.length,
      newCandidates: external.length,
      duplicates,
      list: kept,
    }),
    internalSufficient,
    externalRan,
    noteRu: externalRan
      ? internalSufficient
        ? "Внутренних вариантов достаточно; внешний поиск выполнен по запросу владельца."
        : "Внутренних вариантов мало — выполнен расширенный поиск."
      : internalSufficient
        ? "Внутри ЦКР есть варианты. Расширение в интернет — только по действию владельца."
        : "Внутри ЦКР мало вариантов. Рекомендуется «Расширить поиск».",
  };
}

/** Async live orchestrator. */
export async function runDiscovery(
  input: RunDiscoveryInput,
): Promise<DiscoveryRunResult> {
  const startedAt = new Date().toISOString();
  const expandExternal = input.expandExternal === true;
  const plan = buildSearchPlan(input.context, { includeExternal: expandExternal });

  const internalResult = await runInternalSearch(input.context, {
    catalog: input.catalog,
  });
  const internal = internalResult.candidates.filter(
    (c) => !isNoiseRealness(c.realness),
  );
  const suit = countSuitability(internal);
  const internalSufficient = isInternalSufficient(suit);

  let external: DiscoveryCandidate[] = [];
  let externalQueries = 0;
  let newFromPipeline = 0;
  let externalRan = false;

  if (expandExternal) {
    externalRan = true;
    const ext = await runExternalSearch(input.context, {
      primaryQuery: plan.primaryQuery,
      userId: input.userId,
      hooks: input.externalHooks,
      maxCandidates: plan.costBudget.maxNewCandidates,
    });
    external = ext.candidates;
    externalQueries = ext.externalQueries;
    newFromPipeline = ext.newFromPipeline;
  }

  const { kept, duplicates } = dedupeCandidates([...internal, ...external]);
  const finishedAt = new Date().toISOString();

  return {
    plan,
    context: input.context,
    internal,
    external,
    candidates: kept,
    metrics: buildMetrics({
      mode: input.context.mode,
      startedAt,
      finishedAt,
      internalSources: internalResult.sourcesQueried,
      externalQueries,
      results: kept.length,
      newCandidates: newFromPipeline || external.length,
      duplicates,
      list: kept,
    }),
    internalSufficient,
    externalRan,
    noteRu: externalRan
      ? "Поиск: ЦКР → внешние источники (owner action). Автопубликации и outreach нет."
      : "Выполнен только внутренний поиск ЦКР. Внешний — по кнопке «Расширить поиск».",
  };
}

export function formatDiscoveryRunRu(r: DiscoveryRunResult): string {
  const m = r.metrics;
  return [
    `Режим: ${r.context.mode}`,
    `Запрос: ${r.plan.primaryQuery}`,
    `Fingerprint: ${r.plan.contextFingerprint}`,
    `Внутренних: ${r.internal.length} (достаточно: ${r.internalSufficient ? "да" : "нет"})`,
    `Внешний PASS: ${r.externalRan ? "да" : "нет"} → ${r.external.length}`,
    `После dedup: ${r.candidates.length} (дубли: ${m.duplicates})`,
    `GOOD/ACCEPTABLE/WEAK: ${m.good}/${m.acceptable}/${m.weak}`,
    `REAL/SEED/SMOKE/STUB: ${m.real}/${m.seed}/${m.smoke}/${m.stub}`,
    `External queries: ${m.externalQueries}`,
    `Автопубликация: нет · Outreach: нет · Matching: нет · Scheduler: нет`,
    r.noteRu,
  ].join("\n");
}
