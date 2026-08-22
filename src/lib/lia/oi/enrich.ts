/**
 * Backward-compatible enrich entrypoint.
 * Stage 2C.1: delegates to structured enrichment (safe-fetch + extractors).
 */

import {
  enrichStructuredCandidates,
  type StructuredEnrichStats,
} from "@/lib/lia/oi/enrichment/enrich-candidate";
import type { LiaOiCandidate, LiaOiSearchPlan } from "@/types/lia-oi";

export type EnrichRunStats = StructuredEnrichStats;

/**
 * Enrich DETAIL candidates via controlled safe-fetch + source-specific extractors.
 */
export async function enrichTopDetailCandidates(
  candidates: LiaOiCandidate[],
  plan?: LiaOiSearchPlan,
): Promise<{ candidates: LiaOiCandidate[]; stats: EnrichRunStats }> {
  return enrichStructuredCandidates(candidates, plan);
}
