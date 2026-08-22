/**
 * Map OfficialProviderObject → LiaOiCandidate for specialized adapters.
 */

import { computeDataQualityV2 } from "@/lib/lia/oi/quality-v2";
import { buildSpecializedCandidate } from "@/lib/lia/oi/sources/candidate-factory";
import type {
  LiaOiOpportunityType,
  LiaOiSourceAdapterId,
} from "@/lib/lia/oi/sources/types";
import type { OfficialProviderObject } from "@/lib/lia/oi/sources/providers/types";
import type { LiaOiCandidate, LiaOiSourceCategory, LiaOiSourceClass } from "@/types/lia-oi";

export function officialObjectToCandidate(
  obj: OfficialProviderObject,
  meta: {
    adapterId: LiaOiSourceAdapterId;
    opportunityType: LiaOiOpportunityType;
    sourceClass: LiaOiSourceClass;
    category: LiaOiSourceCategory;
  },
): LiaOiCandidate {
  const isFixture = obj.dataChannel === "FIXTURE_DEMO";
  const sourceName =
    obj.providerId === "eis"
      ? isFixture
        ? "ЕИС (fixture / demo)"
        : "Официальный API ЕИС"
      : isFixture
        ? "ЕФРСБ (fixture / demo)"
        : "Официальный API ЕФРСБ";

  const asking =
    obj.nmck ??
    obj.currentPrice ??
    obj.startingPrice ??
    null;

  let base = buildSpecializedCandidate({
    adapterId: meta.adapterId,
    opportunityType: meta.opportunityType,
    sourceClass: meta.sourceClass,
    category: meta.category,
    sourceName,
    official: true,
    sourceConfidence: obj.sourceConfidence,
    title: obj.title,
    description: obj.description,
    url: obj.officialUrl,
    region: obj.region,
    askingPrice: asking,
    objectId: obj.rawOfficialId,
    deadlineRaw: obj.deadlineAt,
    isStub: isFixture,
    extraClaims: obj.claims,
    whyInteresting: [
      sourceName,
      obj.providerId === "eis"
        ? `НМЦК: ${obj.nmck ?? "—"}`
        : `Цена: ${obj.currentPrice ?? obj.startingPrice ?? "—"}`,
    ],
  });

  // Keep opportunity score independent of source channel confidence
  base = {
    ...base,
    dataChannel: obj.dataChannel,
    officialApiProvider: obj.providerId,
    officialApiStatus: isFixture ? "NOT_CONFIGURED" : "CONNECTED",
    customer: obj.customer ?? base.customer ?? null,
    organizer: obj.organizer ?? base.organizer ?? null,
    nmck: obj.nmck ?? null,
    startingPrice: obj.startingPrice ?? null,
    currentPrice: obj.currentPrice ?? null,
    procurementStage:
      meta.opportunityType === "PROCUREMENT" ? obj.status : base.procurementStage,
    auctionStatus:
      meta.opportunityType === "AUCTION_ASSET" ? obj.status : base.auctionStatus,
    priceKind:
      obj.nmck != null
        ? "NMCK"
        : obj.currentPrice != null
          ? "CURRENT_AUCTION_PRICE"
          : obj.startingPrice != null
            ? "STARTING_AUCTION_PRICE"
            : base.priceKind,
    structuredFields: obj.structuredFields,
    claims: [...base.claims, ...obj.claims],
    score: {
      ...base.score,
      // source confidence high; opportunity score NOT auto-boosted
      confidence: obj.sourceConfidence,
      opportunity: Math.min(base.score.opportunity, 60),
      explanation: [
        ...base.score.explanation,
        "Высокий source_confidence официального API ≠ высокий opportunity_score.",
      ],
      breakdown: {
        ...base.score.breakdown,
        sourceConfidence: obj.sourceConfidence,
      },
    },
  };

  const q = computeDataQualityV2({
    candidate: base,
    structuredFields: base.structuredFields || [],
  });
  return {
    ...base,
    dataQualityScore: q.dataQualityScore,
    matchingReadiness: q.matchingReadiness,
    confirmedFields: q.confirmedFields,
    unknownFields: q.unknownFields,
    publishabilityScore: q.publishabilityScore,
    publishabilityTier: q.publishabilityTier as LiaOiCandidate["publishabilityTier"],
    score: {
      ...base.score,
      quality: Math.max(base.score.quality, q.dataQualityScore),
      breakdown: {
        ...base.score.breakdown,
        dataCompleteness: q.dataQualityScore,
      },
    },
  };
}
