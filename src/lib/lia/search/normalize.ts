import type { ExternalSearchResult } from "@/types/lia";

type RawExternalHit = {
  id?: string;
  title?: string;
  description?: string;
  snippet?: string;
  url?: string;
  link?: string;
  source?: string;
  published_at?: string;
  date?: string;
  publishedDate?: string;
  trust_score?: number;
  confidence?: number;
  score?: number;
  query?: string;
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0.35;
  return Math.min(1, Math.max(0, value));
}

function stableId(url: string, title: string, source: string) {
  const input = `${url}|${title}|${source}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `ext_${(hash >>> 0).toString(16)}`;
}

function hostnameFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "external";
  }
}

/**
 * Нормализует сырой hit любого адаптера в контракт ExternalSearchResult.
 * trusted всегда false — внешние данные неподтверждены.
 */
export function normalizeExternalResult(
  raw: RawExternalHit,
  defaults?: { source?: string; query?: string; trustScore?: number },
): ExternalSearchResult | null {
  const title = String(raw.title ?? "").trim();
  const url = String(raw.url || raw.link || "").trim();
  if (!title || !url) return null;
  if (!/^https?:\/\//i.test(url)) return null;

  const source =
    String(raw.source || defaults?.source || hostnameFromUrl(url)).trim() ||
    "external";
  const description = String(
    raw.description || raw.snippet || "Описание недоступно",
  )
    .trim()
    .slice(0, 600);
  const published_at = String(
    raw.published_at || raw.date || raw.publishedDate || "",
  ).trim();
  const trust_score = clamp01(
    Number(
      raw.trust_score ??
        raw.confidence ??
        raw.score ??
        defaults?.trustScore ??
        0.4,
    ),
  );

  return {
    id: String(raw.id || stableId(url, title, source)),
    title: title.slice(0, 240),
    description,
    url,
    source,
    published_at,
    trust_score,
    trusted: false,
    query: raw.query || defaults?.query,
    // совместимость со Stage 11
    confidence: trust_score,
    date: published_at,
  };
}

export function normalizeExternalResults(
  rows: RawExternalHit[],
  defaults?: { source?: string; query?: string; trustScore?: number },
): ExternalSearchResult[] {
  const seen = new Set<string>();
  const out: ExternalSearchResult[] = [];

  for (const row of rows) {
    const item = normalizeExternalResult(row, defaults);
    if (!item) continue;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
  }

  return out;
}

/** Совместимость: подтянуть старые записи из lia_analyses. */
export function coerceExternalResult(value: unknown): ExternalSearchResult | null {
  if (!value || typeof value !== "object") return null;
  const row = value as RawExternalHit & { trusted?: boolean };
  return normalizeExternalResult(row);
}
