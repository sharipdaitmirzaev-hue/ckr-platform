/**
 * Stage 4M — demand quality tiers (compute-only, no DB enum).
 */

import { classifyDemandSignal } from "@/lib/lia/oi/regional/demand-classify";
import { isFixtureNoise } from "@/lib/personalized-feed/fixtures";
import { productFitScore } from "@/lib/demand-intelligence/product-vocab";
import { regionsCompatible } from "@/lib/geo/region-normalize";

export const DEMAND_QUALITY_TIERS = [
  "CONFIRMED_DEMAND",
  "STRONG_SIGNAL",
  "POTENTIAL_BUYER",
  "NEEDS_RESEARCH",
  "WEAK",
  "EXPIRED",
  "REJECTED",
] as const;
export type DemandQualityTier = (typeof DEMAND_QUALITY_TIERS)[number];

export type DemandQualityInput = {
  id?: string | null;
  title: string;
  summary?: string | null;
  region?: string | null;
  rawType?: string | null;
  opportunityType?: string | null;
  pageType?: string | null;
  url?: string | null;
  deadlineAt?: string | null;
  amountKnown?: boolean;
  customer?: string | null;
  officialId?: string | null;
  sourceLabel?: string | null;
  isStub?: boolean | null;
  publicationState?: string | null;
  status?: string | null;
};

export type DemandQualityResult = {
  tier: DemandQualityTier;
  classification: "CONFIRMED_DEMAND" | "POTENTIAL_BUYER" | "UNKNOWN";
  bucket: "REAL_GOOD" | "REAL_ACCEPTABLE" | "WEAK" | "SMOKE" | "EXPIRED";
  regionFit: "strong" | "soft" | "none" | "unknown";
  productFit: number;
  productMatched: string[];
  reasons: string[];
  clientShareSafe: boolean;
  staffOnly: boolean;
};

function isExpired(deadlineAt?: string | null): boolean {
  if (!deadlineAt) return false;
  const t = Date.parse(deadlineAt);
  return Number.isFinite(t) && t < Date.now();
}

