/**
 * Классификация типа страницы: DETAIL > LIST/CATEGORY/HOMEPAGE.
 */

import type { LiaOiPageType } from "@/types/lia-oi";

const LIST_PATH =
  /\/(catalog|katalog|category|categories|search|list|listings|products|offers|all|filter|tag|tags|rubric|investors?|investorov)([-_/]|$)/i;
const HOME_PATH = /^\/?$/;
const DETAIL_HINT =
  /\/(offer|product|item|lot|object|project|biznes|business|obyavlenie|advert|view|id[-_]?\d|\d{3,})(\/|$)/i;

const LIST_TITLE =
  /каталог|объявлени|подборк|список|все предлож|купить бизнес в|продажа готового бизнеса|франшиз[аы] каталог|база инвесторов|каталог инвесторов|каталог проектов/i;
const DETAIL_TITLE =
  /прода(ётся|ется|жа)\b|лот\b|участок\b|завод\b|гостиниц|отель|склад\s|цех\b|инвестпроект|требуется инвестор|ищу инвестора/i;

export function classifyPageType(input: {
  url: string;
  title: string;
  snippet?: string;
}): LiaOiPageType {
  let path = "/";
  let host = "";
  try {
    const u = new URL(input.url);
    path = u.pathname || "/";
    host = u.hostname.replace(/^www\./, "");
  } catch {
    path = input.url.split("?")[0] || "/";
  }

  const blob = `${input.title} ${input.snippet ?? ""}`;
  const full = `${path}?${input.url}`;

  if (HOME_PATH.test(path) || path === "/") {
    // homepage of marketplace/catalog domains
    if (/invest|broker|avito|cian|biz|business|франшиз|каталог/i.test(host + blob)) {
      return "HOMEPAGE";
    }
    return "HOMEPAGE";
  }

  // Official search / index surfaces — never DETAIL
  if (
    /extendedsearch|search\/results|\/search\b|\/results\.html/i.test(full) ||
    /extrajudicialbankruptcy\/?$/i.test(path) ||
    /\/epz\/order\/(?:nsi|quicksearch)/i.test(path)
  ) {
    return "LIST";
  }

  if (LIST_PATH.test(path) || /\/page\/\d+/i.test(path)) {
    return /category|rubric|tag/i.test(path) ? "CATEGORY" : "LIST";
  }

  // Newspapers / media
  if (
    /\/newspaper\/|rbc\.ru\/(?:newspaper|politics|society|economics)/i.test(
      host + path,
    )
  ) {
    return "NEWS";
  }

  // Editorial / SEO — раньше DETAIL (иначе /articles/887322/ ловится как id)
  if (
    /\/(blog|blogs|article|articles|news|stories|nezhiloe|post|posts)\b/i.test(
      path,
    ) ||
    /\b(как (я|продать|купить)|гид по|что такое|инвестиции в\b.*\bнедвижимость\b|быстро и дорого|не продешевить)\b/i.test(
      blob,
    )
  ) {
    if (/\/news\b/i.test(path) || /новост/i.test(blob)) return "NEWS";
    if (
      /\b(как (я|продать|купить)|гид по|что такое|инструкц)/i.test(blob) ||
      /\/(blog|article|articles|guide)\b/i.test(path)
    ) {
      return "GUIDE";
    }
    return "NEWS";
  }

  if (LIST_TITLE.test(input.title) && !DETAIL_HINT.test(path)) {
    return "LIST";
  }

  if (DETAIL_HINT.test(path) || DETAIL_TITLE.test(blob)) {
    // path like /rus/products/30/ can be category - check depth + digits
    const segments = path.split("/").filter(Boolean);
    if (
      segments.length <= 2 &&
      /products?|catalog|category/i.test(path) &&
      !/\d{4,}|offer|lot|item/i.test(path)
    ) {
      return "CATEGORY";
    }
    // «Продажа N объектов» без object-path — скорее витрина/подборка
    if (
      !DETAIL_HINT.test(path) &&
      /\b\d+\s+объект/i.test(blob) &&
      !/\/(obekt|object|offer|lot|item)\b/i.test(path)
    ) {
      return "LIST";
    }
    return "DETAIL";
  }

  // Deep path with numeric id → likely detail
  if (/\/\d{2,}(\/|$)/.test(path) && path.split("/").filter(Boolean).length >= 2) {
    if (/products?\/\d+\/?$/i.test(path) && LIST_TITLE.test(input.title)) {
      return "CATEGORY";
    }
    // /obekty/345/ — detail object; /cat-biznes/ — not
    if (/\/(cat-|category|katalog|catalog|search|tag)\b/i.test(path)) {
      return "LIST";
    }
    return "DETAIL";
  }

  if (LIST_TITLE.test(blob)) return "LIST";
  return "UNKNOWN";
}

/** SEO/статья без конкретного предложения объекта. */
export function isSeoArticlePage(input: {
  url: string;
  title: string;
  snippet?: string;
}): boolean {
  let path = "/";
  try {
    path = new URL(input.url).pathname || "/";
  } catch {
    path = input.url.split("?")[0] || "/";
  }
  const blob = `${input.title} ${input.snippet ?? ""}`;
  return (
    /\/(blog|blogs|article|articles|news|stories|nezhiloe)\b/i.test(path) ||
    /\b(как я|гид по|что такое|личный опыт|разбор кейса)\b/i.test(blob)
  );
}

export function isCatalogPageType(pageType: LiaOiPageType): boolean {
  return (
    pageType === "LIST" ||
    pageType === "CATEGORY" ||
    pageType === "HOMEPAGE" ||
    pageType === "NEWS" ||
    pageType === "GUIDE"
  );
}
