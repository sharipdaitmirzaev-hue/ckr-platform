/**
 * Stage 4O — Opportunity Bank as unified READ aggregation.
 * No new Opportunity Bank table — reuse marketplace + OI + orgs.
 */

import type { DiscoverySourceCategory } from "@/lib/opportunity-discovery/types";
import { sourceCategoryLabelRu } from "@/lib/opportunity-discovery/candidate";

export type OpportunityBankBucket = {
  key: string;
  labelRu: string;
  categories: DiscoverySourceCategory[];
  entityHints: string[];
  href: string;
};

/** Owner aggregation UI sections — not a dump into opportunities. */
export const OPPORTUNITY_BANK_BUCKETS: OpportunityBankBucket[] = [
  {
    key: "projects",
    labelRu: "Проекты",
    categories: ["INVESTMENT_PROJECT"],
    entityHints: ["project"],
    href: "/projects",
  },
  {
    key: "investments",
    labelRu: "Инвестиции",
    categories: ["CAPITAL"],
    entityHints: ["investment_offer"],
    href: "/investments",
  },
  {
    key: "demand",
    labelRu: "Спрос / закупки",
    categories: ["PROCUREMENT", "BUYER_DEMAND"],
    entityHints: ["opportunity:procurement", "need_profile"],
    href: "/opportunities",
  },
  {
    key: "assets",
    labelRu: "Активы",
    categories: ["PROPERTY", "LAND", "EQUIPMENT", "BUSINESS_FOR_SALE"],
    entityHints: ["opportunity"],
    href: "/opportunities",
  },
  {
    key: "companies",
    labelRu: "Компании",
    categories: ["COMPANY", "PARTNERSHIP"],
    entityHints: ["organization"],
    href: "/admin/owner/companies",
  },
  {
    key: "support",
    labelRu: "Господдержка",
    categories: ["SUPPORT"],
    entityHints: ["opportunity:support_program"],
    href: "/admin/owner/lia/opportunities",
  },
  {
    key: "oi_review",
    labelRu: "На проверке (LIA OI)",
    categories: ["MARKET_SIGNAL"],
    entityHints: ["lia_oi"],
    href: "/admin/owner/lia/opportunities",
  },
];

export function describeOpportunityBankApproach(): string {
  return [
    "Банк возможностей = read-layer над projects, opportunities, investment_offers, organizations, PUBLIC needs, LIA OI.",
    "Controlled Publish остаётся единственным путём в user-safe marketplace.",
    "Компания ≠ opportunity; Need ≠ opportunity; Project ≠ opportunity.",
    ...OPPORTUNITY_BANK_BUCKETS.map(
      (b) =>
        `· ${b.labelRu}: ${b.categories.map(sourceCategoryLabelRu).join(", ")} → ${b.href}`,
    ),
  ].join("\n");
}
