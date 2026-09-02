/**
 * Stage 4Q.3 — live signal quality gate.
 * Reject bad pages BEFORE ASSET×DEMAND pairing.
 * Reuses LIA OI page-type / content-intent helpers. Not a Matching Engine.
 */
import { classifyPageType, isCatalogPageType } from "@/lib/lia/oi/page-type";
import { refinePageKind } from "@/lib/lia/oi/enrichment/page-kind";
import { isGenericFinancingPage } from "@/lib/ckr-own-ideas/live-catalog-guards";
import type { LiaOiCandidate, LiaOiPageType } from "@/types/lia-oi";
import type {
  OwnIdeaClaimKind,
  OwnIdeaElementKind,
  OwnIdeaFinanceKind,
  OwnIdeaGeo,
  OwnIdeaGeoCompatibility,
  OwnIdeaPageType,
  OwnIdeaSignal,
  OwnIdeaSourceQuality,
} from "@/types/ckr-own-ideas";

const CLOSED_STATUS =
  /^(expired|closed|cancelled|canceled|completed|завершен|завершён|отменен|отменён|закрыт|исполнен|аннулир)/i;

const LISTING_PATH =
  /TradeList\.aspx|\/TradeList\b|extendedsearch|quicksearch|\/search\b|\/results\.html|extrajudicialbankruptcy\/?$/i;

const CATEGORY_TITLE =
  /тендеры на |закупки\s+\S+\s+в\s+|каталог закуп|индекс закуп|все закупки|подборка тендер/i;

const MIRROR_HOST =
  /(^|\.)(star-pro\.ru|zakupki360\.ru|tektorg\.ru|rts-tender\.ru|sberbank-ast\.ru)(\/|$)/i;

const OFFICIAL_HOST =
  /(zakupki\.gov\.ru|torgi\.gov\.ru|bankrot\.fedresurs\.ru|fedresurs\.ru|мсп\.рф|corpmsp\.ru)/i;

const BANK_LANDING =
  /(sberbank\.ru|vtb\.ru|alfabank|tinkoff|banki\.ru)(\/|$)/i;

export function mapLiaPageType(lia?: LiaOiPageType | null): OwnIdeaPageType {
  if (!lia) return "UNKNOWN";
  if (lia === "DETAIL") return "DETAIL";
  if (lia === "LIST") return "LISTING";
  if (lia === "CATEGORY") return "CATEGORY";
  if (lia === "HOMEPAGE") return "LANDING";
  if (lia === "NEWS" || lia === "GUIDE") return "LANDING";
  return "UNKNOWN";
}

export function classifyOwnIdeaPageType(input: {
  url?: string | null;
  title?: string | null;
  snippet?: string | null;
  liaPageType?: LiaOiPageType | null;
  isCatalogSource?: boolean;
}): OwnIdeaPageType {
  const url = input.url || "";
  const title = input.title || "";
  const snippet = input.snippet || "";
  const blob = `${title} ${snippet}`.trim();

  if (LISTING_PATH.test(url) || /TradeList/i.test(url)) return "LISTING";
  if (/\/epz\/order\/(?:nsi|extendedsearch|quicksearch)/i.test(url)) {
    return "SEARCH_RESULTS";
  }
  if (CATEGORY_TITLE.test(blob) && !/regNumber=|\/lot\/|notice\/\w+\/view/i.test(url)) {
    return "CATEGORY";
  }

  let host = "";
  let path = "/";
  try {
    const u = new URL(url);
    host = u.hostname.replace(/^www\./, "");
    path = u.pathname || "/";
  } catch {
    path = url.split("?")[0] || "/";
  }

  if (
    BANK_LANDING.test(host) &&
    (path === "/" || /\/ru\/(person|sme|legal)\/?$/i.test(path) || /credits?\/?$/i.test(path))
  ) {
    return "LANDING";
  }

  if (MIRROR_HOST.test(host) && !/regNumber=|lot\/|notice\/.*view/i.test(url)) {
    if (/search|list|catalog|index|category/i.test(path + url)) return "MIRROR";
    if (input.isCatalogSource) return "MIRROR";
  }

  const refined = url
    ? refinePageKind({ url, title, snippet, adapterId: undefined })
    : null;
  if (refined) {
    if (refined.pageType === "DETAIL" && refined.isDetail) {
      if (MIRROR_HOST.test(host) && !OFFICIAL_HOST.test(host)) return "MIRROR";
      return "DETAIL";
    }
    const mapped = mapLiaPageType(refined.pageType);
    if (mapped !== "UNKNOWN") return mapped;
  }

  if (input.liaPageType) {
    if (isCatalogPageType(input.liaPageType) || input.isCatalogSource) {
      return mapLiaPageType(input.liaPageType);
    }
    if (input.liaPageType === "DETAIL") return "DETAIL";
    const mapped = mapLiaPageType(input.liaPageType);
    if (mapped !== "UNKNOWN") return mapped;
  }

  if (url) {
    const base = classifyPageType({ url, title, snippet });
    if (base === "DETAIL") return "DETAIL";
    return mapLiaPageType(base);
  }

  if (input.isCatalogSource) return "LISTING";
  return "UNKNOWN";
}

