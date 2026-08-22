/**
 * Извлечение полей из текста сниппета/заголовка.
 * Не придумывает значения: нет в тексте → null / UNKNOWN.
 * Stage 2A.2: различение цены / инвестиций / выручки / прибыли.
 */

import type { LiaOiPriceKind, LiaOiProvenanceKind } from "@/types/lia-oi";

export type ExtractedMoney = {
  amount: number;
  kind: LiaOiProvenanceKind;
  raw: string;
  /** Stage 2A.2 */
  priceKind: LiaOiPriceKind;
};

export type ExtractedLocation = {
  region?: string;
  city?: string;
  kind: LiaOiProvenanceKind;
  raw: string;
};

const REGION_PATTERNS: Array<[RegExp, string]> = [
  [/москв[аеы]/i, "Москва"],
  [/санкт[-\s]?петербург|спб\b/i, "Санкт-Петербург"],
  [/краснодар/i, "Краснодарский край"],
  [/ростов/i, "Ростовская область"],
  [/дагестан/i, "Дагестан"],
  [/татарстан|казан/i, "Татарстан"],
  [/свердлов|екатеринбург/i, "Свердловская область"],
  [/новосибир/i, "Новосибирская область"],
  [/ленинградск/i, "Ленинградская область"],
  [/подмосков|московск/i, "Московская область"],
  [/башкортостан|уфа\b/i, "Башкортостан"],
  [/нижегород|нижегородск/i, "Нижегородская область"],
  [/самар/i, "Самарская область"],
  [/краснояр/i, "Красноярский край"],
  [/примор/i, "Приморский край"],
  [/крым/i, "Крым"],
  [/сочи\b/i, "Краснодарский край"],
];

const REVENUE_CTX =
  /выручк|оборот|доход(?!ност)|revenue|месячн\w*\s+(выручк|оборот)|годов\w*\s+(выручк|оборот)/i;
const PROFIT_CTX = /прибыл|чистая прибыль|ebitda|маржа\b/i;
const AUCTION_CTX =
  /начальн\w*\s+цен|стартов\w*\s+цен|цена\s+торгов|лот\s*№|аукцион/i;
const INVEST_CTX =
  /инвестиц|требуется инвестор|поиск инвестора|объ[её]м вложен|нужно вложен|сумма инвестиций|budget/i;
const ASKING_CTX =
  /цена\s+(продаж|бизнес)|стоимость\s+бизнес|прода[её]тся\s+за|asking|стоимость объекта|цена объекта/i;
const ASSET_CTX = /стоимость\s+актив|оценка\s+актив|имущественн/i;

function parseAmountToken(rawNum: string, unit: string): number | null {
  let amount = Number(rawNum.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const u = unit.toLowerCase();
  if (u.startsWith("млн") || u.startsWith("миллион")) {
    amount = Math.round(amount * 1_000_000);
  } else if (u.startsWith("тыс") || u === "т." || u === "т") {
    amount = Math.round(amount * 1_000);
  }
  if (amount < 10_000 || amount > 50_000_000_000) return null;
  return amount;
}

function classifyPriceKind(
  window: string,
  defaultKind: LiaOiPriceKind,
): LiaOiPriceKind | "REVENUE" | "PROFIT" {
  if (REVENUE_CTX.test(window)) return "REVENUE";
  if (PROFIT_CTX.test(window)) return "PROFIT";
  if (AUCTION_CTX.test(window)) return "STARTING_AUCTION_PRICE";
  if (INVEST_CTX.test(window)) return "INVESTMENT_REQUIRED";
  if (ASKING_CTX.test(window)) return "ASKING_PRICE";
  if (ASSET_CTX.test(window)) return "ASSET_PRICE";
  return defaultKind;
}

/**
 * Извлекает цену/инвестиции, не путая с выручкой/прибылью.
 */
export function extractMoneyFromText(text: string): ExtractedMoney | null {
  const t = text.replace(/\u00a0/g, " ");
  const patterns: Array<{ re: RegExp; defaultKind: LiaOiPriceKind }> = [
    {
      re: /(\d{1,3}(?:[\s\u00a0]\d{3})+|\d+(?:[.,]\d+)?)\s*(млн|миллион(?:а|ов)?)\s*(₽|руб(?:\.|лей)?|рублей)?/gi,
      defaultKind: "ASKING_PRICE",
    },
    {
      re: /(\d{1,3}(?:[\s\u00a0]\d{3})+|\d+(?:[.,]\d+)?)\s*(тыс\.?|тысяч(?:и|а)?)\s*(₽|руб(?:\.|лей)?|рублей)?/gi,
      defaultKind: "ASKING_PRICE",
    },
    {
      re: /(\d{1,3}(?:[\s\u00a0]\d{3}){1,}|\d{5,9})\s*(₽|руб(?:\.|лей)?|рублей)/gi,
      defaultKind: "ASKING_PRICE",
    },
    {
      re: /(?:цена|стоимость|инвестиц\w*|бюджет|вложен\w*|лот)[^\d]{0,24}(\d+(?:[.,]\d+)?)\s*(млн|миллион(?:а|ов)?|тыс\.?|тысяч(?:и|а)?)?/gi,
      defaultKind: "UNKNOWN",
    },
  ];

  type Cand = ExtractedMoney & { rank: number };
  const cands: Cand[] = [];

  for (const { re, defaultKind } of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(t)) !== null) {
      const rawNum = m[1] || "";
      const unit = m[2] || "";
      const amount = parseAmountToken(rawNum, unit);
      if (amount == null) continue;
      const start = Math.max(0, m.index - 40);
      const end = Math.min(t.length, m.index + m[0].length + 40);
      const window = t.slice(start, end);
      const kindOrMetric = classifyPriceKind(window, defaultKind);
      if (kindOrMetric === "REVENUE" || kindOrMetric === "PROFIT") continue;
      const priceKind = kindOrMetric;
      const rank =
        priceKind === "ASKING_PRICE"
          ? 5
          : priceKind === "INVESTMENT_REQUIRED"
            ? 4
            : priceKind === "STARTING_AUCTION_PRICE"
              ? 3
              : priceKind === "ASSET_PRICE"
                ? 2
                : 1;
      cands.push({
        amount,
        kind: "FACT",
        raw: m[0].trim(),
        priceKind,
        rank,
      });
    }
  }

  if (!cands.length) return null;
  // Если есть сумма в млн — предпочитаем её «голым» тысячам/рублям
  // (часто на странице рядом мелкие цифры: 200 000 ₽/мес и т.п.).
  const hasMln = cands.some((c) => /млн|миллион/i.test(c.raw));
  const pool = hasMln
    ? cands.filter((c) => /млн|миллион/i.test(c.raw) || c.amount >= 1_000_000)
    : cands;
  pool.sort((a, b) => b.rank - a.rank || a.amount - b.amount);
  const best = pool[0] ?? cands[0];
  return {
    amount: best.amount,
    kind: best.kind,
    raw: best.raw,
    priceKind: best.priceKind,
  };
}

