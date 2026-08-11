/**
 * Merge Serper discovery + Official API structured data by official id.
 * Official fields win conflicts; both provenances are kept.
 */

import { computeDataQuality } from "@/lib/lia/oi/enrichment/quality";
import { canonicalUrl } from "@/lib/lia/oi/normalize";
import type { LiaOiCandidate, LiaOiStructuredField } from "@/types/lia-oi";

const SOURCE_RANK: Record<string, number> = {
  official_api: 100,
  official_page: 80,
  fixture: 70,
  search_snippet: 40,
  unknown: 10,
};

function fieldRank(f: LiaOiStructuredField): number {
  return (SOURCE_RANK[f.source] ?? 0) + f.confidence;
}

export function mergeStructuredFieldsPreferOfficial(
  a: LiaOiStructuredField[] = [],
  b: LiaOiStructuredField[] = [],
): LiaOiStructuredField[] {
  const map = new Map<string, LiaOiStructuredField>();
  for (const f of [...a, ...b]) {
    const prev = map.get(f.field);
    if (!prev || fieldRank(f) >= fieldRank(prev)) map.set(f.field, f);
  }
  return [...map.values()];
}

function preferOfficialScalar<T>(
  official: T | null | undefined,
  fallback: T | null | undefined,
): T | null | undefined {
  if (official != null && official !== "") return official;
  return fallback;
}

function isOfficialChannel(c: LiaOiCandidate): boolean {
  return (
    c.dataChannel === "OFFICIAL_API" ||
    (c.structuredFields || []).some((f) => f.source === "official_api") ||
    Boolean(c.officialApiProvider && c.dataChannel !== "SERPER_DISCOVERY")
  );
}

function officialId(c: LiaOiCandidate): string | null {
  if (c.sourceObjectId) return String(c.sourceObjectId);
  const fromFields = (c.structuredFields || []).find(
    (f) =>
      (f.field === "procurement_id" || f.field === "lot_id") &&
      f.value != null &&
      f.value !== "",
  );
  return fromFields ? String(fromFields.value) : null;
}

export function sameOfficialIdentity(
  a: LiaOiCandidate,
  b: LiaOiCandidate,
): boolean {
  const idA = officialId(a);
  const idB = officialId(b);
  if (!idA || !idB || idA !== idB) return false;

  const typeA = a.opportunityType || "";
  const typeB = b.opportunityType || "";
  if (typeA && typeB && typeA !== typeB && typeA !== "WEB_LISTING" && typeB !== "WEB_LISTING") {
    return false;
  }
  return true;
}

/**
 * Merge two candidates that share procurement_id / lot_id.
 * Official structured values override Serper snippet values.
 */