export function isIdeaFactPageType(pageType?: OwnIdeaPageType | null): boolean {
  return pageType === "DETAIL";
}

export function extractOfficialFromAggregator(input: {
  url?: string | null;
  title?: string | null;
  snippet?: string | null;
  officialId?: string | null;
}): { url: string; id: string } | null {
  const blob = `${input.url || ""} ${input.title || ""} ${input.snippet || ""} ${input.officialId || ""}`;
  const notice = blob.match(/regNumber=(\d{10,20})/i) || blob.match(/\b(0\d{18})\b/);
  if (notice) {
    const id = notice[1];
    return {
      id,
      url: `https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=${id}`,
    };
  }
  const torgi =
    blob.match(/torgi\.gov\.ru\/(?:new\/public\/lots\/view\/)?([0-9a-f-]{8,})/i) ||
    blob.match(/torgi\.gov\.ru\/lot\/([^/\s?]+)/i);
  if (torgi) {
    const id = torgi[1];
    return { id, url: `https://torgi.gov.ru/new/public/lots/lot/${id}` };
  }
  return null;
}

export function sourceQualityOf(input: {
  url?: string | null;
  pageType?: OwnIdeaPageType | null;
  isOfficialSource?: boolean;
}): OwnIdeaSourceQuality {
  const url = input.url || "";
  const official = input.isOfficialSource || OFFICIAL_HOST.test(url);
  if (official && input.pageType === "DETAIL") {
    return /zakupki\.gov\.ru|torgi\.gov\.ru|fedresurs/i.test(url)
      ? "OFFICIAL_PRIMARY"
      : "OFFICIAL_DETAIL";
  }
  if (MIRROR_HOST.test(url) && input.pageType === "DETAIL") return "AGGREGATOR_DETAIL";
  return "OTHER";
}

export function isExpiredOpportunity(input: {
  deadlineAt?: string | null;
  status?: string | null;
  now?: number;
}): boolean {
  const status = (input.status || "").trim();
  if (status && CLOSED_STATUS.test(status)) return true;
  if (!input.deadlineAt) return false;
  const t = Date.parse(input.deadlineAt);
  if (Number.isNaN(t)) return false;
  const now = input.now ?? Date.now();
  return t < now - 24 * 60 * 60 * 1000;
}

const SUBJECTS: Array<{ key: string; district: string; re: RegExp; city?: RegExp }> = [
  {
    key: "dagestan",
    district: "skfo",
    re: /дагестан/,
    city: /махачкал|каспийск|избербаш|дербент|хасавюрт|кизляр/,
  },
  { key: "chechnya", district: "skfo", re: /чечен/, city: /грозн/ },
  { key: "ingushetia", district: "skfo", re: /ингуш/, city: /магас|назра/ },
  { key: "ossetia", district: "skfo", re: /осетия/, city: /владикавказ/ },
  { key: "kbd", district: "skfo", re: /кабардин/, city: /нальчик/ },
  { key: "kchr", district: "skfo", re: /карачаев|черкес/, city: /черкесск/ },
  { key: "stavropol", district: "skfo", re: /ставропол/, city: /ставропол/ },
  { key: "oryol", district: "cfo", re: /орловск|\bорел\b|\bорёл\b/, city: /\bорел\b|\bорёл\b/ },
  { key: "moscow", district: "cfo", re: /московск|\bмосква\b/, city: /\bмосква\b/ },
];

const DISTRICTS: Array<{ key: string; re: RegExp }> = [
  { key: "skfo", re: /скфо|северо.?кавказск/ },
  { key: "cfo", re: /цфо|центральн\w+ федеральн/ },
];

