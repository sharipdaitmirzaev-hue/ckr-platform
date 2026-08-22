/**
 * Stage 4E — Dagestan / SKFO ecosystem coverage card.
 */

import type { LiaOiCandidate } from "@/types/lia-oi";
import { normalizeRegionLabel, isNorthCaucasus } from "@/lib/geo/region-normalize";
import { computePublishability } from "@/lib/lia/oi/publishability";
import { computeDataQualityV2 } from "@/lib/lia/oi/quality-v2";
import { classifyDemandSignal } from "@/lib/lia/oi/regional/demand-classify";
import { evaluateContentGaps, DEFAULT_GAP_SCENARIOS } from "@/lib/lia/oi/content-gap";

export type MarketplaceCoverageSlice = {
  projects: number;
  opportunities: number;
  investmentOffers: number;
  expertProfiles: number;
  publicNeeds: number;
  /** Stage 4F */
  companies?: number;
  suppliers?: number;
  buyers?: number;
  properties?: number;
  byType: Record<string, number>;
};

export type RegionalCoverageCard = {
  region: string;
  oiTotal: number;
  detail: number;
  ready: number;
  good: number;
  acceptable: number;
  weak: number;
  contracts: number;
  support: number;
  investmentLike: number;
  confirmedDemand: number;
  potentialBuyers: number;
  marketplace?: MarketplaceCoverageSlice;
  gaps: ReturnType<typeof evaluateContentGaps>;
};

function inRegion(c: LiaOiCandidate, region: string): boolean {
  if (region === "СКФО") return isNorthCaucasus(c.region) || normalizeRegionLabel(c.region) === "СКФО";
  const want = normalizeRegionLabel(region);
  const got = normalizeRegionLabel(c.region);
  if (want && got) return want === got || (want === "Дагестан" && got === "Дагестан");
  return Boolean(c.region && c.region.toLowerCase().includes(region.toLowerCase()));
}

export function buildRegionalCoverageCard(input: {
  region: string;
  candidates: LiaOiCandidate[];
  marketplace?: MarketplaceCoverageSlice;
}): RegionalCoverageCard {
  const scoped = input.candidates.filter((c) => inRegion(c, input.region));
  let detail = 0;
  let ready = 0;
  let good = 0;
  let acceptable = 0;
  let weak = 0;
  let contracts = 0;
  let support = 0;
  let investmentLike = 0;
  let confirmedDemand = 0;
  let potentialBuyers = 0;

  for (const c of scoped) {
    if (c.pageType === "DETAIL" && !c.isCatalogSource) detail += 1;
    if (c.opportunityType === "PROCUREMENT") contracts += 1;
    if (c.opportunityType === "SUPPORT_PROGRAM") support += 1;
    if (
      c.opportunityType === "AUCTION_ASSET" ||
      c.opportunityType === "REGIONAL_INVESTMENT" ||
      c.opportunityType === "WEB_LISTING"
    ) {
      investmentLike += 1;
    }
    const q = computeDataQualityV2({ candidate: c });
    const pub = computePublishability({
      ...c,
      dataQualityScore: q.dataQualityScore,
    });
    if (pub.tier === "READY_TO_REVIEW") {
      ready += 1;
      if (c.pageType === "DETAIL") good += 1;
    } else if (pub.tier === "NEEDS_ENRICHMENT") acceptable += 1;
    else weak += 1;

    const dem = classifyDemandSignal({
      title: c.title,
      description: c.description,
      url: c.canonicalUrl,
      pageType: c.pageType,
      opportunityType: c.opportunityType,
    });
    if (dem.classification === "CONFIRMED_DEMAND") confirmedDemand += 1;
    if (dem.classification === "POTENTIAL_BUYER") potentialBuyers += 1;
  }

  const gaps = evaluateContentGaps(
    input.candidates,
    DEFAULT_GAP_SCENARIOS.filter((s) =>
      s.regions.some(
        (r) =>
          normalizeRegionLabel(r) === normalizeRegionLabel(input.region) ||
          (input.region === "Дагестан" && /дагестан|скфо/i.test(r)),
      ),
    ),
  );

  return {
    region: input.region,
    oiTotal: scoped.length,
    detail,
    ready,
    good,
    acceptable,
    weak,
    contracts,
    support,
    investmentLike,
    confirmedDemand,
    potentialBuyers,
    marketplace: input.marketplace,
    gaps,
  };
}

/** Convenience: Dagestan ecosystem card. */
export function dagestanCoverageFromCandidates(
  candidates: LiaOiCandidate[],
  marketplace?: MarketplaceCoverageSlice,
): RegionalCoverageCard {
  return buildRegionalCoverageCard({
    region: "Дагестан",
    candidates,
    marketplace,
  });
}
