/**
 * Reliable DETAIL vs LIST/CATEGORY/NEWS/GUIDE for enrichment gating.
 */

import { classifyContentIntent } from "@/lib/lia/oi/content-intent";
import { classifyPageType, isCatalogPageType } from "@/lib/lia/oi/page-type";
import type { LiaOiPageType } from "@/types/lia-oi";

const OFFICIAL_DETAIL_PATH = {
  auction:
    /torgi\.gov\.ru\/new\/public\/(lots|notices)\/|bankrot\.fedresurs\.ru\/(TradeLotInfo|TradeCard)/i,
  procurement:
    /zakupki\.gov\.ru\/.*(regNumber=|noticeInfoId=|view\/|epz\/order)/i,
  support:
    /(мсп\.рф|xn--l1agf\.xn--p1ai|corpmsp\.ru|мойбизнес\.рф).*(detail|measures|services|support|promo)/i,
};

export function refinePageKind(input: {
  url: string;
  title: string;
  snippet?: string;
  adapterId?: string;
}): {
  pageType: LiaOiPageType;
  isDetail: boolean;
  reason: string;
} {
  const base = classifyPageType({
    url: input.url,
    title: input.title,
    snippet: input.snippet,
  });
  const intent = classifyContentIntent({
    url: input.url,
    title: input.title,
    snippet: input.snippet,
    pageType: base,
  });

  // Map content intents NEWS/GUIDE onto page types for Stage 2C.1 vocabulary
  if (intent === "NEWS" || /\/news\/|новост/i.test(input.url + input.title)) {
    return { pageType: "NEWS", isDetail: false, reason: "news" };
  }
  if (intent === "GUIDE" || intent === "ARTICLE") {
    return { pageType: "GUIDE", isDetail: false, reason: "guide_or_article" };
  }

  if (isCatalogPageType(base)) {
    return { pageType: base, isDetail: false, reason: "catalog" };
  }

  const url = input.url;
  if (
    OFFICIAL_DETAIL_PATH.auction.test(url) ||
    OFFICIAL_DETAIL_PATH.procurement.test(url) ||
    OFFICIAL_DETAIL_PATH.support.test(url)
  ) {
    // Homepage of official portal is not DETAIL
    try {
      const u = new URL(url);
      if ((u.pathname === "/" || u.pathname === "") && !u.search) {
        return { pageType: "HOMEPAGE", isDetail: false, reason: "portal_home" };
      }
    } catch {
      /* ignore */
    }
    // TradeList / search list pages
    if (/TradeList|search\/results|epz\/order\/extendedsearch/i.test(url)) {
      return { pageType: "LIST", isDetail: false, reason: "official_list" };
    }
    return { pageType: "DETAIL", isDetail: true, reason: "official_detail_path" };
  }

  if (base === "DETAIL") {
    return { pageType: "DETAIL", isDetail: true, reason: "heuristic_detail" };
  }

  return { pageType: base, isDetail: false, reason: "not_detail" };
}

export function isEnrichableDetail(pageType: LiaOiPageType): boolean {
  return pageType === "DETAIL";
}
