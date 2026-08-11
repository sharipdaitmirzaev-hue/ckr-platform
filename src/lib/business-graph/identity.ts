/**
 * Identity resolver — avoid duplicate BusinessNodes.
 * Strong keys first; weak name+region never auto-merges alone.
 */

import {
  bgHash,
  normalizeEmail,
  normalizePhone,
} from "@/lib/business-graph/id";
import type { BusinessNode, CreateNodeInput } from "@/types/business-graph";

export type IdentityMatch = {
  node: BusinessNode;
  reason: string;
  confidence: number;
};

const MERGE_THRESHOLD = 85;

/** True when input has a key strong enough for auto-merge / unique fingerprint. */
export function hasStrongIdentity(input: CreateNodeInput): boolean {
  if (input.fingerprint) return true;
  if (input.sourceType && input.sourceId) return true;
  if (input.internalEntityType && input.internalEntityId) return true;
  const sd = input.structuredData || {};
  if (
    sd.inn ||
    sd.ogrn ||
    sd.ogrnip ||
    sd.procurement_id ||
    sd.lot_id
  ) {
    return true;
  }
  if (input.sourceUrl) return true;
  if (normalizePhone((sd.phone as string) || null)) return true;
  if (normalizeEmail((sd.email as string) || null)) return true;
  return false;
}

/**
 * Strong identity fingerprint only.
 * Weak title+region MUST return null so unique index / merge never collide.
 */
export function buildGraphFingerprint(input: CreateNodeInput): string | null {
  if (input.fingerprint) return input.fingerprint;
  if (input.sourceType && input.sourceId) {
    return bgHash(`src|${input.sourceType}|${input.sourceId}`);
  }
  if (input.internalEntityType && input.internalEntityId) {
    return bgHash(`int|${input.internalEntityType}|${input.internalEntityId}`);
  }
  const sd = input.structuredData || {};
  const official =
    (sd.inn as string) ||
    (sd.ogrn as string) ||
    (sd.ogrnip as string) ||
    (sd.procurement_id as string) ||
    (sd.lot_id as string) ||
    "";
  if (official) {
    return bgHash(`official|${input.nodeType}|${official}`);
  }
  if (input.sourceUrl) {
    return bgHash(`url|${input.sourceUrl.toLowerCase()}`);
  }
  const phone = normalizePhone((sd.phone as string) || null);
  const email = normalizeEmail((sd.email as string) || null);
  if (phone || email) {
    return bgHash(`contact|${phone || ""}|${email || ""}`);
  }
  // Weak — no fingerprint (do not auto-merge, do not unique-collide)
  return null;
}

export function resolveIdentity(
  existing: BusinessNode[],
  input: CreateNodeInput,
): IdentityMatch | null {
  if (input.sourceType && input.sourceId) {
    const hit = existing.find(
      (n) =>
        n.sourceType === input.sourceType &&
        n.sourceId === input.sourceId &&
        n.status !== "MERGED",
    );
    if (hit) {
      return { node: hit, reason: "source_type+source_id", confidence: 100 };
    }
  }

  if (input.internalEntityType && input.internalEntityId) {
    const hit = existing.find(
      (n) =>
        n.internalEntityType === input.internalEntityType &&
        n.internalEntityId === input.internalEntityId &&
        n.status !== "MERGED",
    );
    if (hit) {
      return {
        node: hit,
        reason: "internal_entity",
        confidence: 100,
      };
    }
  }

  const fp = buildGraphFingerprint(input);
  if (fp && hasStrongIdentity(input)) {
    const byFp = existing.find(
      (n) => n.fingerprint && n.fingerprint === fp && n.status !== "MERGED",
    );
    if (byFp) {
      return { node: byFp, reason: "fingerprint", confidence: 100 };
    }
  }

  const sd = input.structuredData || {};
  for (const key of [
    "inn",
    "ogrn",
    "ogrnip",
    "procurement_id",
    "lot_id",
  ] as const) {
    const val = sd[key];
    if (!val) continue;
    const hit = existing.find(
      (n) =>
        n.status !== "MERGED" &&
        n.nodeType === input.nodeType &&
        String(n.structuredData?.[key] || "") === String(val),
    );
    if (hit) {
      return { node: hit, reason: `official:${key}`, confidence: 95 };
    }
  }

  const phone = normalizePhone((sd.phone as string) || null);
  const email = normalizeEmail((sd.email as string) || null);
  if (phone || email) {
    const hit = existing.find((n) => {
      if (n.status === "MERGED") return false;
      const np = normalizePhone(String(n.structuredData?.phone || ""));
      const ne = normalizeEmail(String(n.structuredData?.email || ""));
      return (phone && np === phone) || (email && ne === email);
    });
    if (hit) {
      return { node: hit, reason: "phone_or_email", confidence: 88 };
    }
  }

  // Weak name+region — never auto-merge at Stage 3A
  void MERGE_THRESHOLD;
  return null;
}

export function shouldMerge(match: IdentityMatch | null): boolean {
  return Boolean(match && match.confidence >= MERGE_THRESHOLD);
}
