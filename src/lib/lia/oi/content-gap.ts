/**
 * Stage 4D/4E — Content Gap diagnostics for owner.
 * Shows where ЦКР lacks publishable / feedable opportunities.
 * Regional source strategies for targeted discovery.
 * Not Matching Engine.
 */

import type { NeedProfile, NeedIntentType } from "@/types/need-profile";
import type { LiaOiCandidate } from "@/types/lia-oi";
import { regionsCompatible } from "@/lib/geo/region-normalize";
import { industriesOverlap } from "@/lib/catalog/industry-aliases";
import { computePublishability } from "@/lib/lia/oi/publishability";
import { computeDataQualityV2 } from "@/lib/lia/oi/quality-v2";
import { buildRegionalQueryStrategies } from "@/lib/lia/oi/regional/query-strategy";
import { classifyDemandSignal } from "@/lib/lia/oi/regional/demand-classify";

export type ContentGapScenario = {
  id: string;
  label: string;
  intentType: NeedIntentType | string;
  regions: string[];
  industries: string[];
  budgetMax?: number | null;
};

export type ContentGapRow = {
  scenarioId: string;
  label: string;
  intentType: string;
  regions: string[];
  industries: string[];
  discovered: number;
  detail: number;
  publishable: number;
  readyToReview: number;
  needsEnrichment: number;
  weak: number;
  expired: number;
  goodEnoughForFeed: number;
  gapSeverity: "CRITICAL" | "LOW" | "OK";
  messageRu: string;
};

/** Default diagnostic scenarios (Stage 4D baseline set). */
export const DEFAULT_GAP_SCENARIOS: ContentGapScenario[] = [
  {
    id: "a_contract_food_dag",
    label: "SEEK_CONTRACT · food/beverage · Дагестан",
    intentType: "SEEK_CONTRACT",
    regions: ["Дагестан"],
    industries: ["food", "beverage"],
  },
  {
    id: "b_buyer_food_nc",
    label: "SEEK_BUYER · food/beverage · Дагестан/СКФО",
    intentType: "SEEK_BUYER",
    regions: ["Дагестан", "СКФО"],
    industries: ["food", "beverage"],
  },
  {
    id: "c_support_mfg_dag",
    label: "SEEK_SUPPORT · manufacturing · Дагестан/СКФО",
    intentType: "SEEK_SUPPORT",
    regions: ["Дагестан", "СКФО"],
    industries: ["manufacturing"],
  },
  {
    id: "d_invest_30_nc",
    label: "INVEST · до 30 млн · Дагестан/СКФО",
    intentType: "INVEST",
    regions: ["Дагестан", "СКФО"],
    industries: [],
    budgetMax: 30_000_000,
  },
  {
    id: "e_project_30_nc",
    label: "SEEK_PROJECT · до 30 млн · Дагестан/СКФО",
    intentType: "SEEK_PROJECT",
    regions: ["Дагестан", "СКФО"],
    industries: [],
    budgetMax: 30_000_000,
  },
];

/** Backward-compatible aliases used by older Stage 4D scripts/UI. */
export const LEGACY_GAP_SCENARIO_IDS: Record<string, string> = {
  b_support_mfg_dag: "c_support_mfg_dag",
  c_invest_30_nc: "d_invest_30_nc",
  d_buyer_food_nc: "b_buyer_food_nc",
  e_project_30_ru: "e_project_30_nc",
};

function intentMatchesCandidate(
  intent: string,
  c: LiaOiCandidate,
): boolean {
  const t = c.opportunityType || "";
  switch (intent) {
    case "SEEK_CONTRACT":
      return t === "PROCUREMENT" || /закуп|тендер|нмцк/i.test(`${c.title} ${c.description}`);
    case "SEEK_SUPPORT":
      return t === "SUPPORT_PROGRAM" || /субсид|грант|поддерж/i.test(`${c.title} ${c.description}`);
    case "INVEST":
    case "SEEK_PROJECT":
    case "BUY_BUSINESS":
      return (
        t === "AUCTION_ASSET" ||
        t === "WEB_LISTING" ||
        /инвест|бизнес|лот|проект/i.test(`${c.title} ${c.description}`)
      );
    case "SEEK_BUYER": {
      const dem =
        c.demandClassification ||
        classifyDemandSignal({
          title: c.title,
          description: c.description,
          url: c.canonicalUrl,
          pageType: c.pageType,
          opportunityType: c.opportunityType,
        }).classification;
      // Count confirmed demand + procurement; potential buyers tracked separately in coverage
      return (
        dem === "CONFIRMED_DEMAND" ||
        dem === "POTENTIAL_BUYER" ||
        c.opportunityType === "PROCUREMENT" ||
        /спрос|покупател|опт|закуп|тендер|нмцк/i.test(
          `${c.title} ${c.description}`,
        )
      );
    }
    default:
      return true;
  }
}

