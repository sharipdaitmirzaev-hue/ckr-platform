/**
 * Stage 4D — publish quality gate (owner queue entry).
 * Uses publishability tiers. UNKNOWN fields allowed; junk pages blocked.
 * No auto-publish — this only gates queue eligibility.
 */

import type { LiaOiCandidate } from "@/types/lia-oi";
import type { QualityGateResult } from "@/types/lia-controlled-publish";
import { detectLifecycleHint } from "@/lib/lia/oi/publish/safe-projection";
import {
  computePublishability,
  isQueueWorthy,
  type PublishabilityTier,
} from "@/lib/lia/oi/publishability";
import { computeDataQualityV2 } from "@/lib/lia/oi/quality-v2";

const MIN_DQ_FOR_WEAK = 45;

export type PublishQualityGateResult = QualityGateResult & {
  publishabilityTier: PublishabilityTier;
  publishabilityScore: number;
  dataQualityScore: number;
  qualityLabelRu: string;
};

export function passesPublicationQualityGate(
  candidate: LiaOiCandidate,
): PublishQualityGateResult {
  const reasons: string[] = [];

  // Re-score with v2 when missing / stale
  const q = computeDataQualityV2({ candidate });
  const scored: LiaOiCandidate = {
    ...candidate,
    dataQualityScore: q.dataQualityScore,
    matchingReadiness: q.matchingReadiness,
    confirmedFields: q.confirmedFields,
    unknownFields: q.unknownFields,
  };

  const pub = computePublishability(scored);

  if (candidate.status === "REJECTED") reasons.push("status=REJECTED");
  if (candidate.status === "ARCHIVED") reasons.push("status=ARCHIVED");
  if (candidate.resultBucket === "REJECTED") reasons.push("bucket=REJECTED");

  const lifecycle = detectLifecycleHint(candidate);
  if (lifecycle === "expired" || lifecycle === "closed" || lifecycle === "cancelled") {
    reasons.push(`lifecycle=${lifecycle}`);
  }

  const title = (candidate.title || "").trim();
  if (title.length < 3) reasons.push("missing_title");

  const hasSource =
    (candidate.sources?.length ?? 0) > 0 ||
    Boolean(candidate.canonicalUrl) ||
    Boolean(candidate.sourceAdapterId);
  if (!hasSource) reasons.push("missing_source");

  const url = (
    candidate.canonicalUrl ||
    candidate.sources?.find((s) => s.url)?.url ||
    ""
  ).trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    reasons.push("missing_canonical_or_official_url");
  }

  if (!isQueueWorthy(pub.tier)) {
    reasons.push(`publishability=${pub.tier}`);
  }

  // Extra hard stops for junk even if tier somehow soft
  const page = candidate.pageType || "UNKNOWN";
  const intent = candidate.contentIntent || "UNKNOWN";
  if (
    page === "LIST" ||
    page === "CATEGORY" ||
    page === "HOMEPAGE" ||
    page === "NEWS" ||
    page === "GUIDE" ||
    candidate.isCatalogSource ||
    intent === "NEWS" ||
    intent === "GUIDE" ||
    intent === "SOCIAL" ||
    intent === "CATALOG"
  ) {
    if (pub.tier !== "READY_TO_REVIEW") {
      reasons.push("junk_or_non_detail_page");
    }
  }

  if (pub.tier === "NEEDS_ENRICHMENT" && q.dataQualityScore < MIN_DQ_FOR_WEAK) {
    // Allow NEEDS_ENRICHMENT into queue only with some substance
    if (page !== "DETAIL" && !candidate.sourceObjectId) {
      reasons.push("needs_enrichment_insufficient");
    }
  }

  const ok = reasons.length === 0;
  return {
    ok,
    // Soft publishability notes only when gate fails (do not flip ok via unknown_money etc.)
    reasons: ok ? reasons : [...new Set([...reasons, ...pub.reasons])],
    publishabilityTier: pub.tier,
    publishabilityScore: pub.score,
    dataQualityScore: q.dataQualityScore,
    qualityLabelRu: pub.labelRu,
  };
}