export function normalizeOwnIdeaGeo(region?: string | null): OwnIdeaGeo {
  const raw = region?.trim() || null;
  if (!raw) {
    return { country: null, federalDistrict: null, subject: null, city: null, raw: null };
  }
  const t = raw.toLowerCase().replace(/ё/g, "е");
  let subject: string | null = null;
  let federalDistrict: string | null = null;
  let city: string | null = null;
  for (const s of SUBJECTS) {
    if (s.re.test(t)) subject = s.key;
    if (s.city?.test(t)) city = s.key;
    if (s.re.test(t) || s.city?.test(t)) federalDistrict = s.district;
  }
  if (!federalDistrict) {
    for (const d of DISTRICTS) {
      if (d.re.test(t)) federalDistrict = d.key;
    }
  }
  const countryMention = /россия|российская федерация|\bрф\b|russia/.test(t);
  const country: "ru" | null =
    subject || federalDistrict || city || countryMention ? "ru" : null;
  return { country, federalDistrict, subject, city, raw };
}

export function geoCompatibility(
  a: OwnIdeaGeo | string | null | undefined,
  b: OwnIdeaGeo | string | null | undefined,
  opts?: { explicitCrossRegion?: boolean },
): OwnIdeaGeoCompatibility {
  const ga = typeof a === "object" && a ? a : normalizeOwnIdeaGeo(a ?? null);
  const gb = typeof b === "object" && b ? b : normalizeOwnIdeaGeo(b ?? null);
  const aSpecific = Boolean(ga.subject || ga.city || ga.federalDistrict);
  const bSpecific = Boolean(gb.subject || gb.city || gb.federalDistrict);
  if (!aSpecific && !bSpecific) return "UNKNOWN";
  if (!aSpecific || !bSpecific) return "UNKNOWN";

  if (ga.subject && gb.subject && ga.subject === gb.subject) return "SAME_REGION";
  if (ga.city && gb.city && ga.city === gb.city) return "SAME_REGION";

  const sameDistrict =
    ga.federalDistrict &&
    gb.federalDistrict &&
    ga.federalDistrict === gb.federalDistrict;
  if (sameDistrict) return "NEAR_REGION";

  if (opts?.explicitCrossRegion) return "CROSS_REGION_EXPLICIT";
  return "INCOMPATIBLE";
}

export function geoAcceptableForIdea(compat: OwnIdeaGeoCompatibility): boolean {
  return compat === "SAME_REGION" || compat === "NEAR_REGION" || compat === "CROSS_REGION_EXPLICIT";
}

const INDUSTRY_ALIASES: Array<{ key: string; re: RegExp }> = [
  { key: "construction", re: /construction|строитель|земля|земляные|earthworks|экскаватор|спецтех|котлован/ },
  { key: "tourism", re: /tourism|туризм|гостиниц|турбаз|hospitality/ },
  { key: "food", re: /food|пищев|консерв|продукт|напиток/ },
  { key: "warehouse", re: /warehouse|склад|ритейл|retail/ },
  { key: "textile", re: /textile|бель[её]|underwear|текстил|одежд/ },
  { key: "equipment", re: /весы|оборудование|станк/ },
];

export function industryKeyOf(signal: Pick<OwnIdeaSignal, "industry" | "title" | "tags">): string | null {
  const raw = (signal.industry || "").trim().toLowerCase();
  const blob = `${raw} ${signal.title || ""} ${(signal.tags || []).join(" ")}`.toLowerCase();
  for (const a of INDUSTRY_ALIASES) {
    if (a.re.test(blob)) return a.key;
  }
  return null;
}

export function industriesCompatibleKeys(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a === b;
}

export function industryCompatibility(
  asset: Pick<OwnIdeaSignal, "industry" | "title" | "tags" | "kind">,
  demand: Pick<OwnIdeaSignal, "industry" | "title" | "tags" | "kind">,
): { ok: boolean; reason: string; assetKey: string | null; demandKey: string | null } {
  const assetKey = industryKeyOf(asset);
  const demandKey = industryKeyOf(demand);
  if (!assetKey) {
    return { ok: false, reason: "unknown_asset_category", assetKey, demandKey };
  }
  if (!demandKey) {
    return { ok: false, reason: "unknown_demand_category", assetKey, demandKey };
  }
  if (!industriesCompatibleKeys(assetKey, demandKey)) {
    return { ok: false, reason: "industry_mismatch", assetKey, demandKey };
  }
  return { ok: true, reason: "compatible", assetKey, demandKey };
}

