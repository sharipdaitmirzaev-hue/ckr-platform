/**
 * Stage 4L — demand-signal helpers for SEEK_BUYER (not Matching Engine).
 */

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
 * Returns 0–18.
 */
export function productDemandFit(
  need: NeedProfile,
  candidate: FeedCandidate,
): { score: number; matched: string[]; unknown: boolean } {
  if (!need.industries.length && !(need.keywords || []).length) {
    return { score: 8, matched: [], unknown: false };
  }
  const text = `${candidate.title} ${candidate.summary || ""} ${candidate.rawType || ""}`;
  const tags = [
    ...(candidate.industries || []),
    candidate.industry || "",
  ].filter(Boolean);

  const matched: string[] = [];
  if (industriesOverlap(need.industries, text, tags)) {
    for (const ind of need.industries) {
      if (industriesOverlap([ind], text, tags)) matched.push(ind);
    }
    // Strong food/beverage + procurement title hit
    const strong =
      /продукт|напит|пищев|безалкогол|опт/i.test(text) &&
      need.industries.some((i) => /food|beverage|пищев|напит/i.test(i));
    return { score: strong ? 18 : 15, matched, unknown: false };
  }

  // keyword soft match
  for (const kw of need.keywords || []) {
    if (kw.length >= 3 && text.toLowerCase().includes(kw.toLowerCase())) {
      matched.push(kw);
    }
  }
  if (matched.length) return { score: 10, matched, unknown: false };

  const hasAnyIndustrySignal = Boolean(
    tags.length || detectIndustryTags(text).length,
  );
  if (!hasAnyIndustrySignal) {
    return { score: 0, matched: [], unknown: true };
  }
  return { score: 3, matched: [], unknown: false };
}