/** Отдельно: выручка/прибыль (не для budgetFit). */
export function extractFinancialMetrics(text: string): {
  revenue: number | null;
  profit: number | null;
} {
  const t = text.replace(/\u00a0/g, " ");
  let revenue: number | null = null;
  let profit: number | null = null;
  const re =
    /(выручка|оборот|прибыль|ebitda)[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(млн|миллион(?:а|ов)?|тыс\.?)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const label = (m[1] || "").toLowerCase();
    const amount = parseAmountToken(m[2] || "", m[3] || "");
    if (amount == null) continue;
    if (/выручк|оборот/.test(label) && revenue == null) revenue = amount;
    if (/прибыл|ebitda/.test(label) && profit == null) profit = amount;
  }
  return { revenue, profit };
}

export function extractLocationFromText(text: string): ExtractedLocation | null {
  for (const [re, region] of REGION_PATTERNS) {
    const m = text.match(re);
    if (m) {
      return { region, kind: "FACT", raw: m[0] };
    }
  }
  if (/по\s+росси|в\s+рф|россия/i.test(text)) {
    return { region: "Россия", kind: "FACT", raw: "Россия" };
  }
  return null;
}

export function extractIndustryHint(text: string): string | undefined {
  const t = text.toLowerCase();
  if (/производств|завод|цех/.test(t)) return "производство";
  if (/гостиниц|отел|глэмп|туризм/.test(t)) return "туризм";
  if (/склад|логист/.test(t)) return "логистика";
  if (/франшиз/.test(t)) return "франшиза";
  if (/недвижим|офис|торгов/.test(t)) return "недвижимость";
  if (/сельхоз|агро|фермер/.test(t)) return "сельское хозяйство";
  if (/it\b|saas|цифров|софт/.test(t)) return "IT";
  if (/кафе|ресторан|общепит/.test(t)) return "общепит";
  return undefined;
}

export function extractPublicContacts(text: string): {
  phone?: string;
  email?: string;
} {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(
    /(?:\+7|8)[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/,
  )?.[0];
  return {
    email: email || undefined,
    phone: phone || undefined,
  };
}

export function classifySourceCategory(
  url: string,
  text: string,
):
  | "CLASSIFIEDS"
  | "REAL_ESTATE"
  | "PROCUREMENT"
  | "GOVERNMENT"
  | "AUCTIONS"
  | "BUSINESS"
  | "NEWS_SIGNALS"
  | "SUPPORT_PROGRAMS"
  | "PUBLIC_WEB" {
  const host = (() => {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();
  const blob = `${host} ${text}`.toLowerCase();
  if (/avito|youla|irr\.ru|ciann|farpost/.test(blob)) return "CLASSIFIEDS";
  if (/cian|domclick|n1\.ru|realty|недвижим/.test(blob)) return "REAL_ESTATE";
  if (/zakupk|goszakup|тэндер|тендер|procurement/.test(blob))
    return "PROCUREMENT";
  if (/torgi\.gov|аукцион|банкрот/.test(blob)) return "AUCTIONS";
  if (/\.gov\.ru|минэконом|мсп|поддержк/.test(blob)) return "SUPPORT_PROGRAMS";
  if (/gov\.ru/.test(host)) return "GOVERNMENT";
  if (/бизнес|franchise|франшиз|инвест/.test(blob)) return "BUSINESS";
  if (/news|ria\.|rbc\.|kommersant|vedomosti/.test(blob)) return "NEWS_SIGNALS";
  return "PUBLIC_WEB";
}
