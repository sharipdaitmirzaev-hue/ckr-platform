/**
 * Intent → candidate type mapping for Feed v1.
 * Coverage reflects REAL public marketplace sources (not owner-only LIA OI / Graph).
 */

import type { NeedIntentType } from "@/types/need-profile";
import type { FeedItemType, IntentCoverage } from "@/types/personalized-feed";

export type IntentMapping = {
  intentType: NeedIntentType;
  coverage: IntentCoverage;
  itemTypes: FeedItemType[];
  /** Opportunity.type values when itemTypes includes opportunity */
  opportunityTypes?: string[];
  notes: string;
};

const MAP: IntentMapping[] = [
  {
    intentType: "INVEST",
    coverage: "FULL",
    itemTypes: ["project", "opportunity"],
    opportunityTypes: ["ready_business", "land", "premises", "equipment"],
    notes: "Проекты и активы marketplace, подходящие под капитал.",
  },
  {
    intentType: "SEEK_INVESTMENT",
    coverage: "FULL",
    itemTypes: ["investment_offer"],
    notes: "Публичные investment_offers.",
  },
  {
    intentType: "BUY_BUSINESS",
    coverage: "PARTIAL",
    itemTypes: ["opportunity"],
    opportunityTypes: ["ready_business"],
    notes: "Только ready_business в opportunities; внешние OI — owner-only.",
  },
  {
    intentType: "SELL_BUSINESS",
    coverage: "PARTIAL",
    itemTypes: ["need_profile"],
    notes: "Спрос через PUBLIC need_profiles (BUY_BUSINESS/INVEST/DEMAND).",
  },
  {
    intentType: "BUY_PROPERTY",
    coverage: "FULL",
    itemTypes: ["opportunity"],
    opportunityTypes: ["land", "premises"],
    notes: "Земля и помещения в opportunities.",
  },
  {
    intentType: "SELL_PROPERTY",
    coverage: "PARTIAL",
    itemTypes: ["need_profile"],
    notes: "Спрос BUY_PROPERTY через PUBLIC needs.",
  },
  {
    intentType: "SEEK_PROJECT",
    coverage: "FULL",
    itemTypes: ["project"],
    notes: "Каталог projects.",
  },
  {
    intentType: "SEEK_PARTNER",
    coverage: "PARTIAL",
    itemTypes: ["opportunity", "project"],
    opportunityTypes: ["partner", "ready_business", "service"],
    notes: "Нет отдельного partner marketplace; partner/project signals.",
  },
  {
    intentType: "SEEK_SUPPLIER",
    coverage: "PARTIAL",
    itemTypes: ["opportunity"],
    opportunityTypes: ["service", "equipment", "technology"],
    notes: "Нет таблицы поставщиков; proxy через opportunities.",
  },
  {
    intentType: "SEEK_BUYER",
    coverage: "PARTIAL",
    itemTypes: ["need_profile", "opportunity"],
    // Stage 4L: published procurement = demand signal (not proven buyer).
    // Raw LIA OI stays owner-only via Controlled Publish — never auto-included.
    opportunityTypes: ["procurement", "partner", "service"],
    notes:
      "Stage 4L: PUBLIC DEMAND needs + published procurement/partner/service as demand signals. No Matching Engine.",
  },
  {
    intentType: "SEEK_EXPERT",
    coverage: "FULL",
    itemTypes: ["expert"],
    notes: "expert_profiles published.",
  },
  {
    intentType: "SEEK_EQUIPMENT",
    coverage: "FULL",
    itemTypes: ["opportunity"],
    opportunityTypes: ["equipment"],
    notes: "opportunities.type=equipment.",
  },
  {
    intentType: "SELL_EQUIPMENT",
    coverage: "PARTIAL",
    itemTypes: ["need_profile"],
    notes: "Спрос SEEK_EQUIPMENT через PUBLIC needs.",
  },
  {
    intentType: "SEEK_SUPPORT",
    coverage: "PARTIAL",
    itemTypes: ["opportunity"],
    opportunityTypes: ["support_program"],
    notes:
      "Stage 4C: только PUBLISHED marketplace support_program после owner approve. LIA OI остаётся OWNER_ONLY.",
  },
  {
    intentType: "SEEK_CONTRACT",
    coverage: "PARTIAL",
    itemTypes: ["opportunity"],
    opportunityTypes: ["procurement"],
    notes:
      "Stage 4C: только PUBLISHED marketplace procurement после owner approve. LIA OI остаётся OWNER_ONLY.",
  },
  {
    intentType: "SUPPLY",
    coverage: "PARTIAL",
    itemTypes: ["need_profile", "opportunity"],
    opportunityTypes: ["procurement", "partner", "service"],
    notes: "Stage 4L: DEMAND needs + published procurement as demand signals.",
  },
  {
    intentType: "DEMAND",
    coverage: "PARTIAL",
    itemTypes: ["project", "opportunity", "investment_offer"],
    notes: "Общий спрос — широкий marketplace scan.",
  },
];

export function getIntentMapping(intentType: NeedIntentType): IntentMapping {
  return (
    MAP.find((m) => m.intentType === intentType) || {
      intentType,
      coverage: "UNSUPPORTED",
      itemTypes: [],
      notes: "Intent не описан в Feed v1 mapping.",
    }
  );
}

export function coverageByIntent(): Record<string, IntentCoverage> {
  const out: Record<string, IntentCoverage> = {};
  for (const m of MAP) out[m.intentType] = m.coverage;
  return out;
}

export function allIntentMappings(): IntentMapping[] {
  return MAP.slice();
}

/** Industry aliases — Stage 4D shared catalog (re-export). */
export { INDUSTRY_ALIASES } from "@/lib/catalog/industry-aliases";
