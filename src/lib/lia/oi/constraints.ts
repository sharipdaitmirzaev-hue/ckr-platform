/**
 * Stage 2A.2 — HARD constraints vs SOFT preferences.
 */

import type {
  LiaOiBudgetFit,
  LiaOiHardConstraints,
  LiaOiPriceStatus,
  LiaOiSoftPreferences,
} from "@/types/lia-oi";

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

function parseBudgetMin(query: string): number | null {
  const m = query.toLowerCase().match(/от\s+(\d+(?:[.,]\d+)?)\s*(млн|million)/i);
  if (!m) return null;
  return Math.round(parseFloat(m[1].replace(",", ".")) * 1_000_000);
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

export function parseHardConstraints(query: string): LiaOiHardConstraints {
  const regions = detectRegions(query);
  return {
    geography: regions[0] || "Россия",
    maxBudgetRub: parseBudgetMax(query),
    minBudgetRub: parseBudgetMin(query),
  };
}

export function parseSoftPreferences(query: string): LiaOiSoftPreferences {
  const q = query.toLowerCase();
  return {
    preferPerspective: /перспектив|интересн|качествн/.test(q),
    preferDataQuality: true,
    preferFinancialAttractiveness:
      /окупаем|прибыл|рентабел|финпоказат/.test(q) || true,
    notes: [
      "перспективность",
      "качество данных",
      "финансовая привлекательность",
    ],
  };
}

export function resolvePriceStatus(price: number | null | undefined): LiaOiPriceStatus {
  return price != null && price > 0 ? "KNOWN" : "UNKNOWN";
}

/**
 * Отсутствие цены ≠ соответствие бюджету.
 */
export function resolveBudgetFit(
  price: number | null | undefined,
  maxBudget: number | null | undefined,
): LiaOiBudgetFit {
  if (price == null || !(price > 0)) return "UNKNOWN";
  if (maxBudget == null) return "FIT";
  return price <= maxBudget ? "FIT" : "OVER_BUDGET";
}
