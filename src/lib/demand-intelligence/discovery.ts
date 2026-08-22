/**
 * Stage 4M — manual demand discovery from CKR Request / Need.
 * Wraps existing LIA OI pipeline. No Scheduler. No auto-publish.
 */

import {
  buildDemandQueryPlan,
  primaryDemandQuery,
} from "@/lib/demand-intelligence/query-planner";
import {
  demandTierLabelRu,
  evaluateDemandQuality,
} from "@/lib/demand-intelligence/quality";
import { classifyDemandSignal } from "@/lib/lia/oi/regional/demand-classify";
import { runOwnerSearchPipeline } from "@/lib/lia/oi/pipeline";
import { listCandidates } from "@/lib/lia/oi/store";
import { isFixtureNoise } from "@/lib/personalized-feed/fixtures";
import type { NeedProfile } from "@/types/need-profile";
import type { LiaOiCandidate } from "@/types/lia-oi";

export type DemandDiscoverySummary = {
  queriesPlanned: number;
  primaryQuery: string;
  querySamples: string[];
  found: number;
  newCandidates: number;
  duplicates: number;
  needsReview: number;
  strong: number;
  confirmedDemand: number;
  potentialBuyer: number;
  weak: number;
  expired: number;
  smoke: number;
  autoPublish: false;
  note: string;
};

function summarizeAgainstNeed(
  candidates: LiaOiCandidate[],
  need: NeedProfile,
): Omit<
  DemandDiscoverySummary,
  | "queriesPlanned"
  | "primaryQuery"
  | "querySamples"
  | "found"
  | "newCandidates"
  | "duplicates"
  | "autoPublish"
  | "note"
> {
  let needsReview = 0;
  let strong = 0;
  let confirmedDemand = 0;
  let potentialBuyer = 0;
  let weak = 0;
  let expired = 0;
  let smoke = 0;

  for (const c of candidates) {
    if (
      c.isStub ||
      isFixtureNoise({
        id: c.id,
        title: c.title,
        summary: c.description,
        fingerprint: c.fingerprint,
      })
    ) {
      smoke += 1;
      continue;
    }
    const q = evaluateDemandQuality({
      candidate: {
        id: c.id,
        title: c.title,
        summary: c.description,
        region: c.region,
        opportunityType: c.opportunityType,
        pageType: c.pageType,
        url: c.canonicalUrl,
        deadlineAt: c.deadlineAt,
        amountKnown: c.nmck != null || c.askingPrice != null,
        customer: c.customer,
        officialId: c.sourceObjectId,
        isStub: c.isStub,
      },
      needRegions: need.regions,
      needIndustries: need.industries,
      needKeywords: need.keywords,
      published: false,
    });
    if (q.bucket === "EXPIRED") expired += 1;
    else if (q.bucket === "SMOKE") smoke += 1;
    else if (q.bucket === "REAL_GOOD") strong += 1;
    else if (q.bucket === "REAL_ACCEPTABLE") needsReview += 1;
    else weak += 1;

    const dem =
      c.demandClassification ||
      classifyDemandSignal({
        title: c.title,
        description: c.description,
        url: c.canonicalUrl,
        pageType: c.pageType,
        opportunityType: c.opportunityType,
      }).classification;
    if (dem === "CONFIRMED_DEMAND") confirmedDemand += 1;
    if (dem === "POTENTIAL_BUYER") potentialBuyer += 1;
  }

  return {
    needsReview,
    strong,
    confirmedDemand,
    potentialBuyer,
    weak,
    expired,
    smoke,
  };
}

/**
 * Manual owner discovery for a request's Need Profile.
 * Does NOT publish. Does NOT mutate the CKR request.
 */
export async function runDemandDiscoveryForNeed(input: {
  need: NeedProfile;
  userId: string;
  maxQueries?: number;
}): Promise<DemandDiscoverySummary> {
  const before = await listCandidates();
  const beforeIds = new Set(before.map((c) => c.id));

  const plan = buildDemandQueryPlan({
    need: input.need,
    maxQueries: input.maxQueries ?? 8,
  });
  const primaryQuery = primaryDemandQuery(plan);

  await runOwnerSearchPipeline({
    query: primaryQuery,
    userId: input.userId,
    need: {
      intentType: input.need.intentType,
      regions: input.need.regions,
      industries: input.need.industries,
      budgetMax: input.need.budgetMax,
      budgetMin: input.need.budgetMin,
      title: input.need.title,
    },
    regionalFirst: true,
  });

  const after = await listCandidates();
  const newOnes = after.filter((c) => !beforeIds.has(c.id));
  const stats = summarizeAgainstNeed(after, input.need);

  return {
    queriesPlanned: plan.queries.length,
    primaryQuery,
    querySamples: plan.queries.slice(0, 8).map((q) => q.query),
    found: after.length,
    newCandidates: newOnes.length,
    duplicates: Math.max(0, after.length - before.length - newOnes.length),
    ...stats,
    // Heuristic: if list grew less than newOnes unique, rest were deduped in pipeline
    autoPublish: false,
    note:
      "Поиск выполнен вручную. Результаты в LIA OI / Controlled Publish. Автопубликации нет.",
  };
}

export function formatDiscoverySummaryRu(s: DemandDiscoverySummary): string {
  return [
    `Запросов в плане: ${s.queriesPlanned}`,
    `Основной запрос: ${s.primaryQuery}`,
    `Найдено в OI (всего): ${s.found}`,
    `Новых: ${s.newCandidates}`,
    `Сильных: ${s.strong}`,
    `Требуют проверки: ${s.needsReview}`,
    `Confirmed demand: ${s.confirmedDemand}`,
    `Potential buyer: ${s.potentialBuyer}`,
    `Слабых: ${s.weak}`,
    `Истёкших: ${s.expired}`,
    `Smoke/stub: ${s.smoke}`,
    `Автопубликация: нет`,
  ].join("\n");
}

export { demandTierLabelRu };
