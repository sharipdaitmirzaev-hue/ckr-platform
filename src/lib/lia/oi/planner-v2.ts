/**
 * Stage 4D/4E — Query Planner v2 from Need Profile + regional strategies.
 * Respects LIA_OI_BUDGETS. Prefer site-specific over broad Google.
 */

import { LIA_OI_BUDGETS } from "@/config/lia-oi";
import { buildSearchPlan, detectIntent } from "@/lib/lia/oi/planner";
import {
  regionSearchTokens,
  detectCanonicalRegions,
  normalizeRegionLabel,
} from "@/lib/geo/region-normalize";
import { detectIndustryTags, expandIndustry } from "@/lib/catalog/industry-aliases";
import { buildRegionalQueryStrategies } from "@/lib/lia/oi/regional/query-strategy";
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
  /** Stage 4E — prefer regional site strategies */
  regionalFirst?: boolean;
};

/**
 * Build a budget-capped search plan from Need Profile or free query.
 */
export function buildSearchPlanV2(input: PlannerV2Input): LiaOiSearchPlan & {
  plannerVersion: "v2" | "v2-regional";
  strategies: string[];
  regionalQueries: string[];
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

  const intent = String(need?.intentType || detectIntent(seed));
  const regionalFirst =
    input.regionalFirst !== false &&
    regions.some((r) => {
      const c = normalizeRegionLabel(r);
      return (
        c === "Дагестан" ||
        c === "СКФО" ||
        c === "Ставропольский край" ||
        /дагестан|скфо|северо.?кавказ/i.test(r)
      );
    });

  const regional = regionalFirst
    ? buildRegionalQueryStrategies({
        intentType: intent,
        regions,
        industries,
        budgetMax: need?.budgetMax ?? null,
        maxQueries: LIA_OI_BUDGETS.maxQueriesPass1,
      })
    : [];

  if (regional.length) strategies.push("regional_site_strategies");

  const geoTokens = regionSearchTokens(regions).slice(0, 3);
  const indToken = industryQueryToken(industries);
  const extra: string[] = regional.map((r) => r.query);

  // Fallback specialized strategies only when regional set is thin
  if (extra.length < 3) {
    if (intent === "SEEK_CONTRACT" || base.intent === "tenders") {
      strategies.push("procurement_sites");
      for (const g of geoTokens) {
        extra.push(`site:zakupki.gov.ru ${indToken} ${g}`.trim());
      }
    }
    if (intent === "SEEK_SUPPORT" || base.intent === "support_programs") {
      strategies.push("support_programs");
      for (const g of geoTokens) {
        extra.push(`субсидии МСП ${indToken} ${g}`.trim());
      }
    }
    if (intent === "INVEST" || intent === "SEEK_PROJECT") {
      strategies.push("investment_assets");
      for (const g of geoTokens) {
        extra.push(`инвестиционный проект ${indToken} ${g}`.trim());
      }
    }
    if (intent === "SEEK_BUYER") {
      strategies.push("buyer_demand");
      for (const g of geoTokens) {
        extra.push(`site:zakupki.gov.ru закупка ${indToken} ${g}`.trim());
      }
    }
  }

  // Prefer regional/site queries first, then base — still hard-capped
  const merged: string[] = [];
  for (const q of [...extra, ...base.queries]) {
    if (q && !merged.includes(q)) merged.push(q);
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
    plannerVersion: regionalFirst ? "v2-regional" : "v2",
    strategies,
    regionalQueries: regional.map((r) => r.query),
  };
}
