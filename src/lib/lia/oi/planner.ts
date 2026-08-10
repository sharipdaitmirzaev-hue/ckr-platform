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
  if (/бизнес|прода/.test(q)) return "business_for_sale";
  return "general_opportunity";
}

function detectRegions(query: string): string[] {
  const map: Array<[RegExp, string]> = [
    [/дагестан/i, "Дагестан"],
    [/краснодар/i, "Краснодарский край"],
    [/скфо|северо.?кавказ/i, "СКФО"],
    [/москв/i, "Москва"],
    [/ростов/i, "Ростовская область"],
  ];
  const found = map.filter(([re]) => re.test(query)).map(([, name]) => name);
  return found.length ? found : ["Россия"];
}

/**
 * Search Planner: запрос владельца → структурированный план + гипотезы поиска.
 */
export function buildSearchPlan(rawQuery: string): LiaOiSearchPlan {
  const intent = detectIntent(rawQuery);
  const budgetMax = parseBudgetMax(rawQuery);
  const regions = detectRegions(rawQuery);
  const budgetLabel = budgetMax
    ? `до ${Math.round(budgetMax / 1_000_000)} млн ₽`
    : "бюджет не ограничен явно";

  const hypotheses = [
    "готовый бизнес",
    "производство / площадка",
    "недвижимость / земля",
    "инвестиционный проект",
    "проблемные / торги (сигнал)",
    "господдержка рядом с активом",
  ].slice(0, LIA_OI_BUDGETS.maxQueriesPerPlan);

  const regionPart = regions.join(", ");
  const queries = hypotheses.map(
    (h) => `${h} ${regionPart} ${budgetLabel}`.trim(),
  );

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
          : ["business", "production", "real_estate", "project"],
    hypotheses,
    queries,
    createdAt: new Date().toISOString(),
  };
}
