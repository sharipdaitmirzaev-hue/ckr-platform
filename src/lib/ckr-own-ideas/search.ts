/**
 * Internal-first then external fallback.
 * Reuses Discovery / LIA OI orchestration conceptually — no second search stack.
 * No Matching edges.
 */
import { CKR_OWN_IDEAS_BUDGETS } from "@/config/ckr-own-ideas";
import type {
  OwnIdeaElementKind,
  OwnIdeaSignal,
} from "@/types/ckr-own-ideas";

export type SearchHit = {
  signal: OwnIdeaSignal;
  origin: "INTERNAL_CKR" | "EXTERNAL";
};

function titleOverlap(a: string, b: string): boolean {
  const tokens = (s: string) =>
    s
      .toLowerCase()
      .replace(/ё/g, "е")
      .split(/[^a-z0-9а-я]+/i)
      .filter((t) => t.length > 3);
  const A = new Set(tokens(a));
  const B = tokens(b);
  return B.some((t) => A.has(t));
}

export function searchInternalFirst(
  kind: OwnIdeaElementKind,
  query: string,
  catalog: OwnIdeaSignal[],
  limit = CKR_OWN_IDEAS_BUDGETS.maxCandidatesPerElement,
): SearchHit[] {
  return catalog
    .filter((s) => s.origin === "INTERNAL_CKR")
    .filter((s) => s.kind === kind || kind === "OTHER")
    .filter((s) => titleOverlap(s.title, query) || s.kind === kind)
    .slice(0, limit)
    .map((signal) => ({ signal, origin: "INTERNAL_CKR" as const }));
}

export function searchExternalFallback(
  kind: OwnIdeaElementKind,
  query: string,
  catalog: OwnIdeaSignal[],
  limit = CKR_OWN_IDEAS_BUDGETS.maxCandidatesPerElement,
): SearchHit[] {
  return catalog
    .filter((s) => s.origin === "EXTERNAL")
    .filter((s) => s.kind === kind)
    .filter((s) => titleOverlap(s.title, query) || s.kind === kind)
    .slice(0, limit)
    .map((signal) => ({ signal, origin: "EXTERNAL" as const }));
}

export function findMissingResource(input: {
  kind: OwnIdeaElementKind;
  query: string;
  internal: OwnIdeaSignal[];
  external: OwnIdeaSignal[];
}): {
  hit: SearchHit | null;
  searchedInternal: boolean;
  searchedExternal: boolean;
} {
  const internalHits = searchInternalFirst(input.kind, input.query, input.internal);
  if (internalHits.length > 0) {
    return {
      hit: internalHits[0],
      searchedInternal: true,
      searchedExternal: false,
    };
  }
  const externalHits = searchExternalFallback(
    input.kind,
    input.query,
    input.external,
  );
  return {
    hit: externalHits[0] ?? null,
    searchedInternal: true,
    searchedExternal: true,
  };
}
