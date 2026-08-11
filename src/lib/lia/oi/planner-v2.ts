/**
 * Stage 4D — Query Planner v2 from Need Profile criteria.
 * Respects LIA_OI_BUDGETS. No unbounded query explosion.
 */

import { LIA_OI_BUDGETS } from "@/config/lia-oi";
import { buildSearchPlan, detectIntent } from "@/lib/lia/oi/planner";
import { regionSearchTokens, detectCanonicalRegions } from "@/lib/geo/region-normalize";
import { detectIndustryTags, expandIndustry } from "@/lib/catalog/industry-aliases";
import type { LiaOiSearchPlan } from "@/types/lia-oi";
import type { NeedIntentType, NeedProfile } from "@/types/need-profile";

function intentToQuerySeed(intent: NeedIntentType | string): string {
  switch (intent) {
    case "SEEK_CONTRACT":
      return "закупки тендеры НМЦК";
    case "SEEK_SUPPORT":
      return "господдержка субсидии гранты МСП";
    case "INVEST":
      return "инвестиционный проект готовый бизнес";
    case "SEEK_PROJECT":
      return "инвестиционный проект до";
    case "SEEK_BUYER":
      return "оптовый спрос покупатель контракт";
    case "BUY_BUSINESS":
      return "продажа готового бизнеса";
    case "SEEK_EQUIPMENT":
      return "оборудование производство";
    default:
      return "бизнес возможности";
  }
}

function industryQueryToken(industries: string[]): string {
  if (!industries.length) return "";
  const primary = industries[0]!;
  const aliases = expandIndustry(primary);
  // Prefer human RU token when present
  const ru = aliases.find((a) => /[а-яё]/i.test(a));
  if (primary === "beverage" || primary === "food") {
    return "пищевая промышленность напитки";
  }
  if (primary === "manufacturing" || primary === "production") {
    return "производство";
  }
  return ru || primary;
}

export type PlannerV2Input = {
  rawQuery?: string;
  need?: Pick<
    NeedProfile,
    "intentType" | "regions" | "industries" | "budgetMax" | "budgetMin" | "title"
  >;
};

/**
 * Build a budget-capped search plan from Need Profile or free query.
 */
export function buildSearchPlanV2(input: PlannerV2Input): LiaOiSearchPlan & {
  plannerVersion: "v2";
  strategies: string[];
} {
  const need = input.need;
  const regions =
    need?.regions?.length
      ? need.regions
      : detectCanonicalRegions(input.rawQuery || "");
  const industries =
    need?.industries?.length
      ? need.industries
      : detectIndustryTags(input.rawQuery || "");

  const seedParts = [
    need ? intentToQuerySeed(need.intentType) : input.rawQuery || "бизнес возможности",
    industryQueryToken(industries),
    regionSearchTokens(regions)[0] || "",
  ];
  if (need?.budgetMax) {
    const mln = Math.round(need.budgetMax / 1_000_000);
    seedParts.push(`до ${mln} млн`);
  }
  const seed = seedParts.filter(Boolean).join(" ").trim();

  const base = buildSearchPlan(seed || input.rawQuery || "бизнес возможности Россия");
  const strategies: string[] = ["base_intent_geo"];

  const geoTokens = regionSearchTokens(regions).slice(0, 3);
  const indToken = industryQueryToken(industries);
  const extra: string[] = [];

  // Specialized strategies by intent (capped)
  const intent = need?.intentType || detectIntent(seed);
  if (intent === "SEEK_CONTRACT" || base.intent === "tenders") {
    strategies.push("procurement_sites");
    for (const g of geoTokens) {
      extra.push(`site:zakupki.gov.ru ${indToken} ${g}`.trim());
      extra.push(`закупка ${indToken} ${g} НМЦК`.trim());
    }
  }
  if (intent === "SEEK_SUPPORT" || base.intent === "support_programs") {
    strategies.push("support_programs");
    for (const g of geoTokens) {
      extra.push(`субсидии МСП ${indToken} ${g}`.trim());
      extra.push(`господдержка ${indToken} ${g}`.trim());
    }
  }
  if (intent === "INVEST" || intent === "SEEK_PROJECT") {
    strategies.push("investment_assets");
    for (const g of geoTokens) {
      extra.push(`инвестиционный проект ${indToken} ${g}`.trim());
      extra.push(`готовый бизнес ${indToken} ${g}`.trim());
    }
  }
  if (intent === "SEEK_BUYER") {
    strategies.push("buyer_demand");
    for (const g of geoTokens) {
      extra.push(`оптовый спрос ${indToken} ${g}`.trim());
      extra.push(`закупка ${indToken} ${g}`.trim());
    }
  }

  // Merge unique queries with hard budget
  const merged = [...base.queries];
  for (const q of extra) {
    if (!merged.includes(q)) merged.push(q);
  }
  const capped = merged.slice(0, LIA_OI_BUDGETS.maxQueriesPass1);

  return {
    ...base,
    rawQuery: seed,
    regions: regions.length ? regions : base.regions,
    industries: industries.length ? industries : base.industries,
    budgetMax: need?.budgetMax ?? base.budgetMax,
    budgetMin: need?.budgetMin ?? base.budgetMin,
    queries: capped,
    pass1Queries: capped,
    plannerVersion: "v2",
    strategies,
  };
}
