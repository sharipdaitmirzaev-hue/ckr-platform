/**
 * Rule-based ranking for Feed v1 — explainable, not ML.
 * Totals 0–100.
 */

import type { NeedProfile } from "@/types/need-profile";
import type {
  FeedCandidate,
  ScoreBreakdown,
} from "@/types/personalized-feed";
import { getIntentMapping } from "@/lib/personalized-feed/mapping";
import { productDemandFit } from "@/lib/personalized-feed/demand-signals";
import { regionsCompatible } from "@/lib/geo/region-normalize";
import { expandIndustry as expandIndustryCatalog } from "@/lib/catalog/industry-aliases";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function regionMatch(
  needRegions: string[],
  candidateRegions: string[],
): { score: number; matched: string | null; unknown: boolean } {
  if (!needRegions.length) return { score: 8, matched: null, unknown: false };
  if (!candidateRegions.length) return { score: 0, matched: null, unknown: true };
  for (const cr of candidateRegions) {
    if (!cr?.trim()) continue;
    if (regionsCompatible(needRegions, cr)) {
      return { score: 15, matched: cr, unknown: false };
    }
  }
  // federal / russia soft (canonical)
  if (needRegions.some((r) => /росси/i.test(r))) {
    return { score: 6, matched: candidateRegions[0] || null, unknown: false };
  }
  return { score: 0, matched: null, unknown: false };
}

function expandIndustry(ind: string): string[] {
  return expandIndustryCatalog(ind).map(norm);
}

function industryMatch(
  needIndustries: string[],
  candidateIndustries: string[],
  rawType?: string | null,
): { score: number; matched: string | null; unknown: boolean } {
  if (!needIndustries.length) return { score: 8, matched: null, unknown: false };
  const cand = [
    ...candidateIndustries.map(norm),
    rawType ? norm(rawType) : "",
  ].filter(Boolean);
  if (!cand.length) return { score: 0, matched: null, unknown: true };
  for (const ni of needIndustries) {
    const aliases = expandIndustry(ni);
    for (const a of aliases) {
      for (const c of cand) {
        if (c.includes(a) || a.includes(c)) {
          return { score: 15, matched: c, unknown: false };
        }
      }
    }
  }
  return { score: 3, matched: null, unknown: false }; // weak residual
}

function budgetScore(
  need: NeedProfile,
  candidate: FeedCandidate,
): { score: number; hardReject: boolean; note: string | null } {
  const max = need.budgetMax;
  const min = need.budgetMin;
  if (max == null && min == null) {
    return { score: 10, hardReject: false, note: null };
  }
  if (!candidate.priceKnown) {
    return {
      score: 0,
      hardReject: false,
      note: "Цена не подтверждена",
    };
  }
  const price =
    candidate.price ??
    candidate.priceMax ??
    candidate.priceMin ??
    null;
  if (price == null) {
    return { score: 0, hardReject: false, note: "Цена не подтверждена" };
  }

  // INVEST: hard reject if confirmed price above budget_max
  if (
    (need.intentType === "INVEST" ||
      need.intentType === "BUY_BUSINESS" ||
      need.intentType === "BUY_PROPERTY" ||
      need.intentType === "SEEK_EQUIPMENT") &&
    max != null &&
    price > max
  ) {
    return {
      score: 0,
      hardReject: true,
      note: `Цена ${price} выше бюджета ${max}`,
    };
  }

  // SEEK_INVESTMENT: prefer offers overlapping needed amount
  if (need.intentType === "SEEK_INVESTMENT") {
    const needed =
      (need.criteria?.amount_needed as number | undefined) ?? max ?? min;
    if (needed != null) {
      const pMin = candidate.priceMin ?? price;
      const pMax = candidate.priceMax ?? price;
      if (pMax < needed * 0.5 || (pMin != null && pMin > needed * 1.5)) {
        return { score: 4, hardReject: false, note: "Бюджет слабо пересекается" };
      }
      if (pMin != null && pMax >= needed && pMin <= needed) {
        return { score: 20, hardReject: false, note: null };
      }
      return { score: 12, hardReject: false, note: null };
    }
  }

  if (max != null && price <= max) {
    const ratio = price / max;
    if (ratio <= 0.85) return { score: 20, hardReject: false, note: null };
    return { score: 14, hardReject: false, note: null };
  }
  if (min != null && price >= min) {
    return { score: 12, hardReject: false, note: null };
  }
  return { score: 5, hardReject: false, note: null };
}

