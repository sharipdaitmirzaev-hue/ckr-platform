/**
 * Internal-first then external fallback.
 * Reuses Discovery / LIA OI orchestration conceptually — no second search stack.
 * No Matching edges. Attach only if title overlap AND industry/region fit.
 */
import { CKR_OWN_IDEAS_BUDGETS } from "@/config/ckr-own-ideas";
import { signalFitsContext, titleOverlap } from "@/lib/ckr-own-ideas/fit";
import type {
  OwnIdeaElementKind,
  OwnIdeaSignal,
} from "@/types/ckr-own-ideas";

export type SearchHit = {
  signal: OwnIdeaSignal;
  origin: "INTERNAL_CKR" | "EXTERNAL";
};

export { titleOverlap };

export function searchInternalFirst(
  kind: OwnIdeaElementKind,
  query: string,
  catalog: OwnIdeaSignal[],
  limit = CKR_OWN_IDEAS_BUDGETS.maxCandidatesPerElement,
  context: OwnIdeaSignal[] = [],
): SearchHit[] {
  return catalog
    .filter((s) => s.origin === "INTERNAL_CKR")
    .filter((s) => s.kind === kind || kind === "OTHER")
    .filter((s) => titleOverlap(s.title, query))
    .filter((s) => signalFitsContext(s, context))
    .slice(0, limit)
    .map((signal) => ({ signal, origin: "INTERNAL_CKR" as const }));
}

export function searchExternalFallback(
  kind: OwnIdeaElementKind,
  query: string,
  catalog: OwnIdeaSignal[],
  limit = CKR_OWN_IDEAS_BUDGETS.maxCandidatesPerElement,
  context: OwnIdeaSignal[] = [],
): SearchHit[] {
  return catalog
    .filter((s) => s.origin === "EXTERNAL")
    .filter((s) => s.kind === kind)
    .filter((s) => titleOverlap(s.title, query))
    .filter((s) => signalFitsContext(s, context))
    .slice(0, limit)
    .map((signal) => ({ signal, origin: "EXTERNAL" as const }));
}

export function findMissingResource(input: {
  kind: OwnIdeaElementKind;
  query: string;
  internal: OwnIdeaSignal[];
  external: OwnIdeaSignal[];
  context?: OwnIdeaSignal[];
}): {
  hit: SearchHit | null;
  searchedInternal: boolean;
  searchedExternal: boolean;
} {
  const context = input.context ?? [];
  const internalHits = searchInternalFirst(
    input.kind,
    input.query,
    input.internal,
    CKR_OWN_IDEAS_BUDGETS.maxCandidatesPerElement,
    context,
  );
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
    CKR_OWN_IDEAS_BUDGETS.maxCandidatesPerElement,
    context,
  );
  return {
    hit: externalHits[0] ?? null,
    searchedInternal: true,
    searchedExternal: true,
  };
}