function matchesScenario(c: LiaOiCandidate, s: ContentGapScenario): boolean {
  if (!intentMatchesCandidate(s.intentType, c)) return false;
  const regionOk =
    !s.regions.length ||
    regionsCompatible(s.regions, c.region) ||
    s.regions.some((r) => r === "Россия");
  if (!regionOk && c.region) {
    // allow unknown region only as weak match later — for gap counting require compatible or unknown
    if (!regionsCompatible(s.regions, c.region)) {
      // still count if Russia-wide need
      if (!(s.regions.length === 1 && s.regions[0] === "Россия")) return false;
    }
  }
  if (s.industries.length) {
    const ok = industriesOverlap(
      s.industries,
      `${c.title} ${c.description} ${c.industry || ""}`,
      c.industry ? [c.industry] : [],
    );
    if (!ok) return false;
  }
  if (s.budgetMax != null) {
    const price =
      c.nmck ?? c.askingPrice ?? c.startingPrice ?? c.investmentRequired ?? null;
    if (price != null && price > s.budgetMax * 1.15) return false;
  }
  return true;
}

export function evaluateContentGaps(
  candidates: LiaOiCandidate[],
  scenarios: ContentGapScenario[] = DEFAULT_GAP_SCENARIOS,
): ContentGapRow[] {
  return scenarios.map((s) => {
    const matched = candidates.filter((c) => matchesScenario(c, s));
    let detail = 0;
    let publishable = 0;
    let ready = 0;
    let enrich = 0;
    let weak = 0;
    let expired = 0;
    let good = 0;
    for (const c of matched) {
      const q = computeDataQualityV2({ candidate: c });
      const scored = { ...c, dataQualityScore: q.dataQualityScore, matchingReadiness: q.matchingReadiness };
      const pub = computePublishability(scored);
      if (c.pageType === "DETAIL" && !c.isCatalogSource) detail += 1;
      if (pub.tier === "READY_TO_REVIEW" || pub.tier === "NEEDS_ENRICHMENT") {
        publishable += 1;
      }
      if (pub.tier === "READY_TO_REVIEW") ready += 1;
      else if (pub.tier === "NEEDS_ENRICHMENT") enrich += 1;
      else if (pub.tier === "EXPIRED") expired += 1;
      else weak += 1;
      if (
        pub.tier === "READY_TO_REVIEW" &&
        c.pageType === "DETAIL" &&
        (c.region || c.nmck != null || c.supportAmount != null || c.askingPrice != null)
      ) {
        good += 1;
      }
    }
    let gapSeverity: ContentGapRow["gapSeverity"] = "OK";
    if (good < 3 && publishable < 5) gapSeverity = "CRITICAL";
    else if (good < 5) gapSeverity = "LOW";
    const messageRu =
      gapSeverity === "CRITICAL"
        ? `Недостаточно: ${publishable} кандидатов, ${good} хороших (цель ≥5).`
        : gapSeverity === "LOW"
          ? `Частично: ${publishable} кандидатов, ${good} хороших (цель ≥5, стремимся к 10).`
          : `Достаточно для обзора: ${good} хороших / ${publishable} publishable.`;
    return {
      scenarioId: s.id,
      label: s.label,
      intentType: String(s.intentType),
      regions: s.regions,
      industries: s.industries,
      discovered: matched.length,
      detail,
      publishable,
      readyToReview: ready,
      needsEnrichment: enrich,
      weak,
      expired,
      goodEnoughForFeed: good,
      gapSeverity,
      messageRu,
    };
  });
}

export function scenarioFromNeed(
  need: Pick<NeedProfile, "id" | "title" | "intentType" | "regions" | "industries" | "budgetMax">,
): ContentGapScenario {
  return {
    id: need.id,
    label: need.title || `${need.intentType}`,
    intentType: need.intentType,
    regions: need.regions || [],
    industries: need.industries || [],
    budgetMax: need.budgetMax,
  };
}

export function resolveGapScenarioId(id: string): string {
  return LEGACY_GAP_SCENARIO_IDS[id] || id;
}

export function getGapScenario(scenarioId: string): ContentGapScenario | null {
  const id = resolveGapScenarioId(scenarioId);
  return DEFAULT_GAP_SCENARIOS.find((s) => s.id === id) || null;
}

/** Regional strategies attached to a gap scenario (for owner UI / planner). */
export function strategiesForGapScenario(s: ContentGapScenario, maxQueries = 4) {
  return buildRegionalQueryStrategies({
    intentType: String(s.intentType),
    regions: s.regions,
    industries: s.industries,
    budgetMax: s.budgetMax ?? null,
    maxQueries,
  });
}

/** Build manual discovery query seed from gap/need (owner trigger). */
export function buildTargetedDiscoveryQuery(s: ContentGapScenario): string {
  const strat = buildRegionalQueryStrategies({
    intentType: String(s.intentType),
    regions: s.regions,
    industries: s.industries,
    budgetMax: s.budgetMax ?? null,
    maxQueries: 1,
  });
  if (strat[0]?.query) return strat[0].query;
  const parts = [
    s.intentType === "SEEK_CONTRACT"
      ? "закупки тендеры"
      : s.intentType === "SEEK_SUPPORT"
        ? "господдержка субсидии МСП"
        : s.intentType === "SEEK_BUYER"
          ? "оптовый спрос покупатель"
          : s.intentType === "INVEST" || s.intentType === "SEEK_PROJECT"
            ? "инвестиционный проект"
            : "бизнес возможности",
    s.industries.join(" "),
    s.regions.filter((r) => r !== "Россия").join(" ") || "Россия",
  ];
  if (s.budgetMax) parts.push(`до ${Math.round(s.budgetMax / 1_000_000)} млн`);
  return parts.filter(Boolean).join(" ").trim();
}