function freshnessScore(iso: string | null): number {
  if (!iso) return 1;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 1;
  const days = (Date.now() - t) / (86400 * 1000);
  if (days <= 7) return 5;
  if (days <= 30) return 4;
  if (days <= 90) return 3;
  if (days <= 180) return 2;
  return 1;
}

function intentCompatibility(
  need: NeedProfile,
  candidate: FeedCandidate,
): number {
  const mapping = getIntentMapping(need.intentType);
  if (mapping.coverage === "UNSUPPORTED") return 0;
  if (!mapping.itemTypes.includes(candidate.itemType)) return 0;
  if (
    candidate.itemType === "opportunity" &&
    mapping.opportunityTypes?.length &&
    candidate.rawType &&
    !mapping.opportunityTypes.includes(candidate.rawType)
  ) {
    return 8;
  }
  if (mapping.coverage === "FULL") return 30;
  return 22;
}

export function isExpiredConfirmed(candidate: FeedCandidate): boolean {
  if (!candidate.deadlineAt) return false;
  const t = Date.parse(candidate.deadlineAt);
  if (!Number.isFinite(t)) return false;
  return t < Date.now();
}

export function hardFilterCandidate(
  need: NeedProfile,
  candidate: FeedCandidate,
): { reject: boolean; reason?: string } {
  const closed = ["draft", "archived", "closed", "rejected", "cancelled", "EXPIRED"];
  if (closed.includes((candidate.status || "").toLowerCase()) ||
      closed.includes(candidate.status || "")) {
    return { reject: true, reason: `status=${candidate.status}` };
  }
  if (isExpiredConfirmed(candidate)) {
    return { reject: true, reason: "deadline_expired" };
  }
  const budget = budgetScore(need, candidate);
  if (budget.hardReject) {
    return { reject: true, reason: budget.note || "budget" };
  }
  return { reject: false };
}

export function rankCandidate(
  need: NeedProfile,
  candidate: FeedCandidate,
): { breakdown: ScoreBreakdown; hardReject: boolean; budgetNote: string | null } {
  const hard = hardFilterCandidate(need, candidate);
  if (hard.reject) {
    return {
      hardReject: true,
      budgetNote: hard.reason || null,
      breakdown: {
        intentCompatibility: 0,
        budgetFit: 0,
        regionFit: 0,
        industryFit: 0,
        dataQuality: 0,
        freshness: 0,
        sourceConfidence: 0,
        total: 0,
      },
    };
  }

  const intent = intentCompatibility(need, candidate);
  const budget = budgetScore(need, candidate);
  const regions = [
    ...(candidate.regions || []),
    candidate.region || "",
  ].filter(Boolean);
  let reg = regionMatch(need.regions, regions);
  const inds = [
    ...(candidate.industries || []),
    candidate.industry || "",
  ].filter(Boolean);
  const ind = industryMatch(need.industries, inds, candidate.rawType);

  // Stage 4L: SEEK_BUYER / SUPPLY use title+summary product fit (procurement).
  let industryScore = ind.score;
  const seekDemand =
    need.intentType === "SEEK_BUYER" || need.intentType === "SUPPLY";
  if (seekDemand) {
    const product = productDemandFit(need, candidate);
    industryScore = Math.max(ind.score, product.score);
    // Region alone must not elevate irrelevant procurements.
    if (industryScore < 8 && reg.score >= 12) {
      reg = { ...reg, score: Math.min(reg.score, 6) };
    }
    // Soft bonus for confirmed demand signal (published procurement).
    if (
      candidate.itemType === "opportunity" &&
      candidate.rawType === "procurement" &&
      industryScore >= 12
    ) {
      industryScore = Math.min(18, industryScore + 1);
    }
  }

  const dq = Math.max(0, Math.min(10, Math.round(candidate.dataQuality)));
  const fresh = freshnessScore(candidate.updatedAt || candidate.createdAt);
  const sc = Math.max(0, Math.min(5, Math.round(candidate.sourceConfidence)));

  const total =
    intent + budget.score + reg.score + industryScore + dq + fresh + sc;

  return {
    hardReject: false,
    budgetNote: budget.note,
    breakdown: {
      intentCompatibility: intent,
      budgetFit: budget.score,
      regionFit: reg.score,
      industryFit: industryScore,
      dataQuality: dq,
      freshness: fresh,
      sourceConfidence: sc,
      total: Math.min(100, total),
    },
  };
}
