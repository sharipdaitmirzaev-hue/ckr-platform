/**
 * Stage 4M — demand-first Query Planner from Need Profile / CKR Request.
 * Reuses regional strategies; expands product-specific queries.
 * NOT a Scheduler. Manual budgets only.
 */

import { LIA_OI_BUDGETS } from "@/config/lia-oi";
import {
  buildRegionalQueryStrategies,
  type RegionalQueryStrategy,
} from "@/lib/lia/oi/regional/query-strategy";
import { regionSearchTokens, normalizeRegionLabel } from "@/lib/geo/region-normalize";
import type { NeedProfile } from "@/types/need-profile";

export type DemandQueryPlan = {
  intentType: string;
  regions: string[];
  industries: string[];
  keywords: string[];
  queries: RegionalQueryStrategy[];
  budget: {
    maxQueries: number;
    maxResultsPerQuery: number;
    maxFetchesPerRun: number;
  };
  notes: string[];
};

const PRODUCT_QUERY_RU: Array<{ id: string; label: string; terms: string }> = [
  { id: "food_procurement", label: "Закупка продуктов", terms: "закупка продуктов питания" },
  { id: "beverage_procurement", label: "Закупка напитков", terms: "закупка напитков безалкогольных" },
  { id: "water_procurement", label: "Закупка воды", terms: "закупка воды питьевой" },
  { id: "food_supply", label: "Поставка продуктов", terms: "поставка продуктов питания" },
  { id: "beverage_supply", label: "Поставка напитков", terms: "поставка безалкогольных напитков" },
  { id: "tender_food", label: "Тендер питание", terms: "тендер продукты питания" },
  { id: "supplier_request", label: "Ищем поставщика", terms: "ищем поставщика напитков продукты" },
  { id: "horeca_buy", label: "HoReCa закупка", terms: "закупка продуктов гостиница санаторий ресторан" },
];

/**
 * Build demand-first query plan for SEEK_BUYER / SEEK_SUPPLIER / SUPPLY.
 */
export function buildDemandQueryPlan(input: {
  need: Pick<
    NeedProfile,
    "intentType" | "regions" | "industries" | "keywords" | "title" | "description"
  >;
  maxQueries?: number;
}): DemandQueryPlan {
  const maxQueries = Math.min(
    input.maxQueries ?? 10,
    LIA_OI_BUDGETS.maxQueriesPerRun,
  );
  const intent =
    input.need.intentType === "SUPPLY" ? "SEEK_BUYER" : input.need.intentType;
  const regions = input.need.regions.length
    ? input.need.regions
    : ["Дагестан"];
  const industries = input.need.industries.length
    ? input.need.industries
    : ["food", "beverage"];
  const keywords = input.need.keywords || [];

  const notes: string[] = [
    "Demand-first planner — manual owner trigger only",
    "No auto-publish / no outreach / no Matching",
  ];

  // Base regional strategies (Stage 4E)
  const base = buildRegionalQueryStrategies({
    intentType: intent,
    regions,
    industries,
    maxQueries: Math.min(6, maxQueries),
  });

  const out: RegionalQueryStrategy[] = [...base];
  const geo = regionSearchTokens(regions).slice(0, 3);
  const primary =
    normalizeRegionLabel(regions[0]) || regions[0] || "Дагестан";

  const push = (s: RegionalQueryStrategy) => {
    if (out.length >= maxQueries) return;
    if (out.some((x) => x.query === s.query)) return;
    out.push(s);
  };

  if (intent === "SEEK_BUYER" || intent === "SEEK_SUPPLIER") {
    for (const g of geo.length ? geo : [String(primary)]) {
      for (const pq of PRODUCT_QUERY_RU) {
        push({
          id: `${pq.id}_${g}`,
          label: `${pq.label} · ${g}`,
          domain: "zakupki.gov.ru",
          intent: String(intent),
          region: g,
          query: `site:zakupki.gov.ru ${pq.terms} ${g}`.trim(),
        });
        push({
          id: `${pq.id}_web_${g}`,
          label: `${pq.label} (web) · ${g}`,
          intent: String(intent),
          region: g,
          query: `${pq.terms} ${g} тендер`.trim(),
        });
      }
      // Neighbor / federal soft expansion
      if (/дагестан|махачкал/i.test(g)) {
        push({
          id: `skfo_food_${g}`,
          label: "СКФО продукты",
          domain: "zakupki.gov.ru",
          intent: String(intent),
          region: "СКФО",
          query: `site:zakupki.gov.ru закупка продуктов питания напитки СКФО`.trim(),
        });
      }
    }
    for (const kw of keywords.slice(0, 3)) {
      if (kw.length < 3) continue;
      push({
        id: `kw_${kw}`,
        label: `Keyword · ${kw}`,
        intent: String(intent),
        region: String(primary),
        query: `закупка ${kw} ${primary}`.trim(),
      });
    }
  }

  return {
    intentType: String(intent),
    regions,
    industries,
    keywords,
    queries: out.slice(0, maxQueries),
    budget: {
      maxQueries,
      maxResultsPerQuery: LIA_OI_BUDGETS.maxResultsPerQuery,
      maxFetchesPerRun: LIA_OI_BUDGETS.maxFetchesPerRun,
    },
    notes,
  };
}

/** Primary seed query for runOwnerSearchPipeline (first query in plan). */
export function primaryDemandQuery(plan: DemandQueryPlan): string {
  return plan.queries[0]?.query || "закупка продуктов питания Дагестан";
}
