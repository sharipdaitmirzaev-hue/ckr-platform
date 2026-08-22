/**
 * Stage 4O — dedup across internal + external candidates.
 * Identity hierarchy by entity type; no aggressive title-only merge.
 */

import type { DiscoveryCandidate } from "@/lib/opportunity-discovery/types";

function normUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.hash = "";
    // Strip common tracking query keys but keep notice ids in query when present
    const drop = new Set(["utm_source", "utm_medium", "utm_campaign", "yclid"]);
    [...u.searchParams.keys()].forEach((k) => {
      if (drop.has(k)) u.searchParams.delete(k);
    });
    return `${u.origin}${u.pathname}${u.search}`.toLowerCase().replace(/\/$/, "");
  } catch {
    return url.trim().toLowerCase();
  }
}

function extractNoticeId(text: string): string | null {
  const m = text.match(/\b0\d{18}\b/);
  return m ? m[0] : null;
}

export function identityKeys(c: DiscoveryCandidate): string[] {
  const keys: string[] = [];
  keys.push(`${c.entityType}:${c.sourceEntityId}`);

  if (c.entityType === "organization") {
    // INN/OGRN/domain would be on extended meta; use org name softly only as secondary
    if (c.organization) keys.push(`org_name:${c.organization.toLowerCase()}`);
    const domain = c.url ? normUrl(c.url) : null;
    if (domain) keys.push(`domain:${domain}`);
  }

  if (
    c.sourceCategory === "PROCUREMENT" ||
    /закуп|procurement|тендер/i.test(c.title)
  ) {
    const notice =
      extractNoticeId(c.title) ||
      extractNoticeId(c.summary) ||
      extractNoticeId(c.url || "") ||
      extractNoticeId(c.sourceEntityId);
    if (notice) keys.push(`notice:${notice}`);
  }

  if (c.entityType === "project") {
    keys.push(`project:${c.sourceEntityId}`);
    const u = normUrl(c.url);
    if (u) keys.push(`project_url:${u}`);
  }

  if (
    c.sourceCategory === "PROPERTY" ||
    c.sourceCategory === "LAND" ||
    c.sourceCategory === "BUSINESS_FOR_SALE"
  ) {
    const u = normUrl(c.url);
    if (u) keys.push(`listing_url:${u}`);
  }

  // Published LIA opportunity may share source fingerprint with OI
  if (c.entityType === "opportunity" || c.entityType === "lia_oi") {
    const u = normUrl(c.url);
    if (u) keys.push(`canon_url:${u}`);
  }

  return keys;
}

/**
 * Prefer internal over external, then higher suitability/quality.
 * Drops later duplicates that share any identity key.
 */
export function dedupeCandidates(
  candidates: DiscoveryCandidate[],
): { kept: DiscoveryCandidate[]; duplicates: number } {
  const order = [...candidates].sort((a, b) => {
    if (a.pass === "INTERNAL" && b.pass !== "INTERNAL") return -1;
    if (b.pass === "INTERNAL" && a.pass !== "INTERNAL") return 1;
    const suitRank = (s: DiscoveryCandidate["suitability"]) =>
      ({ SUITABLE: 0, POSSIBLE: 1, NEEDS_CHECK: 2, WEAK: 3, NOT_SUITABLE: 4 })[
        s
      ] ?? 5;
    const d = suitRank(a.suitability) - suitRank(b.suitability);
    if (d !== 0) return d;
    return b.quality - a.quality;
  });

  const seen = new Set<string>();
  const kept: DiscoveryCandidate[] = [];
  let duplicates = 0;

  for (const c of order) {
    const keys = identityKeys(c);
    if (keys.some((k) => seen.has(k))) {
      duplicates += 1;
      continue;
    }
    for (const k of keys) seen.add(k);
    kept.push(c);
  }

  return { kept, duplicates };
}

/** Title-only similarity is intentionally NOT used for hard merge. */
export function titlesLookSimilar(a: string, b: string): boolean {
  const na = a.toLowerCase().replace(/\s+/g, " ").trim();
  const nb = b.toLowerCase().replace(/\s+/g, " ").trim();
  if (!na || !nb) return false;
  return na === nb;
}
