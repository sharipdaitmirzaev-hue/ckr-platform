/**
 * Stage 4O — internal catalog search (PASS 1), pure / client-safe.
 */

import { rowToBaseCandidate, isNoiseRealness } from "@/lib/opportunity-discovery/candidate";
import { scoreInternalRow } from "@/lib/opportunity-discovery/scoring";
import type {
  DiscoveryCandidate,
  InternalCatalogRow,
  OpportunitySearchContext,
} from "@/lib/opportunity-discovery/types";

export type InternalSearchOptions = {
  catalog?: InternalCatalogRow[];
  limit?: number;
  includeNoise?: boolean;
};

export function searchInternalCatalog(
  ctx: OpportunitySearchContext,
  opts?: InternalSearchOptions,
): DiscoveryCandidate[] {
  const catalog = opts?.catalog ?? [];
  const limit = opts?.limit ?? 40;
  const includeNoise = opts?.includeNoise === true;

  const scored = catalog
    .map((row) => {
      const score = scoreInternalRow(row, ctx);
      const candidate = rowToBaseCandidate(row, {
        suitability: score.suitability,
        whyRelevant: score.why,
        confidence: score.confidence,
        quality: score.quality,
        pass: "INTERNAL",
      });
      return { score, candidate };
    })
    .filter((x) => {
      if (!includeNoise && isNoiseRealness(x.candidate.realness)) return false;
      return x.score.suitability !== "NOT_SUITABLE" || x.score.raw > 0;
    })
    .filter((x) => x.score.raw > 0 || !contextHasTokens(ctx))
    .sort(
      (a, b) =>
        b.score.raw - a.score.raw || b.candidate.quality - a.candidate.quality,
    )
    .slice(0, limit)
    .map((x) => x.candidate);

  return scored;
}

function contextHasTokens(ctx: OpportunitySearchContext): boolean {
  return Boolean(
    ctx.freeText ||
      ctx.intent ||
      ctx.region ||
      ctx.industry ||
      ctx.keywords.length ||
      ctx.productsServices.length,
  );
}
