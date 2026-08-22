/**
 * Stage 4O — source adapter catalog (extensible).
 * Does not auto-connect 50 sources — registry + priority only.
 */

import type { DiscoverySourceCategory } from "@/lib/opportunity-discovery/types";

export type SourceAdapterSpec = {
  id: string;
  category: DiscoverySourceCategory;
  labelRu: string;
  trustTier: Array<
    "official" | "government_open" | "regional_portal" | "company_website" | "trusted_secondary" | "general_web"
  >;
  status: "live" | "planned" | "gap";
  notes: string;
};

/**
 * Gap audit: max 2–3 priority sources per category for Stage 4O.
 * Procurement already live via LIA OI + resolver.
 */
export const SOURCE_ADAPTER_CATALOG: SourceAdapterSpec[] = [
  {
    id: "procurement_lia_oi",
    category: "PROCUREMENT",
    labelRu: "Закупки (LIA OI + Stage 4N resolver)",
    trustTier: ["official", "trusted_secondary", "general_web"],
    status: "live",
    notes: "EIS / mirrors / Serper — уже в 4M/4N",
  },
  {
    id: "investment_serper",
    category: "INVESTMENT_PROJECT",
    labelRu: "Инвестпроекты (web discovery)",
    trustTier: ["regional_portal", "company_website", "general_web"],
    status: "live",
    notes: "POC через LIA OI pipeline + investment queries",
  },
  {
    id: "business_sale_web",
    category: "BUSINESS_FOR_SALE",
    labelRu: "Бизнес на продажу",
    trustTier: ["trusted_secondary", "general_web"],
    status: "planned",
    notes: "Приоритет: 1–2 агрегатора + региональные порталы",
  },
  {
    id: "property_land_web",
    category: "PROPERTY",
    labelRu: "Недвижимость / земля",
    trustTier: ["official", "regional_portal", "general_web"],
    status: "gap",
    notes: "Нужны 2–3 источника; не подключать массово в 4O",
  },
  {
    id: "support_programs",
    category: "SUPPORT",
    labelRu: "Господдержка",
    trustTier: ["official", "government_open", "regional_portal"],
    status: "live",
    notes: "Частично через LIA OI support adapter",
  },
  {
    id: "company_web",
    category: "COMPANY",
    labelRu: "Компании с публичной потребностью",
    trustTier: ["company_website", "general_web"],
    status: "planned",
    notes: "Не outreach; только discovery",
  },
  {
    id: "capital_offers_internal",
    category: "CAPITAL",
    labelRu: "Капитал (investment_offers)",
    trustTier: ["official"],
    status: "live",
    notes: "Внутренний каталог ЦКР",
  },
];

export function adaptersForCategories(
  categories: DiscoverySourceCategory[],
): SourceAdapterSpec[] {
  const set = new Set(categories);
  return SOURCE_ADAPTER_CATALOG.filter((a) => set.has(a.category));
}

export function sourceGapSummary(): Array<{
  category: DiscoverySourceCategory;
  live: number;
  planned: number;
  gap: number;
}> {
  const cats = Array.from(
    new Set(SOURCE_ADAPTER_CATALOG.map((a) => a.category)),
  );
  return cats.map((category) => {
    const rows = SOURCE_ADAPTER_CATALOG.filter((a) => a.category === category);
    return {
      category,
      live: rows.filter((r) => r.status === "live").length,
      planned: rows.filter((r) => r.status === "planned").length,
      gap: rows.filter((r) => r.status === "gap").length,
    };
  });
}
