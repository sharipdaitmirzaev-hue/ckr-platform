/**
 * Stage 4Q.4.2 — parse GIS Torgi official lot JSON / HTML ids.
 * Missing fields stay UNKNOWN. Serper snippet is never copied as FACT.
 */
import { field } from "@/lib/lia/oi/enrichment/types";
import type { LiaOiCandidate, LiaOiStructuredField } from "@/types/lia-oi";

export type TorgiLotParsed = {
  lotId: string;
  title: string | null;
  status: string | null;
  region: string | null;
  location: string | null;
  organizer: string | null;
  price: number | null;
  publishedAt: string | null;
  deadlineAt: string | null;
  canonicalUrl: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  const rec = asRecord(v);
  if (rec) {
    for (const k of ["name", "fullName", "orgName", "value", "title"]) {
      const s = str(rec[k]);
      if (s) return s;
    }
  }
  return null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function iso(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

export function isTorgiHost(url?: string | null): boolean {
  if (!url) return false;
  try {
    return /(^|\.)torgi\.gov\.ru$/i.test(new URL(url).hostname.replace(/^www\./, ""));
  } catch {
    return /torgi\.gov\.ru/i.test(url);
  }
}

export function isFedresursHost(url?: string | null): boolean {
  if (!url) return false;
  try {
    return /fedresurs\.ru$/i.test(new URL(url).hostname.replace(/^www\./, ""));
  } catch {
    return /fedresurs\.ru/i.test(url);
  }
}

export function extractTorgiLotId(url?: string | null): string | null {
  if (!url) return null;
  const m =
    url.match(/\/lots\/lot\/([A-Za-z0-9_-]+)/i) ||
    url.match(/lotcards\/lot\/([A-Za-z0-9_-]+)/i) ||
    url.match(/lotId=([A-Za-z0-9_-]+)/i);
  return m?.[1] ?? null;
}

export function torgiLotPageUrl(lotId: string): string {
  return `https://torgi.gov.ru/new/public/lots/lot/${lotId}`;
}

export function torgiLotApiUrl(lotId: string): string {
  return `https://torgi.gov.ru/new/api/public/lotcards/lot/${lotId}`;
}

export function normalizeOfficialLotStatus(raw?: string | null): string | null {
  if (!raw) return null;
  if (/отмен|cancelled|canceled|annul/i.test(raw)) return "отменен";
  if (/завершен|завершён|архив|закрыт|completed|closed|expired/i.test(raw)) return "завершен";
  return raw;
}

export function parseTorgiLotJson(body: string, canonicalUrl: string): TorgiLotParsed | null {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return null;
  }
  const root = asRecord(json);
  if (!root) return null;
  const data = asRecord(root.data) || asRecord(root.lot) || asRecord(root.lotCard) || root;
  const lotId =
    str(data.id) ||
    str(data.lotId) ||
    extractTorgiLotId(canonicalUrl);
  if (!lotId) return null;
  const title =
    str(data.lotName) ||
    str(data.name) ||
    str(data.title) ||
    str(data.lotDescription);
  const statusRaw =
    str(data.lotStatus) ||
    str(data.status) ||
    str(data.biddStatus);
  const region =
    str(data.subjectRFName) ||
    str(data.subjectRF) ||
    str(data.region);
  const location =
    str(data.estateAddress) ||
    str(data.address) ||
    str(data.lotObjectAddress) ||
    region;
  const organizer =
    str(data.biddOrg) ||
    str(data.organizer) ||
    str(data.rightHolder);
  const price =
    num(data.priceMin) ||
    num(data.startPrice) ||
    num(data.priceStart) ||
    num(data.minPrice);
  const publishedAt =
    iso(data.firstVersionPublicationDate) ||
    iso(data.publishDate) ||
    iso(data.createDate) ||
    iso(data.publicationDate);
  const deadlineAt =
    iso(data.biddEndTime) ||
    iso(data.endDate) ||
    iso(data.biddStopTime) ||
    iso(data.auctionEndDate);
  return {
    lotId,
    title,
    status: normalizeOfficialLotStatus(statusRaw),
    region,
    location,
    organizer,
    price,
    publishedAt,
    deadlineAt,
    canonicalUrl: torgiLotPageUrl(lotId),
  };
}

export function applyTorgiLotToCandidate(
  candidate: LiaOiCandidate,
  parsed: TorgiLotParsed,
): LiaOiCandidate {
  const url = parsed.canonicalUrl;
  const structured: LiaOiStructuredField[] = [];
  const push = (f: LiaOiStructuredField | null) => {
    if (f) structured.push(f);
  };
  const src = "official_api" as const;
  push(field("lot_id", parsed.lotId, { source: src, confidence: 96, sourceUrl: url }));
  push(field("object_name", parsed.title, { source: src, confidence: parsed.title ? 92 : 0, sourceUrl: url }));
  push(field("auction_status", parsed.status, { source: src, confidence: parsed.status ? 90 : 0, sourceUrl: url }));
  push(field("region", parsed.region, { source: src, confidence: parsed.region ? 90 : 0, sourceUrl: url }));
  push(field("address", parsed.location, { source: src, confidence: parsed.location ? 88 : 0, sourceUrl: url }));
  push(field("organizer", parsed.organizer, { source: src, confidence: parsed.organizer ? 85 : 0, sourceUrl: url }));
  if (parsed.price != null) {
    push(field("starting_price", parsed.price, { source: src, confidence: 94, sourceUrl: url }));
  }
  push(field("published_at", parsed.publishedAt, { source: src, confidence: parsed.publishedAt ? 88 : 0, sourceUrl: url }));
  push(field("deadline_at", parsed.deadlineAt, { source: src, confidence: parsed.deadlineAt ? 90 : 0, sourceUrl: url }));
  push(field("official_url", url, { source: src, confidence: 98, sourceUrl: url }));

  return {
    ...candidate,
    title: parsed.title && parsed.title.length > 8 ? parsed.title : candidate.title,
    sourceObjectId: parsed.lotId,
    region: parsed.region || candidate.region,
    address: parsed.location || candidate.address,
    organizer: parsed.organizer || candidate.organizer,
    auctionStatus: parsed.status || candidate.auctionStatus,
    askingPrice: parsed.price ?? candidate.askingPrice,
    startingPrice: parsed.price ?? candidate.startingPrice,
    priceKind: parsed.price != null ? "STARTING_AUCTION_PRICE" : candidate.priceKind,
    priceStatus: parsed.price != null ? "KNOWN" : "UNKNOWN",
    sourcePublishedAt: parsed.publishedAt || candidate.sourcePublishedAt,
    deadlineAt: parsed.deadlineAt || candidate.deadlineAt,
    canonicalUrl: url,
    isOfficialSource: true,
    isStub: false,
    dataChannel: "OFFICIAL_API",
    enrichedFromFetch: true,
    pageType: "DETAIL",
    lastSeenAt: new Date().toISOString(),
    structuredFields: [...(candidate.structuredFields || []).filter((f) => f.source !== "search_snippet"), ...structured],
    sources: [
      {
        id: `torgi-${parsed.lotId}`,
        category: "AUCTIONS",
        name: "torgi.gov.ru",
        url,
        isStub: false,
      },
    ],
  };
}
