/**
 * Stage 2A.2 — source-aware Search Planner + query expansion.
 */

import { LIA_OI_BUDGETS } from "@/config/lia-oi";
import {
  detectRegions as detectRegionsImpl,
  parseHardConstraints,
  parseSoftPreferences,
} from "@/lib/lia/oi/constraints";
import { oiId } from "@/lib/lia/oi/id";
import type {
  LiaOiSearchIntent,
  LiaOiSearchPlan,
  LiaOiSourceClass,
} from "@/types/lia-oi";

export { detectRegions } from "@/lib/lia/oi/constraints";

export function geographyToken(regions: string[]): string {
  if (!regions.length || regions[0] === "Россия") return "Россия";
  return regions[0];
}

/**
 * Intent classifier (2A.1/2A.2).
 * Широкие «бизнес-возможности» → business_opportunities.
 */
export function detectIntent(query: string): LiaOiSearchIntent {
  const q = query.toLowerCase();

  // Закупки/тендеры отдельно от торгов/активов (Stage 2C).
  if (
    /закупк|тендер|нмцк|44-?\s*фз|223-?\s*фз|zakupki/.test(q) &&
    !/бизнес.?возможност/i.test(q)
  ) {
    return "tenders";
  }
  if (
    /торг|аукцион|банкрот|федресурс|torgi|росимуществ/.test(q) &&
    !/бизнес.?возможност/i.test(q)
  ) {
    return "assets";
  }
  if (/господдерж|льгот|субсид|грант|мсп/.test(q) && !/бизнес.?возможност/i.test(q)) {
    return "support_programs";
  }
  if (/поставщик|снабжен/.test(q)) return "suppliers";
  if (/покупател|спрос|оптом купить|мук[аи]/.test(q)) return "buyers";
  if (/земл|участ|площадк/.test(q) && !/бизнес.?возможност/i.test(q)) {
    return "land_or_site";
  }
  if (/недвижим|офис|склад|торгов(ый|ое) помещ/.test(q) && !/бизнес.?возможност/i.test(q)) {
    return "real_estate";
  }
  if (/актив(ы|ов)?\b|имуществ/.test(q) && !/бизнес.?возможност/i.test(q)) {
    return "assets";
  }
  if (/гостиниц|отел|глэмп|туризм/.test(q) && !/бизнес.?возможност/i.test(q)) {
    return "hotel_or_tourism";
  }
  if (/оборудован/.test(q) && !/бизнес.?возможност/i.test(q)) return "equipment";

  if (
    /бизнес.?возможност|перспективн\w*\s+возможност|возможност\w*\s+для\s+бизнес|интересн\w*\s+возможност/.test(
      q,
    )
  ) {
    return "business_opportunities";
  }

  if (
    /инвест(иционн)?\w*\s+возможност|возможност\w*\s+для\s+инвест|ищу\s+инвест|поиск\s+инвест/.test(
      q,
    )
  ) {
    return "investment_opportunities";
  }

  if (/инвест|вложен|капитал|поиск инвестора|ищет инвестора/.test(q)) {
    return "investment_search";
  }

  if (
    /готов(ый|ого)\s+бизнес|продаж[аеи]\s+(действующ\w+\s+)?бизнес|бизнес\s+на\s+продаж|куп(ить|лю)\s+бизнес|франшиз/.test(
      q,
    )
  ) {
    return "business_for_sale";
  }

  if (/бизнес/.test(q)) return "business_opportunities";
  return "general_opportunity";
}

type SourceTemplate = {
  sourceClass: LiaOiSourceClass;
  hypothesis: string;
  /** site: queries — только публичные каталоги, без auth bypass */
  sites?: string[];
};