export function classifyFinanceKind(input: {
  title?: string | null;
  url?: string | null;
  origin?: string | null;
}): OwnIdeaFinanceKind | null {
  const blob = `${input.title || ""} ${input.url || ""} ${input.origin || ""}`.toLowerCase();
  if (input.origin === "INTERNAL_CKR" || /собственн(ые|ый)\s+средств/.test(blob)) {
    return "INTERNAL_CAPITAL";
  }
  if (/лизинг/.test(blob)) return "LEASING";
  if (/грант/.test(blob)) return "GRANT";
  if (/субсид/.test(blob)) return "SUBSIDY";
  if (/инвестор|инвест/.test(blob)) return "INVESTOR";
  if (/кредит|займ|loan/.test(blob)) return "LOAN";
  return null;
}

export type DetailValidation = {
  claimKind: OwnIdeaClaimKind;
  missing: string[];
  reject: boolean;
  reason: string;
};

function hasText(v?: string | null): boolean {
  return Boolean(v && v.trim());
}

export function validateDetailFields(input: {
  kind: OwnIdeaElementKind;
  pageType?: OwnIdeaPageType | null;
  officialId?: string | null;
  title?: string | null;
  customer?: string | null;
  region?: string | null;
  location?: string | null;
  publishedAt?: string | null;
  deadlineAt?: string | null;
  status?: string | null;
  sourceUrl?: string | null;
  amount?: number | null;
  priceUnknown?: boolean;
  provider?: string | null;
  applicability?: string | null;
  freshness?: string | null;
  objectTitle?: string | null;
}): DetailValidation {
  if (input.pageType && input.pageType !== "DETAIL") {
    return {
      claimKind: "UNKNOWN",
      missing: ["detail_page"],
      reject: true,
      reason: `pageType_${input.pageType}_not_fact`,
    };
  }
  if (isExpiredOpportunity({ deadlineAt: input.deadlineAt, status: input.status })) {
    return { claimKind: "UNKNOWN", missing: ["active_status"], reject: true, reason: "expired" };
  }

  const url = input.sourceUrl;
  const missing: string[] = [];
  const kind = input.kind;

  if (kind === "DEMAND" || kind === "MARKET") {
    if (!hasText(input.officialId)) missing.push("notice_id");
    if (!hasText(input.title)) missing.push("subject");
    if (!hasText(input.customer)) missing.push("customer");
    if (!hasText(input.region) && !hasText(input.location)) missing.push("region");
    if (!hasText(input.publishedAt)) missing.push("published_at");
    if (!hasText(url)) missing.push("source_url");
    if (!hasText(input.deadlineAt) && !hasText(input.status)) missing.push("deadline_or_status");
    if (missing.length) {
      return {
        claimKind: missing.length >= 4 ? "UNKNOWN" : "INFERENCE",
        missing,
        reject: missing.length >= 4,
        reason: "insufficient_demand_fields",
      };
    }
    return { claimKind: "FACT", missing: [], reject: false, reason: "demand_detail" };
  }

  if (kind === "ASSET" || kind === "LOCATION") {
    if (!hasText(input.officialId)) missing.push("lot_id");
    if (!hasText(input.objectTitle) && !hasText(input.title)) missing.push("object");
    if (!hasText(input.location) && !hasText(input.region)) missing.push("location");
    if (!hasText(url)) missing.push("source_url");
    if (input.amount == null && !input.priceUnknown) missing.push("price_or_unknown");
    if (missing.length) {
      return {
        claimKind: missing.length >= 3 ? "UNKNOWN" : "INFERENCE",
        missing,
        reject: missing.length >= 3,
        reason: "insufficient_asset_fields",
      };
    }
    return { claimKind: "FACT", missing: [], reject: false, reason: "asset_detail" };
  }

  if (kind === "CAPITAL") {
    if (!hasText(input.title)) missing.push("program");
    if (!hasText(input.provider)) missing.push("provider");
    if (!hasText(input.applicability)) missing.push("applicability");
    if (!hasText(input.freshness) && !hasText(input.publishedAt)) missing.push("freshness");
    if (!hasText(url)) missing.push("source_url");
    if (isGenericFinancingPage({ url, title: input.title })) {
      return {
        claimKind: "UNKNOWN",
        missing: ["specific_product"],
        reject: false,
        reason: "generic_bank_landing",
      };
    }
    if (missing.length) {
      return {
        claimKind: "INFERENCE",
        missing,
        reject: false,
        reason: "insufficient_finance_fields",
      };
    }
    return { claimKind: "FACT", missing: [], reject: false, reason: "finance_detail" };
  }

  if (!hasText(url) || !hasText(input.title)) {
    return { claimKind: "UNKNOWN", missing: ["identity"], reject: true, reason: "weak_signal" };
  }
  return { claimKind: "INFERENCE", missing: [], reject: false, reason: "other" };
}

