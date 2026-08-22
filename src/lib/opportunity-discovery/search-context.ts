/**
 * Stage 4O — build OpportunitySearchContext from confirmed fields only.
 * Never fill UNKNOWN with guesses.
 */

import type { NeedProfile } from "@/types/need-profile";
import type {
  DiscoveryMode,
  DiscoverySourceCategory,
  OpportunitySearchContext,
} from "@/lib/opportunity-discovery/types";

function trimOrNull(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t ? t : null;
}

function uniqStrings(values: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const t = (v ?? "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/** Map need intent → preferred discovery categories. */
export function categoriesForIntent(
  intent: string | null,
): DiscoverySourceCategory[] {
  const i = (intent || "").toUpperCase();
  if (i === "SEEK_BUYER" || i === "SUPPLY" || i === "DEMAND") {
    return ["PROCUREMENT", "BUYER_DEMAND", "COMPANY", "SUPPLIER_REQUEST"];
  }
  if (i === "INVEST" || i === "SEEK_INVESTMENT" || i === "BUY_BUSINESS") {
    return [
      "INVESTMENT_PROJECT",
      "BUSINESS_FOR_SALE",
      "CAPITAL",
      "PROPERTY",
      "LAND",
    ];
  }
  if (i === "BUY_PROPERTY" || i === "SELL_PROPERTY") {
    return ["PROPERTY", "LAND", "INFRASTRUCTURE"];
  }
  if (i === "SEEK_EXPERT") return ["EXPERT", "PARTNERSHIP"];
  if (i === "SEEK_SUPPORT") return ["SUPPORT"];
  if (i === "SEEK_EQUIPMENT" || i === "SELL_EQUIPMENT") return ["EQUIPMENT"];
  if (i === "SEEK_PARTNER") return ["PARTNERSHIP", "COMPANY"];
  if (i === "SEEK_SUPPLIER") return ["SUPPLIER_REQUEST", "COMPANY"];
  if (i === "SEEK_PROJECT") {
    return ["INVESTMENT_PROJECT", "BUSINESS_FOR_SALE", "MARKET_SIGNAL"];
  }
  return ["OTHER", "MARKET_SIGNAL"];
}

export function emptySearchContext(
  mode: DiscoveryMode,
): OpportunitySearchContext {
  return {
    mode,
    intent: null,
    region: null,
    city: null,
    industry: null,
    productsServices: [],
    budgetMin: null,
    budgetMax: null,
    amountNeeded: null,
    assetType: null,
    projectType: null,
    desiredPartner: null,
    keywords: [],
    organizationId: null,
    organizationContext: null,
    knownCapabilities: [],
    excludedCategories: [],
    sourcePreferences: [],
    requestId: null,
    needProfileId: null,
    freeText: null,
  };
}

export function buildContextFromNeed(input: {
  mode: DiscoveryMode;
  need: NeedProfile;
  requestId?: string | null;
  organizationId?: string | null;
  organizationContext?: string | null;
  knownCapabilities?: string[];
  freeText?: string | null;
}): OpportunitySearchContext {
  const { need } = input;
  const industry = need.industries[0] ? need.industries[0] : null;
  const region = need.regions[0] ? need.regions[0] : null;

  return {
    mode: input.mode,
    intent: need.intentType || null,
    region,
    city: null,
    industry,
    productsServices: uniqStrings([
      ...need.keywords,
      ...need.industries.slice(1),
    ]),
    budgetMin: need.budgetMin,
    budgetMax: need.budgetMax,
    amountNeeded: need.budgetMax,
    assetType: null,
    projectType: null,
    desiredPartner: null,
    keywords: uniqStrings([
      ...need.keywords,
      ...need.industries,
      ...need.regions,
      need.title,
    ]),
    organizationId: input.organizationId ?? null,
    organizationContext: trimOrNull(input.organizationContext),
    knownCapabilities: uniqStrings(input.knownCapabilities ?? []),
    excludedCategories: [],
    sourcePreferences: categoriesForIntent(need.intentType),
    requestId: input.requestId ?? null,
    needProfileId: need.id,
    freeText: trimOrNull(input.freeText),
  };
}

export function buildContextFromManual(input: {
  mode: DiscoveryMode;
  freeText: string;
  intent?: string | null;
  region?: string | null;
  industry?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  categories?: DiscoverySourceCategory[];
  keywords?: string[];
}): OpportunitySearchContext {
  const freeText = input.freeText.trim();
  const intent = trimOrNull(input.intent);
  const region = trimOrNull(input.region);
  const industry = trimOrNull(input.industry);
  const cats =
    input.categories?.length ?
      input.categories
    : categoriesForIntent(intent);

  return {
    ...emptySearchContext(input.mode),
    intent,
    region,
    industry,
    budgetMin: input.budgetMin ?? null,
    budgetMax: input.budgetMax ?? null,
    amountNeeded: input.budgetMax ?? null,
    keywords: uniqStrings([
      ...(input.keywords ?? []),
      freeText,
      region,
      industry,
      intent,
    ]),
    sourcePreferences: cats,
    freeText: freeText || null,
  };
}

/** Stable fingerprint for idempotent re-runs (same context → same plan id). */
export function fingerprintSearchContext(
  ctx: OpportunitySearchContext,
): string {
  const payload = [
    ctx.mode,
    ctx.intent,
    ctx.region,
    ctx.city,
    ctx.industry,
    ctx.budgetMin,
    ctx.budgetMax,
    ctx.amountNeeded,
    ctx.assetType,
    ctx.projectType,
    ctx.requestId,
    ctx.needProfileId,
    ctx.organizationId,
    [...ctx.keywords].sort().join("|"),
    [...ctx.productsServices].sort().join("|"),
    [...ctx.sourcePreferences].sort().join("|"),
    ctx.freeText,
  ].join("::");
  // Simple non-crypto hash for diagnostics / idempotency keys
  let h = 0;
  for (let i = 0; i < payload.length; i += 1) {
    h = (h * 31 + payload.charCodeAt(i)) | 0;
  }
  return `ctx_${(h >>> 0).toString(16)}`;
}

export function contextToQueryTokens(ctx: OpportunitySearchContext): string[] {
  return uniqStrings([
    ctx.freeText,
    ctx.intent,
    ctx.region,
    ctx.city,
    ctx.industry,
    ...ctx.productsServices,
    ...ctx.keywords,
    ...ctx.knownCapabilities,
  ]);
}

export function contextToPrimaryQuery(ctx: OpportunitySearchContext): string {
  if (ctx.freeText) return ctx.freeText;
  const parts = uniqStrings([
    ctx.intent === "SEEK_BUYER"
      ? "закупка спрос покупатель"
      : ctx.intent === "INVEST" || ctx.intent === "SEEK_INVESTMENT"
        ? "инвестиционный проект бизнес"
        : ctx.intent,
    ctx.industry,
    ...ctx.productsServices.slice(0, 4),
    ctx.region,
    ctx.budgetMax != null ? `до ${ctx.budgetMax}` : null,
  ]);
  return parts.join(" ").trim() || "возможности ЦКР";
}
