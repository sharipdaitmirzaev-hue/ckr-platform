/**
 * Stage 4O — ranking / suitability for discovery (NOT Matching Engine).
 * Source-specific quality retained; no universal "match score" claim.
 */

import type {
  DiscoverySourceCategory,
  InternalCatalogRow,
  OpportunitySearchContext,
  SuitabilityLabel,
} from "@/lib/opportunity-discovery/types";
import { contextToQueryTokens } from "@/lib/opportunity-discovery/search-context";

function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е");
}

function tokenize(s: string): string[] {
  return norm(s)
    .split(/[\s,.;:!?\-/|]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function overlapCount(haystack: string, tokens: string[]): number {
  const h = norm(haystack);
  return tokens.reduce((n, t) => (h.includes(t) ? n + 1 : n), 0);
}

function regionHit(rowRegion: string | null | undefined, ctxRegion: string | null): boolean {
  if (!ctxRegion) return false;
  if (!rowRegion) return false;
  const a = norm(rowRegion);
  const b = norm(ctxRegion);
  return a.includes(b) || b.includes(a) || a.includes("скфо") || b.includes("скфо");
}

export type ScoreResult = {
  raw: number;
  quality: number;
  confidence: number;
  suitability: SuitabilityLabel;
  why: string[];
};

/**
 * Score an internal catalog row against search context.
 * Never labels result as MATCH — only suitability.
 */
export function scoreInternalRow(
  row: InternalCatalogRow,
  ctx: OpportunitySearchContext,
): ScoreResult {
  const tokens = contextToQueryTokens(ctx).flatMap(tokenize);
  const blob = [
    row.title,
    row.summary,
    row.region,
    row.industry,
    row.organization,
    ...(row.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  let raw = tokens.length ? overlapCount(blob, tokens) : 1;
  const why: string[] = [];

  if (regionHit(row.region, ctx.region)) {
    raw += 2;
    why.push(`Регион: ${row.region}`);
  }

  if (ctx.industry && overlapCount(blob, tokenize(ctx.industry)) > 0) {
    raw += 2;
    why.push(`Отрасль: ${ctx.industry}`);
  }

  for (const p of ctx.productsServices.slice(0, 6)) {
    if (overlapCount(blob, tokenize(p)) > 0) {
      raw += 2;
      why.push(`Продукт/услуга: ${p}`);
      break;
    }
  }

  if (ctx.budgetMax != null && row.amount != null) {
    if (row.amount <= ctx.budgetMax * 1.15) {
      raw += 1;
      why.push("Сумма в рамках бюджета");
    } else {
      raw -= 1;
      why.push("Сумма выше заявленного бюджета — проверить");
    }
  }

  // Entity preference by intent
  raw += entityIntentBonus(row, ctx);

  if (!why.length && raw > 0) {
    why.push("Есть пересечение по ключевым словам");
  }

  const quality = Math.max(1, Math.min(10, Math.round(3 + raw)));
  const confidence = Math.max(1, Math.min(10, Math.round(2 + raw * 0.8)));
  const suitability = suitabilityFromRaw(raw, tokens.length);

  return { raw, quality, confidence, suitability, why: why.slice(0, 5) };
}

function entityIntentBonus(
  row: InternalCatalogRow,
  ctx: OpportunitySearchContext,
): number {
  const intent = (ctx.intent || "").toUpperCase();
  const prefs = new Set(ctx.sourcePreferences);

  if (
    (intent === "SEEK_BUYER" || prefs.has("PROCUREMENT")) &&
    row.entityType === "opportunity" &&
    /procurement|закуп/i.test(`${row.sourceType} ${row.title}`)
  ) {
    return 2;
  }
  if (
    (intent === "INVEST" ||
      intent === "SEEK_INVESTMENT" ||
      prefs.has("INVESTMENT_PROJECT") ||
      prefs.has("BUSINESS_FOR_SALE")) &&
    (row.entityType === "project" ||
      row.entityType === "investment_offer" ||
      (row.entityType === "opportunity" &&
        /business|investment|проект/i.test(`${row.sourceType} ${row.title}`)))
  ) {
    return 2;
  }
  if (intent === "SEEK_EXPERT" && row.entityType === "expert_profile") return 2;
  if (prefs.has("COMPANY") && row.entityType === "organization") return 1;
  return 0;
}

function suitabilityFromRaw(raw: number, tokenCount: number): SuitabilityLabel {
  if (tokenCount === 0) return "NEEDS_CHECK";
  if (raw >= 6) return "SUITABLE";
  if (raw >= 4) return "POSSIBLE";
  if (raw >= 2) return "NEEDS_CHECK";
  if (raw >= 1) return "WEAK";
  return "NOT_SUITABLE";
}

/** Investment-specific quality cues (distinct from procurement). */
export function investmentQualityHints(row: InternalCatalogRow): string[] {
  const hints: string[] = [];
  if (row.amount != null) hints.push("сумма известна");
  else hints.push("сумма UNKNOWN");
  if (row.region) hints.push("локация известна");
  else hints.push("локация UNKNOWN");
  if (row.organization) hints.push("есть владелец/застройщик");
  else hints.push("владелец UNKNOWN");
  if ((row.summary || "").length > 40) hints.push("есть описание");
  else hints.push("описание слабое");
  return hints;
}

export function preferredCategoriesRank(
  category: DiscoverySourceCategory,
  prefs: DiscoverySourceCategory[],
): number {
  const idx = prefs.indexOf(category);
  return idx === -1 ? 50 : idx;
}
