/**
 * Stage 4L/4M — demand-signal helpers for SEEK_BUYER (not Matching Engine).
 */

import { productFitScore } from "@/lib/demand-intelligence/product-vocab";
import { detectIndustryTags, industriesOverlap } from "@/lib/catalog/industry-aliases";
import type { NeedProfile } from "@/types/need-profile";
import type { FeedCandidate } from "@/types/personalized-feed";

/** Human type for owner/client — never claims «покупатель» from procurement alone. */
export type DemandSignalKind =
  | "procurement"
  | "demand_need"
  | "buyer_signal"
  | "published_demand"
  | "other";

export function demandSignalKind(candidate: FeedCandidate): DemandSignalKind {
  if (candidate.itemType === "opportunity" && candidate.rawType === "procurement") {
    return "procurement";
  }
  if (candidate.itemType === "need_profile") {
    const intent = (candidate.rawType || "").toUpperCase();
    if (intent === "DEMAND" || intent === "SEEK_SUPPLIER") return "demand_need";
    return "buyer_signal";
  }
  if (candidate.itemType === "opportunity") return "published_demand";
  return "other";
}

export function demandSignalTypeLabel(kind: DemandSignalKind): string {
  switch (kind) {
    case "procurement":
      return "Закупка";
    case "demand_need":
      return "Сигнал спроса";
    case "buyer_signal":
      return "Возможный покупатель";
    case "published_demand":
      return "Сигнал спроса";
    default:
      return "Вариант";
  }
}

export function demandSignalStatusLabel(kind: DemandSignalKind): string {
  if (kind === "procurement" || kind === "demand_need" || kind === "published_demand") {
    return "Требует проверки";
  }
  return "Требует проверки";
}

/** Enrich opportunity industries from title/description (procurement has no industry column). */
export function enrichCandidateIndustries(
  title: string,
  summary: string,
  existing: string[] = [],
): string[] {
  const detected = detectIndustryTags(`${title} ${summary}`);
  const out = [...existing];
  for (const d of detected) {
    if (!out.some((x) => x.toLowerCase() === d.toLowerCase())) out.push(d);
  }
  return out;
}

/**
 * Product/industry fit using title+summary text — critical for procurement.
 * Stage 4M: uses shared product vocabulary.
 * Returns 0–18.
 */
export function productDemandFit(
  need: NeedProfile,
  candidate: FeedCandidate,
): { score: number; matched: string[]; unknown: boolean } {
  const text = `${candidate.title} ${candidate.summary || ""} ${candidate.rawType || ""} ${(candidate.industries || []).join(" ")}`;
  const base = productFitScore(
    need.industries,
    need.keywords || [],
    text,
  );
  if (base.matched.length || base.score > 0) return base;

  if (!need.industries.length && !(need.keywords || []).length) {
    return { score: 8, matched: [], unknown: false };
  }
  const tags = [
    ...(candidate.industries || []),
    candidate.industry || "",
  ].filter(Boolean);
  if (industriesOverlap(need.industries, text, tags)) {
    return { score: 12, matched: need.industries.slice(0, 2), unknown: false };
  }
  return base;
}