export function evaluateDemandQuality(input: {
  candidate: DemandQualityInput;
  needRegions: string[];
  needIndustries: string[];
  needKeywords?: string[];
  feedScore?: number | null;
  published?: boolean;
}): DemandQualityResult {
  const c = input.candidate;
  const blob = `${c.title} ${c.summary || ""}`;
  const reasons: string[] = [];

  if (
    c.isStub ||
    isFixtureNoise({
      id: c.id,
      title: c.title,
      summary: c.summary,
      sourceLabel: c.sourceLabel,
      sourceType: c.rawType || c.opportunityType,
    })
  ) {
    return {
      tier: "REJECTED",
      classification: "UNKNOWN",
      bucket: "SMOKE",
      regionFit: "none",
      productFit: 0,
      productMatched: [],
      reasons: ["fixture_or_stub"],
      clientShareSafe: false,
      staffOnly: true,
    };
  }

  if (isExpired(c.deadlineAt)) {
    return {
      tier: "EXPIRED",
      classification: "CONFIRMED_DEMAND",
      bucket: "EXPIRED",
      regionFit: "none",
      productFit: 0,
      productMatched: [],
      reasons: ["deadline_expired"],
      clientShareSafe: false,
      staffOnly: true,
    };
  }

  const dem = classifyDemandSignal({
    title: c.title,
    description: c.summary || undefined,
    url: c.url || undefined,
    pageType: c.pageType || undefined,
    opportunityType:
      c.opportunityType ||
      (c.rawType === "procurement" ? "PROCUREMENT" : c.rawType),
  });

  const product = productFitScore(
    input.needIndustries,
    input.needKeywords || [],
    blob,
  );

  let regionFit: DemandQualityResult["regionFit"] = "unknown";
  if (!c.region) regionFit = "unknown";
  else if (regionsCompatible(input.needRegions, c.region)) regionFit = "strong";
  else if (
    input.needRegions.some((r) => /скфо|росси/i.test(r)) ||
    /скфо|росси|ставропол|чечн|ингуш|кабард|осетия|северо.?кавказ/i.test(
      c.region,
    )
  ) {
    regionFit = "soft";
  } else regionFit = "none";

  // Region alone must not elevate irrelevant product
  if (product.score < 8 && regionFit === "strong") {
    reasons.push("region_without_product");
  }

  if (dem.classification === "CONFIRMED_DEMAND") {
    reasons.push(...dem.reasons);
  } else if (dem.classification === "POTENTIAL_BUYER") {
    reasons.push("potential_buyer_inference");
  }

  if (c.customer) reasons.push("customer_known");
  if (c.officialId) reasons.push("official_id");
  if (c.amountKnown) reasons.push("amount_known");
  if (!c.amountKnown) reasons.push("amount_unknown");
  if (!c.deadlineAt) reasons.push("deadline_unknown");

  const score = input.feedScore ?? null;
  const published = Boolean(input.published);

  // LIST/catalog pages stay weak even if demand language
  if (
    c.pageType === "LIST" ||
    c.pageType === "CATEGORY" ||
    c.pageType === "HOMEPAGE" ||
    c.pageType === "NEWS" ||
    c.pageType === "GUIDE" ||
    /каталог|реестр|все госзакупки|тендеры дагестана|тендеры\s+безалкогол|объявлен|блог|сколько стоит|какие отели|шведский стол|отдых с питанием/i.test(
      c.title,
    )
  ) {
    return {
      tier: "WEAK",
      classification: dem.classification,
      bucket: "WEAK",
      regionFit,
      productFit: product.score,
      productMatched: product.matched,
      reasons: [...reasons, "list_or_catalog_or_article"],
      clientShareSafe: false,
      staffOnly: true,
    };
  }

  // Non-DETAIL web listings with only demand language → research, not GOOD
  const isDetail =
    c.pageType === "DETAIL" ||
    c.opportunityType === "PROCUREMENT" ||
    /zakupki\.gov\.ru|kontur\.ru\/\d+/i.test(c.url || "");

  if (dem.classification === "CONFIRMED_DEMAND" && product.score >= 12) {
    const strongRegion = regionFit === "strong" || regionFit === "soft";
    const good =
      published &&
      isDetail &&
      (score == null || score >= 60) &&
      strongRegion &&
      product.score >= 12;
    const acceptable =
      isDetail &&
      product.score >= 12 &&
      (regionFit === "strong" || regionFit === "soft" || regionFit === "unknown");
    return {
      tier: good
        ? "CONFIRMED_DEMAND"
        : acceptable
          ? "STRONG_SIGNAL"
          : "NEEDS_RESEARCH",
      classification: "CONFIRMED_DEMAND",
      bucket: good ? "REAL_GOOD" : acceptable ? "REAL_ACCEPTABLE" : "WEAK",
      regionFit,
      productFit: product.score,
      productMatched: product.matched,
      reasons,
      clientShareSafe: published && (good || acceptable),
      staffOnly: !published,
    };
  }

  if (dem.classification === "POTENTIAL_BUYER") {
    // Org/directory alone — never GOOD; ACCEPTABLE only with strong product+region
    const acceptable =
      product.score >= 14 &&
      regionFit === "strong" &&
      /дистриб|сеть\s+магазин|оптов|закуп|поставщик|horeca/i.test(blob);
    return {
      tier: "POTENTIAL_BUYER",
      classification: "POTENTIAL_BUYER",
      bucket: acceptable ? "REAL_ACCEPTABLE" : "WEAK",
      regionFit,
      productFit: product.score,
      productMatched: product.matched,
      reasons,
      clientShareSafe: false,
      staffOnly: true,
    };
  }

  return {
    tier: product.score >= 8 ? "NEEDS_RESEARCH" : "WEAK",
    classification: "UNKNOWN",
    bucket: "WEAK",
    regionFit,
    productFit: product.score,
    productMatched: product.matched,
    reasons: [...reasons, "unknown_demand"],
    clientShareSafe: false,
    staffOnly: true,
  };
}

export function demandTierLabelRu(tier: DemandQualityTier): string {
  switch (tier) {
    case "CONFIRMED_DEMAND":
      return "Подтверждённый спрос";
    case "STRONG_SIGNAL":
      return "Сильный сигнал";
    case "POTENTIAL_BUYER":
      return "Потенциальный покупатель";
    case "NEEDS_RESEARCH":
      return "Требует проверки";
    case "WEAK":
      return "Слабый сигнал";
    case "EXPIRED":
      return "Срок истёк";
    case "REJECTED":
      return "Исключено";
    default:
      return "Требует проверки";
  }
}
