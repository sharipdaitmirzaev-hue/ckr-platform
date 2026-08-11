/**
 * Stage 4D — publishability (NOT matching score).
 * READY_TO_REVIEW | NEEDS_ENRICHMENT | WEAK_SOURCE | EXPIRED | REJECTED
 */

import type { LiaOiCandidate } from "@/types/lia-oi";
import { detectLifecycleHint } from "@/lib/lia/oi/publish/safe-projection";
import { normalizeRegionLabel } from "@/lib/geo/region-normalize";

export const PUBLISHABILITY_TIERS = [
  "READY_TO_REVIEW",
  "NEEDS_ENRICHMENT",
  "WEAK_SOURCE",
  "EXPIRED",
  "REJECTED",
] as const;
export type PublishabilityTier = (typeof PUBLISHABILITY_TIERS)[number];

export type PublishabilityResult = {
  tier: PublishabilityTier;
  score: number;
  reasons: string[];
  labelRu: string;
};

const TIER_LABEL: Record<PublishabilityTier, string> = {
  READY_TO_REVIEW: "Высокое качество",
  NEEDS_ENRICHMENT: "Нужно проверить",
  WEAK_SOURCE: "Недостаточно данных",
  EXPIRED: "Просрочено / закрыто",
  REJECTED: "Отклонено",
};

export function computePublishability(
  candidate: LiaOiCandidate,
): PublishabilityResult {
  const reasons: string[] = [];
  if (candidate.status === "REJECTED" || candidate.resultBucket === "REJECTED") {
    return {
      tier: "REJECTED",
      score: 0,
      reasons: ["status_or_bucket_rejected"],
      labelRu: TIER_LABEL.REJECTED,
    };
  }

  const life = detectLifecycleHint(candidate);
  if (life === "expired" || life === "closed" || life === "cancelled") {
    return {
      tier: "EXPIRED",
      score: 0,
      reasons: [`lifecycle_${life}`],
      labelRu: TIER_LABEL.EXPIRED,
    };
  }

  const page = candidate.pageType || "UNKNOWN";
  const intent = candidate.contentIntent || "UNKNOWN";
  const isJunkPage =
    page === "LIST" ||
    page === "CATEGORY" ||
    page === "HOMEPAGE" ||
    page === "NEWS" ||
    page === "GUIDE" ||
    candidate.isCatalogSource ||
    intent === "NEWS" ||
    intent === "GUIDE" ||
    intent === "SOCIAL" ||
    intent === "CATALOG";

  const title = (candidate.title || "").trim();
  const url =
    candidate.canonicalUrl ||
    candidate.sources?.find((s) => s.url)?.url ||
    "";
  const hasUrl = /^https?:\/\//i.test(url);
  const regionOk = Boolean(
    normalizeRegionLabel(candidate.region) ||
      (candidate.region && candidate.region.trim().length >= 3),
  );
  const moneyOk =
    candidate.nmck != null ||
    candidate.supportAmount != null ||
    candidate.askingPrice != null ||
    candidate.startingPrice != null ||
    candidate.currentPrice != null ||
    candidate.priceStatus === "KNOWN";
  const deadlineOk = Boolean(candidate.deadlineAt);
  const idOk = Boolean(candidate.sourceObjectId);
  const detailOk = page === "DETAIL" && !candidate.isCatalogSource;
  const dq = candidate.dataQualityScore ?? candidate.score?.quality ?? 0;

  let score = 0;
  if (detailOk) score += 25;
  else reasons.push("not_detail");
  if (hasUrl) score += 15;
  else reasons.push("missing_url");
  if (title.length >= 3) score += 10;
  else reasons.push("weak_title");
  if (regionOk) score += 15;
  else reasons.push("unknown_region");
  if (moneyOk) score += 15;
  else reasons.push("unknown_money");
  if (deadlineOk) score += 10;
  else reasons.push("unknown_deadline");
  if (idOk) score += 10;
  if (candidate.isOfficialSource || candidate.dataChannel === "OFFICIAL_API") {
    score += 10;
  }
  if (dq >= 55) score += 10;
  else if (dq >= 35) score += 5;

  if (isJunkPage) {
    score = Math.min(score, 25);
    reasons.push("junk_page_type");
  }

  score = Math.max(0, Math.min(100, score));

  let tier: PublishabilityTier;
  if (isJunkPage && score < 40) {
    tier = "WEAK_SOURCE";
  } else if (
    detailOk &&
    hasUrl &&
    title.length >= 3 &&
    (regionOk || moneyOk || idOk) &&
    score >= 55 &&
    !isJunkPage
  ) {
    tier = "READY_TO_REVIEW";
  } else if (hasUrl && title.length >= 3 && score >= 35) {
    tier = "NEEDS_ENRICHMENT";
  } else {
    tier = "WEAK_SOURCE";
  }

  return { tier, score, reasons, labelRu: TIER_LABEL[tier] };
}

export function isQueueWorthy(tier: PublishabilityTier): boolean {
  return tier === "READY_TO_REVIEW" || tier === "NEEDS_ENRICHMENT";
}