const BROAD_SOURCE_BANK: SourceTemplate[] = [
  {
    sourceClass: "READY_BUSINESS",
    hypothesis: "продаётся действующий бизнес цена объявление -каталог -как",
    sites: ["avito.ru", "biznes-prodazha.ru"],
  },
  {
    sourceClass: "PRODUCTION_ASSETS",
    hypothesis: "продаётся производство цех выручка цена -каталог",
  },
  {
    sourceClass: "INVESTMENT_PROJECT",
    hypothesis: "требуется инвестор проект сумма до -каталог",
  },
  {
    sourceClass: "COMMERCIAL_REAL_ESTATE",
    hypothesis: "коммерческая недвижимость продаётся объект м² цена",
    sites: ["cian.ru"],
  },
  {
    sourceClass: "AUCTIONS_ASSETS",
    hypothesis: "лот торги предприятие имущественный комплекс цена",
    sites: ["torgi.gov.ru"],
  },
  {
    sourceClass: "TENDERS",
    hypothesis: "закупка тендер извещение НМЦК поставка",
    sites: ["zakupki.gov.ru"],
  },
  {
    sourceClass: "LAND_SITES",
    hypothesis: "земельный участок под производство продажа цена",
  },
  {
    sourceClass: "FRANCHISE",
    hypothesis: "франшиза паушальный взнос окупаемость до",
  },
  {
    sourceClass: "SUPPORT_PROGRAMS",
    hypothesis: "господдержка МСП инвестиции программа грант",
  },
  {
    sourceClass: "OTHER",
    hypothesis: "гостиница кафе склад продаётся бизнес цена -как",
  },
  {
    sourceClass: "OTHER",
    hypothesis: "сельхозпроект ферма производство продуктов инвестиции",
  },
];

const INTENT_SOURCE_MAP: Partial<Record<LiaOiSearchIntent, LiaOiSourceClass[]>> =
  {
    business_opportunities: [
      "READY_BUSINESS",
      "INVESTMENT_PROJECT",
      "PRODUCTION_ASSETS",
      "COMMERCIAL_REAL_ESTATE",
      "AUCTIONS_ASSETS",
      "LAND_SITES",
      "FRANCHISE",
      "SUPPORT_PROGRAMS",
      "OTHER",
    ],
    investment_opportunities: [
      "INVESTMENT_PROJECT",
      "READY_BUSINESS",
      "SUPPORT_PROGRAMS",
      "PRODUCTION_ASSETS",
    ],
    investment_search: [
      "INVESTMENT_PROJECT",
      "READY_BUSINESS",
      "PRODUCTION_ASSETS",
      "COMMERCIAL_REAL_ESTATE",
    ],
    business_for_sale: ["READY_BUSINESS", "FRANCHISE", "PRODUCTION_ASSETS"],
    real_estate: ["COMMERCIAL_REAL_ESTATE", "LAND_SITES"],
    land_or_site: ["LAND_SITES", "AUCTIONS_ASSETS"],
    tenders: ["TENDERS"],
    support_programs: ["SUPPORT_PROGRAMS"],
    hotel_or_tourism: ["READY_BUSINESS", "OTHER"],
    assets: ["AUCTIONS_ASSETS", "PRODUCTION_ASSETS"],
  };