export function isStrongInference(signal: OwnIdeaSignal): boolean {
  if (signal.claimKind !== "INFERENCE") return false;
  if (signal.pageType !== "DETAIL") return false;
  if (signal.kind === "CAPITAL" && signal.financeAvailability === "UNKNOWN") return false;
  const trust = signal.trustLevel;
  return Boolean(
    signal.officialId ||
      trust === "official" ||
      trust === "government_open" ||
      trust === "trusted_secondary",
  );
}

export function isLiveDetailFact(signal: OwnIdeaSignal): boolean {
  return (
    signal.claimKind === "FACT" &&
    signal.pageType === "DETAIL" &&
    signal.trustLevel !== "general_web" &&
    signal.trustLevel !== "search_snippet"
  );
}

export function pairCompatibility(
  a: OwnIdeaSignal,
  b: OwnIdeaSignal,
): { ok: boolean; reason: string; geo: OwnIdeaGeoCompatibility; industryOk: boolean } {
  const listingAsFact = [a, b].filter(
    (s) => s.claimKind === "FACT" && s.pageType && s.pageType !== "DETAIL",
  );
  if (listingAsFact.length) {
    return {
      ok: false,
      reason: "listing_category_as_fact",
      geo: "UNKNOWN",
      industryOk: false,
    };
  }
  if (a.pageType && a.pageType !== "DETAIL") {
    return { ok: false, reason: `pageType_${a.pageType}`, geo: "UNKNOWN", industryOk: false };
  }
  if (b.pageType && b.pageType !== "DETAIL") {
    return { ok: false, reason: `pageType_${b.pageType}`, geo: "UNKNOWN", industryOk: false };
  }

  const industry = industryCompatibility(a, b);
  const geo = geoCompatibility(a.geo || a.region, b.geo || b.region, {
    explicitCrossRegion: Boolean(a.crossRegionJustified || b.crossRegionJustified),
  });
  if (!industry.ok) {
    return { ok: false, reason: industry.reason, geo, industryOk: false };
  }
  if (!geoAcceptableForIdea(geo)) {
    return { ok: false, reason: `geo_${geo.toLowerCase()}`, geo, industryOk: true };
  }
  return { ok: true, reason: "compatible", geo, industryOk: true };
}

export function passesMinIdeaGate(signals: OwnIdeaSignal[]): { ok: boolean; reason: string } {
  if (signals.length < 2) return { ok: false, reason: "need_two_signals" };
  if (signals.some((s) => s.claimKind === "FACT" && s.pageType && s.pageType !== "DETAIL")) {
    return { ok: false, reason: "listing_category_as_fact" };
  }
  const facts = signals.filter(isLiveDetailFact);
  const strong = signals.filter(isStrongInference);
  if (facts.length < 1) return { ok: false, reason: "need_detail_fact" };
  if (facts.length + strong.length < 2 && facts.length < 2) {
    return { ok: false, reason: "need_second_fact_or_strong_inference" };
  }
  const core = signals.filter((s) =>
    ["ASSET", "LOCATION", "DEMAND", "MARKET", "SUPPLY"].includes(s.kind),
  );
  if (core.length >= 2) {
    const fit = pairCompatibility(core[0], core[1]);
    if (!fit.ok) return { ok: false, reason: fit.reason };
  }
  return { ok: true, reason: "ok" };
}

export function candidateToGateFields(c: LiaOiCandidate): {
  officialId: string | null;
  url: string | null;
  customer: string | null;
  publishedAt: string | null;
  deadlineAt: string | null;
  status: string | null;
  location: string | null;
  provider: string | null;
  applicability: string | null;
  freshness: string | null;
  priceUnknown: boolean;
} {
  const url = c.canonicalUrl || c.sources?.[0]?.url || null;
  const officialId =
    c.sourceObjectId ||
    extractOfficialFromAggregator({
      url,
      title: c.title,
      officialId: c.sourceObjectId,
    })?.id ||
    null;
  return {
    officialId,
    url,
    customer: c.customer || c.organizer || null,
    publishedAt: c.sourcePublishedAt || null,
    deadlineAt: c.deadlineAt || null,
    status: c.auctionStatus || c.procurementStage || null,
    location: c.address || c.city || c.region || null,
    provider: c.organizer || c.sources?.[0]?.name || null,
    applicability: c.eligibility || c.regionApplicability || c.region || null,
    freshness: c.sourcePublishedAt || c.lastSeenAt || null,
    priceUnknown: c.nmck == null && c.askingPrice == null && c.investmentRequired == null,
  };
}
