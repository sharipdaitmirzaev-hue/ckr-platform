import { isNegativeEconomics } from "@/lib/ckr-own-ideas/economics";
import { isPlaceholderSource } from "@/lib/ckr-own-ideas/live-catalog";
import type {
  CkrOwnIdea,
  OwnIdeaComponent,
  OwnIdeaEconomics,
  OwnIdeaMissing,
  OwnIdeaRating,
} from "@/types/ckr-own-ideas";

function liveFactCount(components: OwnIdeaComponent[]): number {
  return components.filter(
    (c) =>
      c.found &&
      c.provenance.kind === "FACT" &&
      c.provenance.trustLevel !== "general_web" &&
      !isPlaceholderSource({
        url: c.provenance.sourceUrl || c.canonicalUrl,
        sourceType: c.provenance.sourceType,
        sourceLabel: c.provenance.sourceLabel,
        id: c.id,
      }),
  ).length;
}

function hasConfirmedCapital(components: OwnIdeaComponent[]): boolean {
  return components.some(
    (c) =>
      c.kind === "CAPITAL" &&
      c.found &&
      c.provenance.kind === "FACT" &&
      c.provenance.trustLevel !== "general_web" &&
      !isPlaceholderSource({
        url: c.provenance.sourceUrl,
        sourceType: c.provenance.sourceType,
        sourceLabel: c.provenance.sourceLabel,
      }),
  );
}

export function rateOwnIdea(input: {
  components: OwnIdeaComponent[];
  missing: OwnIdeaMissing[];
  economics: OwnIdeaEconomics;
}): OwnIdeaRating {
  const foundKinds = new Set(input.components.filter((c) => c.found).map((c) => c.kind));
  const hasAsset = foundKinds.has("ASSET") || foundKinds.has("LOCATION");
  const hasDemand = foundKinds.has("DEMAND") || foundKinds.has("MARKET");
  const liveFacts = liveFactCount(input.components);

  if (isNegativeEconomics(input.economics)) return "weak";
  if (!hasAsset || !hasDemand) return "missing_data";
  if (input.economics.unknownCount >= 6) return "missing_data";
  if (liveFacts < 2) return "needs_check";
  if (!hasConfirmedCapital(input.components) || input.missing.some((m) => m.kind === "CAPITAL")) {
    return "needs_check";
  }
  if (input.missing.length > 2) return "needs_check";
  if (input.economics.profit.kind === "UNKNOWN") return "needs_check";
  return "promising";
}

export function internalSortScore(idea: CkrOwnIdea): number {
  const ratingScore = {
    promising: 40,
    needs_check: 20,
    missing_data: 10,
    weak: 0,
  }[idea.rating];
  const facts = idea.components.filter((c) => c.provenance.kind === "FACT").length;
  return ratingScore + facts * 3 - idea.missing.length * 2 - idea.economics.unknownCount;
}
