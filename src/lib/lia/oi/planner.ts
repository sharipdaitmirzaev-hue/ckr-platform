import { LIA_OI_BUDGETS } from "@/config/lia-oi";
import { oiId } from "@/lib/lia/oi/id";
import type { LiaOiSearchIntent, LiaOiSearchPlan } from "@/types/lia-oi";

function parseBudgetMax(query: string): number | null {
  const lower = query.toLowerCase();
  const mln = lower.match(/(\d+(?:[.,]\d+)?)\s*(млн|million)/i);
  if (mln) {
    return Math.round(parseFloat(mln[1].replace(",", ".")) * 1_000_000);
  }
  const rub = lower.match(/до\s+(\d[\d\s]{2,})\s*(₽|руб)/i);
  if (rub) {
    return Number(rub[1].replace(/\s/g, ""));
  }
  return null;
}

/**
 * Intent classifier (2A.1).
 * Широкие «бизнес-возможности» → business_opportunities (смесь направлений),
 * не только business_for_sale.
 */
export function detectIntent(query: string): LiaOiSearchIntent {
  const q = query.toLowerCase();

  if (/тендер|закупк|аукцион|торги/.test(q) && !/бизнес.?возможност/i.test(q)) {
    return "tenders";
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

  // Широкий intent — раньше узкой «продажи бизнеса»
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

  // Узкая продажа готового бизнеса — только при явных маркерах
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

/**
 * Регионы: вся Россия по умолчанию.
 * Конкретный регион — только если явно в запросе.
 */
export function detectRegions(query: string): string[] {
  const map: Array<[RegExp, string]> = [
    [/дагестан/i, "Дагестан"],
    [/краснодар|сочи/i, "Краснодарский край"],
    [/скфо|северо.?кавказ/i, "СКФО"],
    [/москв/i, "Москва"],
    [/санкт[-\s]?петербург|спб\b/i, "Санкт-Петербург"],
    [/ростов/i, "Ростовская область"],
    [/татарстан|казан/i, "Татарстан"],
    [/новосибир/i, "Новосибирская область"],
    [/екатеринбург|свердлов/i, "Свердловская область"],
  ];
  const found = map.filter(([re]) => re.test(query)).map(([, name]) => name);
  return found.length ? found : ["Россия"];
}

/** Один geography token для query — без «Россия Россия РФ». */
export function geographyToken(regions: string[]): string {
  if (!regions.length || regions[0] === "Россия") return "Россия";
  return regions[0];
}

const HYPOTHESIS_BANK: Record<LiaOiSearchIntent, string[]> = {
  business_opportunities: [
    // Акцент на конкретных лотах/объявлениях, не на каталогах
    "продаётся действующий бизнес цена объявление -каталог",
    "продаётся производство цех выручка объявление -каталог",
    "инвестиционный проект требуется инвестор сумма -каталог",
    "лот торги предприятие имущественный комплекс",
    "гостиница кафе склад продаётся бизнес цена",
    "коммерческая недвижимость продаётся объект м² цена",
    "франшиза паушальный взнос окупаемость условия",
    "предприятие ищет инвестора доля проект",
  ],
  investment_opportunities: [
    "инвестиционный проект Россия объявление",
    "поиск инвестора проект до",
    "доля в бизнесе инвестиции",
    "startup инвестиционный раунд Россия",
    "производство привлечение инвестиций",
    "господдержка инвестиционный проект",
  ],
  investment_search: [
    "инвестиционный проект поиск инвестора",
    "готовый бизнес продажа",
    "производство продажа бизнес",
    "коммерческая недвижимость инвестиция",
    "франшиза купить",
    "предприятие ищет инвестора",
  ],
  business_for_sale: [
    "готовый бизнес продажа объявление",
    "продажа действующего бизнеса цена",
    "франшиза купить",
    "производство продажа действующее",
    "коммерческая недвижимость продажа объект",
  ],
  assets: [
    "продажа активов предприятия",
    "имущественный комплекс продажа",
    "оборудование линия продажа",
    "торги имущество",
  ],
  real_estate: [
    "коммерческая недвижимость продажа объект",
    "офис продажа площадь",
    "склад продажа",
    "торговое помещение продажа",
  ],
  land_or_site: [
    "земельный участок под производство продажа",
    "промышленная площадка продажа",
    "завод продажа",
    "торги земельные участки",
  ],
  suppliers: [
    "поставщик оптом Россия",
    "производитель ищет дистрибьютора",
    "оптовые поставки",
  ],
  buyers: [
    "оптовый спрос покупатели",
    "тендер закупка",
    "дистрибьютор ищет поставщика",
  ],
  buyers_or_demand: [
    "оптовый спрос покупатели",
    "тендер закупка",
    "дистрибьютор ищет поставщика",
  ],
  support_programs: [
    "господдержка МСП программа",
    "льготное финансирование бизнес",
    "грант субсидия предприниматель",
  ],
  tenders: [
    "тендер закупка Россия",
    "торги имущество бизнес",
    "аукцион предприятие",
  ],
  hotel_or_tourism: [
    "гостиница продажа бизнес",
    "отель инвестиционный проект",
    "глэмпинг продажа",
  ],
  equipment: [
    "оборудование продажа производственная линия",
    "станки б/у продажа",
  ],
  general_opportunity: [
    "готовый бизнес продажа объявление",
    "инвестиционный проект",
    "производство продажа",
    "коммерческая недвижимость объект",
    "торги бизнес активы",
    "господдержка МСП",
  ],
};

/** Убирает повтор geography/budget токенов из hypothesis. */
function composeQuery(parts: string[]): string {
  const geoWords = new Set([
    "россия",
    "рф",
    "российская",
    "федерация",
  ]);
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
      const key = lower.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g, "");
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(token);
    }
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Search Planner: один запрос владельца → несколько поисковых направлений.
 */
export function buildSearchPlan(rawQuery: string): LiaOiSearchPlan {
  const intent = detectIntent(rawQuery);
  const budgetMax = parseBudgetMax(rawQuery);
  const regions = detectRegions(rawQuery);
  const geo = geographyToken(regions);
  const budgetLabel = budgetMax
    ? `до ${Math.round(budgetMax / 1_000_000)} млн рублей`
    : "";

  const bank = HYPOTHESIS_BANK[intent] ?? HYPOTHESIS_BANK.general_opportunity;
  const hypotheses = bank.slice(0, LIA_OI_BUDGETS.maxQueriesPerPlan);

  const queries = hypotheses.map((h) =>
    composeQuery([h, geo, budgetLabel]),
  );

  // Для широкого intent не дублируем сырой user query (он размывает выдачу каталогами).
  // Для узких — можно добавить прямую формулировку, если есть место.
  const narrow =
    intent === "business_for_sale" ||
    intent === "land_or_site" ||
    intent === "hotel_or_tourism" ||
    intent === "equipment";
  if (narrow && queries.length < LIA_OI_BUDGETS.maxQueriesPerPlan) {
    const direct = composeQuery([rawQuery.trim(), geo, budgetLabel]);
    if (!queries.includes(direct)) {
      queries.unshift(direct);
      queries.splice(LIA_OI_BUDGETS.maxQueriesPerPlan);
    }
  }

  return {
    id: oiId("plan"),
    rawQuery: rawQuery.trim(),
    intent,
    country: "RU",
    regions,
    budgetMin: null,
    budgetMax,
    industries: ["ANY"],
    assetTypes:
      intent === "land_or_site"
        ? ["land", "industrial_site"]
        : intent === "real_estate"
          ? ["real_estate", "commercial"]
          : intent === "hotel_or_tourism"
            ? ["hotel", "tourism"]
            : [
                "business",
                "production",
                "real_estate",
                "project",
                "franchise",
                "asset",
              ],
    hypotheses,
    queries,
    createdAt: new Date().toISOString(),
  };
}
