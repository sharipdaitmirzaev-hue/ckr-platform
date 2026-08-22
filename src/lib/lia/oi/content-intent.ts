/**
 * Stage 2A.2 — content_intent: OPPORTUNITY / CATALOG / ARTICLE / …
 */

import { isCatalogPageType, isSeoArticlePage } from "@/lib/lia/oi/page-type";
import type { LiaOiContentIntent, LiaOiPageType } from "@/types/lia-oi";

const GUIDE_RE =
  /как (купить|продать|найти|оценить|выбрать|открыть)|инструкция|гайд|советы|разбор|личный опыт|не продешевить|быстро и дорого/i;
const NEWS_RE =
  /новост|сообщил[аи]|аналитики считают|рынок вырос|заголовок дня/i;
const VACANCY_RE =
  /ваканси|требуется сотрудник|ищем менеджера|зарплата от|hh\.ru|работа\s+/i;
const FORUM_RE = /форум|обсуждени|thread|комментари/i;
const SOCIAL_HOST =
  /^(www\.)?(instagram\.com|vk\.(com|ru)|t\.me|telegram\.me|facebook\.com|x\.com|twitter\.com|tiktok\.com|youtube\.com)/i;
const OPPORTUNITY_RE =
  /прода[её]тся|продажа\s+(действующ|готов|бизнес|производ|гостиниц|кафе|склад)|требуется инвестор|ищу инвестора|лот\s*№|инвестпроект|франшиза.*взнос|торги.*предприят/i;

export function classifyContentIntent(input: {
  url: string;
  title: string;
  snippet?: string;
  pageType: LiaOiPageType;
}): LiaOiContentIntent {
  const blob = `${input.title} ${input.snippet ?? ""}`;
  let host = "";
  let path = "/";
  try {
    const u = new URL(input.url);
    host = u.hostname.replace(/^www\./, "");
    path = u.pathname || "/";
  } catch {
    path = input.url;
  }

  if (SOCIAL_HOST.test(host) || SOCIAL_HOST.test(input.url)) {
    if (OPPORTUNITY_RE.test(blob) && /цена|млн|руб/i.test(blob)) {
      // редкий кейс: конкретное предложение в соцсети — всё равно SOCIAL (низкий trust)
      return "SOCIAL";
    }
    return "SOCIAL";
  }

  if (VACANCY_RE.test(blob) || /hh\.ru|avito\.ru\/.*vakans/i.test(input.url)) {
    return "GUIDE"; // treat vacancy as non-opportunity (reject path)
  }

  if (
    GUIDE_RE.test(blob) ||
    isSeoArticlePage({
      url: input.url,
      title: input.title,
      snippet: input.snippet,
    }) ||
    /\/(blog|articles?|news|stories|posts?)\b/i.test(path)
  ) {
    if (NEWS_RE.test(blob) || /\/news\b/i.test(path)) return "NEWS";
    if (GUIDE_RE.test(blob) || /как\s+/i.test(input.title)) return "GUIDE";
    return "ARTICLE";
  }

  if (NEWS_RE.test(blob)) return "NEWS";
  if (FORUM_RE.test(blob) && !OPPORTUNITY_RE.test(blob)) return "ARTICLE";

  if (
    input.pageType === "LIST" ||
    input.pageType === "CATEGORY" ||
    input.pageType === "HOMEPAGE" ||
    isCatalogPageType(input.pageType)
  ) {
    return "CATALOG";
  }

  if (OPPORTUNITY_RE.test(blob) || input.pageType === "DETAIL") {
    return "OPPORTUNITY";
  }

  return "UNKNOWN";
}

export function isNegativeContentIntent(intent: LiaOiContentIntent): boolean {
  return (
    intent === "GUIDE" ||
    intent === "ARTICLE" ||
    intent === "NEWS" ||
    intent === "SOCIAL"
  );
}