/** Убирает повтор geography/budget токенов. */
function composeQuery(parts: string[]): string {
  const geoWords = new Set(["россия", "рф", "российская", "федерация"]);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    for (const token of part.split(/\s+/)) {
      const lower = token.toLowerCase();
      if (geoWords.has(lower)) {
        if (seen.has("geo")) continue;
        seen.add("geo");
        out.push(token);
        continue;
      }
      const key = lower.replace(/[^a-zA-Zа-яА-ЯёЁ0-9-]+/g, "");
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(token);
    }
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

function budgetLabel(max: number | null): string {
  if (!max) return "";
  return `до ${Math.round(max / 1_000_000)} млн рублей`;
}

function priceBandQueries(max: number | null, geo: string): string[] {
  if (!max) return [];
  const mln = Math.round(max / 1_000_000);
  const mid = Math.max(1, Math.floor(mln / 2));
  return [
    composeQuery([
      `готовый бизнес продажа ${mid}-${mln} млн рублей объявление`,
      geo,
      "-каталог",
      "-как",
    ]),
    composeQuery([
      `производство продаётся цена до ${mln} млн`,
      geo,
      "объявление",
    ]),
  ];
}

/**
 * Pass-1 queries from intent + hard constraints + source classes.
 */
export function buildSearchPlan(rawQuery: string): LiaOiSearchPlan {
  const intent = detectIntent(rawQuery);
  const hard = parseHardConstraints(rawQuery);
  const soft = parseSoftPreferences(rawQuery);
  const regions = detectRegionsImpl(rawQuery);
  const geo = geographyToken(regions);
  const budgetMax = hard.maxBudgetRub;
  const bLabel = budgetLabel(budgetMax);

  const allowed =
    INTENT_SOURCE_MAP[intent] ?? INTENT_SOURCE_MAP.business_opportunities!;
  const templates = BROAD_SOURCE_BANK.filter((t) =>
    allowed.includes(t.sourceClass),
  );

  const hypotheses: string[] = [];
  const queries: string[] = [];
  const sourceClasses: LiaOiSourceClass[] = [];

  for (const t of templates) {
    if (queries.length >= LIA_OI_BUDGETS.maxQueriesPass1) break;
    hypotheses.push(t.hypothesis);
    sourceClasses.push(t.sourceClass);
    queries.push(composeQuery([t.hypothesis, geo, bLabel]));

    // 1–2 site-specific если ещё есть слот и класс приоритетный
    if (
      t.sites?.length &&
      queries.length < LIA_OI_BUDGETS.maxQueriesPass1 &&
      (t.sourceClass === "READY_BUSINESS" ||
        t.sourceClass === "AUCTIONS_ASSETS" ||
        t.sourceClass === "COMMERCIAL_REAL_ESTATE")
    ) {
      const site = t.sites[0];
      const siteQ = composeQuery([
        `site:${site}`,
        t.hypothesis.replace(/-каталог|-как/g, "").trim(),
        geo,
        bLabel,
      ]);
      if (!queries.includes(siteQ)) {
        queries.push(siteQ);
        hypotheses.push(`site:${site} ${t.hypothesis}`);
        sourceClasses.push(t.sourceClass);
      }
    }
  }

  // Укладываемся в pass1 limit
  const pass1Queries = queries.slice(0, LIA_OI_BUDGETS.maxQueriesPass1);

  return {
    id: oiId("plan"),
    rawQuery: rawQuery.trim(),
    intent,
    country: "RU",
    regions,
    budgetMin: hard.minBudgetRub,
    budgetMax,
    industries: ["ANY"],
    assetTypes:
      intent === "land_or_site"
        ? ["land", "industrial_site"]
        : intent === "real_estate"
          ? ["real_estate", "commercial"]
          : [
              "business",
              "production",
              "real_estate",
              "project",
              "franchise",
              "asset",
            ],
    hypotheses: hypotheses.slice(0, pass1Queries.length),
    queries: pass1Queries,
    pass1Queries,
    pass2Queries: [],
    sourceClasses: sourceClasses.slice(0, pass1Queries.length),
    hardConstraints: hard,
    softPreferences: soft,
    createdAt: new Date().toISOString(),
  };
}

export type Pass2Hints = {
  topCount: number;
  detailCount: number;
  fitCount: number;
  unknownPriceCount: number;
  opportunityCount: number;
};

/**
 * Второй проход: уточнённые queries, если мало качественных возможностей.
 * Не превышает remaining query budget.
 */
export function buildPass2Queries(
  plan: LiaOiSearchPlan,
  hints: Pass2Hints,
  remainingQueries: number,
): string[] {
  if (remainingQueries <= 0) return [];
  const geo = geographyToken(plan.regions);
  const max = plan.budgetMax ?? null;
  const out: string[] = [];

  if (hints.topCount < 5 || hints.detailCount < 3) {
    out.push(
      composeQuery([
        "продаётся готовый бизнес объявление цена конкретный объект",
        geo,
        budgetLabel(max),
        "-каталог",
        "-как купить",
        "-как продать",
      ]),
    );
    out.push(
      composeQuery([
        "действующее производство продаётся выручка цена",
        geo,
        budgetLabel(max),
        "объявление",
      ]),
    );
  }

  if (hints.fitCount < 3 && max) {
    out.push(...priceBandQueries(max, geo));
  }

  if (hints.opportunityCount < 4) {
    out.push(
      composeQuery([
        "требуется инвестор до",
        budgetLabel(max),
        "проект",
        geo,
        "-каталог",
      ]),
    );
    out.push(
      composeQuery([
        "site:avito.ru готовый бизнес",
        budgetLabel(max),
        geo,
      ]),
    );
  }

  // unique + limit
  const seen = new Set(plan.queries.map((q) => q.toLowerCase()));
  const unique = out.filter((q) => {
    const k = q.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return unique.slice(0, remainingQueries);
}
