/**
 * Stage 4N — procurement notice identity (44-FZ / 223-FZ registry numbers).
 */

/** Typical 19-digit EIS notice / purchase number. */
const NOTICE_RE = /\b(\d{18,19})\b/g;

/** Known stub / fixture notice used in Stage 2C demos — never treat as TINDA real. */
export const FIXTURE_PROCUREMENT_NOTICES = new Set([
  "0373100043226000123",
]);

export function extractNoticeIdFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const matches = [...String(text).matchAll(NOTICE_RE)].map((m) => m[1]);
  for (const m of matches) {
    if (!FIXTURE_PROCUREMENT_NOTICES.has(m)) return m;
  }
  return matches[0] || null;
}

export function extractNoticeIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // zakupki.gov.ru?regNumber=, kontur.ru/{id}, star-pro .../l{id}-, zakupki360 tender pages
  const fromQuery = url.match(/[?&]regNumber=(\d{18,19})/i);
  if (fromQuery) return fromQuery[1];
  const fromKontur = url.match(/zakupki\.kontur\.ru\/(\d{18,19})/i);
  if (fromKontur) return fromKontur[1];
  const fromStar = url.match(/\/l(\d{18,19})(?:-|\/|$)/i);
  if (fromStar) return fromStar[1];
  const fromPath = url.match(/\/(\d{18,19})(?:\/|$|\?)/);
  if (fromPath) return fromPath[1];
  return extractNoticeIdFromText(url);
}

export function normalizeNoticeId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 18 || digits.length > 19) return null;
  return digits;
}

export function sameNoticeId(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeNoticeId(a);
  const nb = normalizeNoticeId(b);
  return Boolean(na && nb && na === nb);
}

export function isFixtureProcurementNotice(id: string | null | undefined): boolean {
  const n = normalizeNoticeId(id);
  return Boolean(n && FIXTURE_PROCUREMENT_NOTICES.has(n));
}
