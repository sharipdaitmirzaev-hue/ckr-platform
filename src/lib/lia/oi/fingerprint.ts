/**
 * Stage 2B — устойчивая identity / fingerprint для rediscovery.
 */

import { oiHash } from "@/lib/lia/oi/id";
import { canonicalUrl } from "@/lib/lia/oi/normalize";
import type { LiaOiCandidate } from "@/types/lia-oi";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/^\[stub\]\s*/i, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function normalizePhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function priceBucket(price?: number | null): string {
  if (price == null || !(price > 0)) return "";
  // грубый bucket — мелкие колебания не меняют identity
  return String(Math.round(price / 100_000) * 100_000);
}

export function extractSourceObjectId(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname;
    const m =
      path.match(/\/(?:offer|item|lot|obekt|obyavlenie|product)[s]?\/([a-zA-Z0-9_-]+)/i) ||
      path.match(/\/(\d{4,})(?:\/|$)/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Fingerprint: canonical URL + source object id + title + phone + geo + price bucket.
 */
export function buildOpportunityFingerprint(
  input: Pick<
    LiaOiCandidate,
    | "title"
    | "contactPhone"
    | "region"
    | "city"
    | "askingPrice"
    | "investmentRequired"
    | "sources"
    | "canonicalKey"
  > & { canonicalUrl?: string | null },
): string {
  const url = input.canonicalUrl || input.sources[0]?.url || "";
  const canon = url ? canonicalUrl(url) : "";
  const objectId = url ? extractSourceObjectId(url) : null;
  const parts = [
    canon || input.canonicalKey || "",
    objectId || "",
    normalizeTitle(input.title),
    normalizePhone(input.contactPhone),
    (input.region || "").toLowerCase(),
    (input.city || "").toLowerCase(),
    priceBucket(input.askingPrice ?? input.investmentRequired),
  ];
  return oiHash(parts.join("|"));
}

/** Поля, изменения которых пишем в change log. */
export const TRACKED_CHANGE_FIELDS = [
  "askingPrice",
  "investmentRequired",
  "status",
  "description",
  "contactPhone",
  "contactEmail",
  "region",
  "city",
  "title",
  "budgetFit",
  "priceStatus",
  "resultBucket",
] as const;

export type TrackedChangeField = (typeof TRACKED_CHANGE_FIELDS)[number];

export type FieldChange = {
  field: TrackedChangeField;
  oldValue: string | null;
  newValue: string | null;
};

export function diffTrackedFields(
  prev: LiaOiCandidate,
  next: LiaOiCandidate,
): FieldChange[] {
  const out: FieldChange[] = [];
  for (const field of TRACKED_CHANGE_FIELDS) {
    const a = prev[field];
    const b = next[field];
    const as = a == null || a === "" ? null : String(a);
    const bs = b == null || b === "" ? null : String(b);
    if (as !== bs) {
      out.push({ field, oldValue: as, newValue: bs });
    }
  }
  return out;
}

/** Owner decisions that must survive rediscovery. */
export const OWNER_LOCKED_STATUSES = new Set([
  "SAVED",
  "INTERESTING",
  "DEEP_RESEARCH",
  "PROJECT_CREATED",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
]);

export function mergeRediscovery(
  existing: LiaOiCandidate,
  incoming: LiaOiCandidate,
): LiaOiCandidate {
  // Новое решение владельца (ownerLocked на incoming) всегда побеждает.
  // Авто-rediscovery не должен сбрасывать SAVED/REJECTED/и т.п.
  const incomingIsOwnerDecision = Boolean(incoming.ownerLocked);
  const preserveOwner =
    !incomingIsOwnerDecision && OWNER_LOCKED_STATUSES.has(existing.status);
  const status = preserveOwner ? existing.status : incoming.status;

  return {
    ...existing,
    ...incoming,
    id: existing.id,
    firstSeenAt: existing.firstSeenAt,
    lastSeenAt: incoming.lastSeenAt || new Date().toISOString(),
    status,
    ownerLocked:
      Boolean(existing.ownerLocked) ||
      Boolean(incoming.ownerLocked) ||
      OWNER_LOCKED_STATUSES.has(status),
    ownerStatusSetAt: incomingIsOwnerDecision
      ? (incoming.ownerStatusSetAt ?? existing.ownerStatusSetAt)
      : (existing.ownerStatusSetAt ?? incoming.ownerStatusSetAt),
    ownerStatusSetBy: incomingIsOwnerDecision
      ? (incoming.ownerStatusSetBy ?? existing.ownerStatusSetBy)
      : (existing.ownerStatusSetBy ?? incoming.ownerStatusSetBy),
    canonicalKey: existing.canonicalKey || incoming.canonicalKey,
    rawStubIds: Array.from(
      new Set([...(existing.rawStubIds || []), ...(incoming.rawStubIds || [])]),
    ),
    sources: mergeSources(existing.sources, incoming.sources),
    claims: incoming.claims?.length ? incoming.claims : existing.claims,
  };
}

function mergeSources(
  a: LiaOiCandidate["sources"],
  b: LiaOiCandidate["sources"],
): LiaOiCandidate["sources"] {
  const map = new Map<string, (typeof a)[0]>();
  for (const s of [...a, ...b]) {
    const key = canonicalUrl(s.url).toLowerCase();
    if (!map.has(key)) map.set(key, s);
  }
  return Array.from(map.values());
}