export function mergeSerperWithOfficial(
  left: LiaOiCandidate,
  right: LiaOiCandidate,
): LiaOiCandidate {
  const official = isOfficialChannel(left)
    ? left
    : isOfficialChannel(right)
      ? right
      : left.sourceConfidence >= (right.sourceConfidence ?? 0)
        ? left
        : right;
  const discovery = official === left ? right : left;

  const structuredFields = mergeStructuredFieldsPreferOfficial(
    left.structuredFields,
    right.structuredFields,
  );

  const sources = (() => {
    const map = new Map<string, LiaOiCandidate["sources"][0]>();
    for (const s of [...discovery.sources, ...official.sources]) {
      // Keep Serper + Official even when URL matches — provenance of both channels.
      const key = `${canonicalUrl(s.url).toLowerCase()}|${(s.name || "").toLowerCase()}`;
      if (!map.has(key)) map.set(key, s);
    }
    return Array.from(map.values());
  })();

  const resolvedChannel = structuredFields.some((f) => f.source === "official_api")
    ? ("OFFICIAL_API" as const)
    : official.dataChannel === "FIXTURE_DEMO"
      ? ("FIXTURE_DEMO" as const)
      : discovery.dataChannel === "OFFICIAL_API"
        ? ("OFFICIAL_API" as const)
        : discovery.dataChannel === "FIXTURE_DEMO"
          ? ("FIXTURE_DEMO" as const)
          : ("SERPER_DISCOVERY" as const);

  const merged: LiaOiCandidate = {
    ...discovery,
    ...official,
    id: discovery.id || official.id,
    firstSeenAt: discovery.firstSeenAt || official.firstSeenAt,
    lastSeenAt: new Date().toISOString(),
    title: preferOfficialScalar(official.title, discovery.title) || official.title,
    description:
      (official.description?.length || 0) >= (discovery.description?.length || 0)
        ? official.description
        : discovery.description,
    summary: official.summary || discovery.summary,
    region: preferOfficialScalar(official.region, discovery.region) as
      | string
      | undefined,
    askingPrice: preferOfficialScalar(
      official.askingPrice,
      discovery.askingPrice,
    ) as number | null,
    nmck: preferOfficialScalar(official.nmck, discovery.nmck) as number | null,
    startingPrice: preferOfficialScalar(
      official.startingPrice,
      discovery.startingPrice,
    ) as number | null,
    currentPrice: preferOfficialScalar(
      official.currentPrice,
      discovery.currentPrice,
    ) as number | null,
    deadlineAt: preferOfficialScalar(
      official.deadlineAt,
      discovery.deadlineAt,
    ) as string | null,
    daysRemaining: preferOfficialScalar(
      official.daysRemaining,
      discovery.daysRemaining,
    ) as number | null,
    customer: preferOfficialScalar(official.customer, discovery.customer) as
      | string
      | null,
    organizer: preferOfficialScalar(official.organizer, discovery.organizer) as
      | string
      | null,
    procurementStage: preferOfficialScalar(
      official.procurementStage,
      discovery.procurementStage,
    ) as string | null,
    auctionStatus: preferOfficialScalar(
      official.auctionStatus,
      discovery.auctionStatus,
    ) as string | null,
    sourceObjectId: official.sourceObjectId || discovery.sourceObjectId,
    canonicalUrl: official.canonicalUrl || discovery.canonicalUrl,
    isOfficialSource: true,
    sourceAdapterId:
      official.sourceAdapterId && official.sourceAdapterId !== "serper_general"
        ? official.sourceAdapterId
        : discovery.sourceAdapterId || official.sourceAdapterId,
    opportunityType:
      official.opportunityType && official.opportunityType !== "WEB_LISTING"
        ? official.opportunityType
        : discovery.opportunityType || official.opportunityType,
    sourceConfidence: Math.max(
      official.sourceConfidence ?? 0,
      discovery.sourceConfidence ?? 0,
      official.score.confidence,
      discovery.score.confidence,
    ),
    // opportunity score stays from analyzer path — take max of existing, do not inflate
    score: {
      ...official.score,
      opportunity: Math.max(
        official.score.opportunity ?? 0,
        discovery.score.opportunity ?? 0,
      ),
      overall: Math.max(official.score.overall, discovery.score.overall),
      confidence: Math.max(
        official.sourceConfidence ?? official.score.confidence,
        discovery.sourceConfidence ?? discovery.score.confidence,
      ),
      quality: Math.max(official.score.quality, discovery.score.quality),
      explanation: Array.from(
        new Set([
          ...official.score.explanation,
          ...discovery.score.explanation,
          "Объединены Serper discovery и официальные структурированные поля.",
        ]),
      ),
      breakdown: {
        ...official.score.breakdown,
        sourceConfidence: Math.max(
          official.score.breakdown.sourceConfidence,
          discovery.score.breakdown.sourceConfidence,
        ),
      },
    },
    sources,
    claims: [...discovery.claims, ...official.claims],
    structuredFields,
    dataChannel: resolvedChannel,
    officialApiProvider:
      official.officialApiProvider || discovery.officialApiProvider,
    officialApiStatus:
      official.officialApiStatus || discovery.officialApiStatus,
    matchingReadiness:
      official.matchingReadiness || discovery.matchingReadiness,
    dataQualityScore: Math.max(
      official.dataQualityScore ?? 0,
      discovery.dataQualityScore ?? 0,
    ),
    confirmedFields: Array.from(
      new Set([
        ...(official.confirmedFields || []),
        ...(discovery.confirmedFields || []),
      ]),
    ),
    rawStubIds: Array.from(
      new Set([...(discovery.rawStubIds || []), ...(official.rawStubIds || [])]),
    ),
    isStub: Boolean(official.isStub && discovery.isStub),
    whyInteresting: Array.from(
      new Set([
        ...(official.whyInteresting || []),
        ...(discovery.whyInteresting || []),
      ]),
    ).slice(0, 8),
  };

  const q = computeDataQuality({
    candidate: merged,
    structuredFields: merged.structuredFields || [],
  });
  return {
    ...merged,
    dataQualityScore: q.dataQualityScore,
    matchingReadiness: q.matchingReadiness,
    confirmedFields: q.confirmedFields,
    unknownFields: q.unknownFields,
    score: {
      ...merged.score,
      quality: Math.max(merged.score.quality, q.dataQualityScore),
      breakdown: {
        ...merged.score.breakdown,
        dataCompleteness: q.dataQualityScore,
      },
    },
  };
}

/** Dedup helper used by pipeline/adapters. */
export function mergeCandidatePool(items: LiaOiCandidate[]): LiaOiCandidate[] {
  const groups: LiaOiCandidate[] = [];
  for (const item of items) {
    const idx = groups.findIndex((g) => sameOfficialIdentity(g, item));
    if (idx >= 0) {
      groups[idx] = mergeSerperWithOfficial(groups[idx]!, item);
    } else {
      groups.push(item);
    }
  }
  return groups;
}
