/**
 * Извлечение полей из текста сниппета/заголовка.
 * Не придумывает значения: нет в тексте → null / UNKNOWN.
 */

import type { LiaOiProvenanceKind } from "@/types/lia-oi";

export type ExtractedMoney = {
  amount: number;
  kind: LiaOiProvenanceKind;
  raw: string;
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

/** Цена/инвестиции только если явно есть в тексте. */
export function extractMoneyFromText(text: string): ExtractedMoney | null {
  const t = text.replace(/\u00a0/g, " ");
  const patterns: RegExp[] = [
    /(\d{1,3}(?:[\s\u00a0]\d{3})+|\d+(?:[.,]\d+)?)\s*(млн|миллион(?:а|ов)?)\s*(₽|руб(?:\.|лей)?)?/i,
    /(\d{1,3}(?:[\s\u00a0]\d{3}){1,}|\d{5,9})\s*(₽|руб(?:\.|лей)?)/i,
    /(?:цена|стоимость|инвестиц\w*|бюджет|вложен\w*)[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*(млн|миллион(?:а|ов)?)?/i,
  ];

  for (const re of patterns) {
    const m = t.match(re);
    if (!m) continue;
    const rawNum = (m[1] || "").replace(/\s/g, "").replace(",", ".");
    let amount = Number(rawNum);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const unit = (m[2] || "").toLowerCase();
    if (unit.startsWith("млн") || unit.startsWith("миллион")) {
      amount = Math.round(amount * 1_000_000);
    }
    if (amount < 10_000 || amount > 50_000_000_000) continue;
    return {
      amount,
      kind: "FACT",
      raw: m[0].trim(),
    };
  }
  return null;
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
