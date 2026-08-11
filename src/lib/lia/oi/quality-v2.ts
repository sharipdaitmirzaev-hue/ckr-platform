/**
 * Stage 4D — Quality Score v2 wrapper around computeDataQuality.
 * Stronger penalties for LIST/NEWS/SOCIAL; rewards FACT fields + freshness.
 */

import type { LiaOiCandidate, LiaOiStructuredField } from "@/types/lia-oi";
import { computeDataQuality } from "@/lib/lia/oi/enrichment/quality";
import { normalizeRegionLabel } from "@/lib/geo/region-normalize";
import { computePublishability } from "@/lib/lia/oi/publishability";

export function computeDataQualityV2(input: {
  candidate: LiaOiCandidate;
  structuredFields?: LiaOiStructuredField[];
}): ReturnType<typeof computeDataQuality> & {
  qualityVersion: "v2";
  publishabilityScore: number;
  publishabilityTier: string;
} {
  const base = computeDataQuality({
    candidate: input.candidate,
    structuredFields:
      input.structuredFields || input.candidate.structuredFields || [],
  });

  let score = base.dataQualityScore;
  const c = input.candidate;
  const page = c.pageType || "UNKNOWN";
  const intent = c.contentIntent || "UNKNOWN";

  // Stronger demotions for non-opportunity surfaces
  if (page === "LIST" || page === "CATEGORY" || page === "HOMEPAGE") {
    score = Math.min(score, 28);
  }
  if (page === "NEWS" || page === "GUIDE" || intent === "NEWS" || intent === "GUIDE") {
    score = Math.min(score, 22);
  }
  if (intent === "SOCIAL") score = Math.min(score, 18);
  if (c.isCatalogSource) score = Math.min(score, 30);

  // Canonical region bonus (normalized)
  if (normalizeRegionLabel(c.region)) score += 4;

  // Official FACT channel bonus
  if (c.dataChannel === "OFFICIAL_API" || c.isOfficialSource) score += 6;

  // Freshness: lastSeen within 30d
  if (c.lastSeenAt) {
    const days = (Date.now() - Date.parse(c.lastSeenAt)) / 86400000;
    if (Number.isFinite(days) && days <= 30) score += 4;
    if (Number.isFinite(days) && days > 180) score -= 8;
  }

  // UNKNOWN must not look confirmed — strip false region confirmation
  let confirmed = base.confirmedFields.slice();
  const unknown = base.unknownFields.slice();
  if (!normalizeRegionLabel(c.region) && !c.region) {
    confirmed = confirmed.filter((f) => f !== "region");
    if (!unknown.includes("region")) unknown.push("region");
  }

  // Re-apply junk caps after bonuses — LIST/NEWS must stay low
  if (page === "LIST" || page === "CATEGORY" || page === "HOMEPAGE") {
    score = Math.min(score, 28);
  }
  if (page === "NEWS" || page === "GUIDE" || intent === "NEWS" || intent === "GUIDE") {
    score = Math.min(score, 22);
  }
  if (intent === "SOCIAL") score = Math.min(score, 18);
  if (c.isCatalogSource) score = Math.min(score, 30);

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Recompute readiness with stricter DETAIL requirement (same as v1 but after demotion)
  let matchingReadiness = base.matchingReadiness;
  if (page !== "DETAIL" || c.isCatalogSource) matchingReadiness = "NOT_READY";
  else if (score >= 60 && matchingReadiness === "NOT_READY") {
    matchingReadiness = "PARTIAL";
  }
  if (score < 40 && matchingReadiness === "READY") matchingReadiness = "PARTIAL";
  if (score < 25) matchingReadiness = "NOT_READY";

  const pub = computePublishability({
    ...c,
    dataQualityScore: score,
    matchingReadiness,
    confirmedFields: confirmed,
    unknownFields: unknown,
  });

  return {
    dataQualityScore: score,
    matchingReadiness,
    confirmedFields: confirmed,
    unknownFields: unknown.slice(0, 12),
    qualityVersion: "v2",
    publishabilityScore: pub.score,
    publishabilityTier: pub.tier,
  };
}
