/**
 * Minimal XML helpers for EIS SOAP/XML fixtures (no external DOM deps).
 */

export function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** First text content of local-name tag (namespace-agnostic). */
export function xmlTagText(xml: string, localName: string): string | null {
  const re = new RegExp(
    `<(?:[A-Za-z0-9_]+:)?${localName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_]+:)?${localName}>`,
    "i",
  );
  const m = xml.match(re);
  if (!m) return null;
  const inner = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
  if (!inner || /^<[^>]+\/?>$/.test(inner)) return null;
  // strip nested tags for simple text nodes
  const text = decodeXmlEntities(inner.replace(/<[^>]+>/g, "").trim());
  return text || null;
}

export function xmlAllBlocks(xml: string, localName: string): string[] {
  const re = new RegExp(
    `<(?:[A-Za-z0-9_]+:)?${localName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_]+:)?${localName}>`,
    "gi",
  );
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    out.push(m[0]);
  }
  return out;
}

export function parseXmlMoney(raw: string | null): number | null {
  if (!raw) return null;
  const digits = raw.replace(/\s|\u00a0/g, "").replace(",", ".");
  const n = Number(digits.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseXmlDate(raw: string | null): string | null {
  if (!raw) return null;
  const t = Date.parse(raw);
  if (!Number.isNaN(t)) return new Date(t).toISOString();
  const m = raw.match(/(\d{2})\.(\d{2})\.(\d{4})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}T${m[4] || "00"}:${m[5] || "00"}:00+03:00`;
  const t2 = Date.parse(iso);
  return Number.isNaN(t2) ? null : new Date(t2).toISOString();
}
