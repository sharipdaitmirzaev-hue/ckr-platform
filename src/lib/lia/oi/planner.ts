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

function detectIntent(query: string): LiaOiSearchIntent {
  const q = query.toLowerCase();
  if (/инвест|вложен|капитал/.test(q)) return "investment_search";
  if (/куп(ить|ят)|покупател|спрос|мук[аи]/.test(q)) return "buyers_or_demand";
  if (/земл|участ|площадк|завод/.test(q)) return "land_or_site";
  if (/гостиниц|отел|глэмп|туризм/.test(q)) return "hotel_or_tourism";
  if (/оборудован/.test(q)) return "equipment";
  if (/бизнес|прода|франшиз/.test(q)) return "business_for_sale";
  return "general_opportunity";
}

/**
 * Регионы: вся Россия по умолчанию.
 * Конкретный регион добавляется только если явно упомянут в запросе.
 * Не ограничиваем Дагестаном/СКФО.
 */
function detectRegions(query: string): string[] {
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

const HYPOTHESIS_BANK: Record<LiaOiSearchIntent, string[]> = {
  investment_search: [
    "инвестиционный проект поиск инвестора",
    "готовый бизнес продажа",
    "производство продажа бизнес",
    "коммерческая недвижимость инвестиция",
    "франшиза купить",
    "предприятие ищет инвестора",
    "торги имущество бизнес",
    "господдержка МСП инвестиции",
  ],
  business_for_sale: [
    "готовый бизнес продажа Россия",
    "продажа действующего бизнеса",
    "франшиза купить Россия",
    "производство продажа",
    "коммерческая недвижимость продажа",
    "оборудование бизнес продажа",
  ],
  land_or_site: [
    "земельный участок под производство Россия",
    "промышленная площадка продажа",
    "завод продажа",
    "складской комплекс продажа",
    "торги земельные участки",
  ],
  hotel_or_tourism: [
    "гостиница продажа бизнес Россия",
    "отель инвестиционный проект",
    "глэмпинг продажа",
    "туристический объект инвестиции",
  ],
  equipment: [
    "оборудование продажа бизнес Россия",
    "производственная линия продажа",
    "станки б/у продажа партия",
  ],
  buyers_or_demand: [
    "оптовый спрос покупатели Россия",
    "тендер закупка",
    "дистрибьютор ищет поставщика",
  ],
  general_opportunity: [
    "готовый бизнес продажа Россия",
    "инвестиционный проект Россия",
    "производство продажа",
    "коммерческая недвижимость",
    "франшиза",
    "торги бизнес активы",
    "господдержка МСП",
  ],
};

/**
 * Search Planner: один запрос владельца → несколько поисковых направлений.
 */
export function buildSearchPlan(rawQuery: string): LiaOiSearchPlan {
  const intent = detectIntent(rawQuery);
  const budgetMax = parseBudgetMax(rawQuery);
  const regions = detectRegions(rawQuery);
  const budgetLabel = budgetMax
    ? `до ${Math.round(budgetMax / 1_000_000)} млн рублей`
    : "";

  const bank = HYPOTHESIS_BANK[intent] ?? HYPOTHESIS_BANK.general_opportunity;
  const hypotheses = bank.slice(0, LIA_OI_BUDGETS.maxQueriesPerPlan);

  const regionPart =
    regions[0] === "Россия" ? "Россия РФ" : `${regions.join(" ")} Россия`;

  const queries = hypotheses.map((h) =>
    [h, regionPart, budgetLabel].filter(Boolean).join(" ").replace(/\s+/g, " ").trim(),
  );

  // Всегда добавляем близкий к исходному формулировке query (если есть место)
  const direct = [rawQuery.trim(), regionPart, budgetLabel]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (
    queries.length < LIA_OI_BUDGETS.maxQueriesPerPlan &&
    !queries.some((q) => q.includes(rawQuery.trim().slice(0, 24)))
  ) {
    queries.unshift(direct);
    queries.splice(LIA_OI_BUDGETS.maxQueriesPerPlan);
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
        : intent === "hotel_or_tourism"
          ? ["hotel", "tourism"]
          : ["business", "production", "real_estate", "project", "franchise"],
    hypotheses,
    queries,
    createdAt: new Date().toISOString(),
  };
}
