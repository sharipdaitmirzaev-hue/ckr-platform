/**
 * Stage 4E — region + intent → site-specific query strategies.
 * Prefer few high-signal site: queries over broad Google spam.
 */

import { LIA_OI_BUDGETS } from "@/config/lia-oi";
import { regionSearchTokens, normalizeRegionLabel } from "@/lib/geo/region-normalize";
import { expandIndustry } from "@/lib/catalog/industry-aliases";
import { domainsForNeed, listRegionalSources } from "@/lib/lia/oi/regional/source-registry";

export type RegionalQueryStrategy = {
  id: string;
  label: string;
  domain?: string;
  query: string;
  intent: string;
  region: string;
};

function industryRu(industries: string[]): string {
  if (!industries.length) return "";
  const primary = industries[0]!.toLowerCase();
  if (primary === "food" || primary === "beverage") {
    return "продукты питания напитки вода";
  }
  if (primary === "manufacturing" || primary === "production") {
    return "производство промышленность оборудование";
  }
  const aliases = expandIndustry(primary);
  return aliases.find((a) => /[а-яё]/i.test(a)) || primary;
}

/**
 * Build targeted site-restricted queries for a need/gap.
 * Hard-capped; Dagestan-first when region is Дагестан/СКФО.
 */
export function buildRegionalQueryStrategies(input: {
  intentType: string;
  regions: string[];
  industries?: string[];
  budgetMax?: number | null;
  maxQueries?: number;
}): RegionalQueryStrategy[] {
  const max = input.maxQueries ?? Math.min(8, LIA_OI_BUDGETS.maxQueriesPass1 + 2);
  const regions = input.regions.length ? input.regions : ["Дагестан"];
  const ind = industryRu(input.industries || []);
  const geo = regionSearchTokens(regions).slice(0, 2);
  const strategies: RegionalQueryStrategy[] = [];

  const push = (s: Omit<RegionalQueryStrategy, "id"> & { id?: string }) => {
    if (strategies.length >= max) return;
    const id = s.id || `${s.intent}_${strategies.length}`;
    if (strategies.some((x) => x.query === s.query)) return;
    strategies.push({ ...s, id });
  };

  const primaryRegion = normalizeRegionLabel(regions[0]) || regions[0] || "Дагестан";
  const domains = domainsForNeed({
    regions,
    intentType: input.intentType,
    limit: 6,
  });

  for (const g of geo.length ? geo : [String(primaryRegion)]) {
    if (input.intentType === "SEEK_CONTRACT") {
      push({
        id: "contract_zakupki_detail",
        label: "EIS извещения (geo)",
        domain: "zakupki.gov.ru",
        intent: input.intentType,
        region: g,
        query: `site:zakupki.gov.ru извещение ${ind} ${g} НМЦК`.trim(),
      });
      push({
        id: "contract_zakupki_food",
        label: "EIS продукты/напитки",
        domain: "zakupki.gov.ru",
        intent: input.intentType,
        region: g,
        query: `site:zakupki.gov.ru закупка ${ind || "продукты питания напитки"} ${g}`.trim(),
      });
      push({
        id: "contract_horeca_inst",
        label: "Питание учреждения",
        domain: "zakupki.gov.ru",
        intent: input.intentType,
        region: g,
        query: `site:zakupki.gov.ru поставка продуктов питания школа больница ${g}`.trim(),
      });
    }

    if (input.intentType === "SEEK_BUYER") {
      push({
        id: "buyer_confirmed_procurement",
        label: "Confirmed demand via EIS",
        domain: "zakupki.gov.ru",
        intent: input.intentType,
        region: g,
        query: `site:zakupki.gov.ru закупка ${ind || "напитки вода продукты"} ${g}`.trim(),
      });
      push({
        id: "buyer_request",
        label: "Запрос поставщика",
        intent: input.intentType,
        region: g,
        query: `запрос поставщика ${ind || "продукты напитки"} ${g}`.trim(),
      });
      // Potential buyers — lower priority, still capped
      push({
        id: "buyer_potential_horeca",
        label: "Potential HoReCa (INFERENCE)",
        intent: input.intentType,
        region: g,
        query: `гостиницы санатории рестораны ${g} закупка продуктов`.trim(),
      });
    }

    if (input.intentType === "SEEK_SUPPORT") {
      for (const domain of domains.filter((d) =>
        /mb05|cppdag|minec|minprom|mcxrd|corpmsp|e-dag|mspinvestrd/i.test(d),
      )) {
        push({
          id: `support_${domain}`,
          label: `Support site ${domain}`,
          domain,
          intent: input.intentType,
          region: g,
          query: `site:${domain} субсидия грант ${ind || "производство МСП"}`.trim(),
        });
      }
      push({
        id: "support_federal_applicable",
        label: "Федеральные меры (applicability RU/RD)",
        domain: "corpmsp.ru",
        intent: input.intentType,
        region: "Россия",
        query: `site:corpmsp.ru программа поддержки ${ind || "промышленность оборудование"}`.trim(),
      });
    }

    if (input.intentType === "INVEST" || input.intentType === "SEEK_PROJECT") {
      for (const domain of domains.filter((d) =>
        /dagestaninvest|mspinvestrd|minec|stavregion|investstav|invest/i.test(d),
      )) {
        push({
          id: `invest_${domain}`,
          label: `Invest portal ${domain}`,
          domain,
          intent: input.intentType,
          region: g,
          query: `site:${domain} инвестиционный проект ${ind || "производство"}`.trim(),
        });
      }
      const budget =
        input.budgetMax != null
          ? `до ${Math.round(input.budgetMax / 1_000_000)} млн`
          : "";
      push({
        id: "invest_site_geo",
        label: "Площадка/проект geo",
        intent: input.intentType,
        region: g,
        query: `инвестиционная площадка ${ind} ${g} ${budget}`.trim(),
      });
    }
  }

  // Ensure at least one geo-intent query if empty
  if (!strategies.length) {
    push({
      id: "fallback_geo",
      label: "Fallback geo intent",
      intent: input.intentType,
      region: String(primaryRegion),
      query: `${input.intentType} ${ind} ${primaryRegion}`.trim(),
    });
  }

  return strategies.slice(0, max);
}

export function regionalSourcesUsedSummary(intentType: string, regions: string[]) {
  const sources = listRegionalSources({
    region: regions[0] || "Дагестан",
    intent: intentType,
    enabledOnly: true,
  });
  return sources.map((s) => ({
    id: s.id,
    name: s.sourceName,
    domain: s.domain,
    health: s.health,
    official: s.official,
  }));
}
