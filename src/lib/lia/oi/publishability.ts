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
  const title = (candidate.title || "").trim();
  const url =
    candidate.canonicalUrl ||
    candidate.sources?.find((s) => s.url)?.url ||
    "";
  const hasUrl = /^https?:\/\//i.test(url);

  // URL-level list/search/news even if stored pageType was wrong historically
  const urlLooksList =
    /extendedsearch|search\/results|\/search\b|\/results\.html|extrajudicialbankruptcy\/?$/i.test(
      url,
    ) || /\/epz\/order\/(?:nsi|quicksearch)/i.test(url);
  const urlLooksNews =
    /\/newspaper\/|\/news\/|rbc\.ru\/(?:newspaper|politics|society)/i.test(url);
  // Demo pollution: stub host / smoke titles. Do NOT treat fixture isStub alone
  // as junk — many valid specialized adapters use isStub in tests/fixtures.
  const isDemoStub =
    /stub\.ckr-center\.ru|example\.com\/smoke/i.test(url) ||
    /\[STUB\]|Smoke opportunity|smoke archive/i.test(title);

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
    intent === "CATALOG" ||
    urlLooksList ||
    urlLooksNews ||
    isDemoStub;

  if (urlLooksList) reasons.push("url_search_or_list");
  if (urlLooksNews) reasons.push("url_news");
  if (isDemoStub) reasons.push("demo_or_stub");

  const regionOk = Boolean(
    normalizeRegionLabel(candidate.region) ||
      (candidate.region && candidate.region.trim().length >= 3),
  );
  const moneyRaw =
    candidate.nmck ??
    candidate.supportAmount ??
    candidate.askingPrice ??
    candidate.startingPrice ??
    candidate.currentPrice ??
    null;
  // Plausible RUB amounts only — reject tiny garbage extractions (e.g. 8, 22)
  const moneyOk =
    (moneyRaw != null && moneyRaw >= 10_000) ||
    (candidate.priceStatus === "KNOWN" && moneyRaw != null && moneyRaw >= 10_000);
  const deadlineOk = Boolean(candidate.deadlineAt);
  const idOk = Boolean(candidate.sourceObjectId);
  const detailOk =
    page === "DETAIL" &&
    !candidate.isCatalogSource &&
    !urlLooksList &&
    !urlLooksNews &&
    !isDemoStub;
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
  else reasons.push("unknown_or_implausible_money");
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
  if (isDemoStub || urlLooksList || urlLooksNews) {
    tier = "WEAK_SOURCE";
  } else if (isJunkPage && score < 40) {
    tier = "WEAK_SOURCE";
  } else if (
    detailOk &&
    hasUrl &&
    title.length >= 3 &&
    // READY needs substance: region+money OR official id + (region|money)
    ((regionOk && moneyOk) || (idOk && (regionOk || moneyOk))) &&
    score >= 55 &&
    !isJunkPage
  ) {
    tier = "READY_TO_REVIEW";
  } else if (hasUrl && title.length >= 3 && score >= 35 && !isDemoStub) {
    tier = "NEEDS_ENRICHMENT";
  } else {
    tier = "WEAK_SOURCE";
  }

  return { tier, score, reasons, labelRu: TIER_LABEL[tier] };
}

export function isQueueWorthy(tier: PublishabilityTier): boolean {
  return tier === "READY_TO_REVIEW" || tier === "NEEDS_ENRICHMENT";
}
