/**
 * Bridges: LIA OI candidates and internal CKR entities → CreateNodeInput.
 * Does not write to DB; used by BusinessGraphService.
 */

import { bgHash } from "@/lib/business-graph/id";
import type { CreateNodeInput, BusinessNodeType } from "@/types/business-graph";
import type { LiaOiCandidate } from "@/types/lia-oi";

export function mapOiOpportunityTypeToNodeType(
  opportunityType?: string | null,
): BusinessNodeType {
  switch (opportunityType) {
    case "PROCUREMENT":
      return "DEMAND";
    case "AUCTION_ASSET":
    case "GOVERNMENT_ASSET":
      return "ASSET";
    case "SUPPORT_PROGRAM":
      return "SUPPORT";
    case "REGIONAL_INVESTMENT":
      return "PROJECT";
    default:
      return "MARKET_SIGNAL";
  }
}

/** LIA OI → graph node input (source bridge). */
export function oiCandidateToNodeInput(c: LiaOiCandidate): CreateNodeInput {
  return {
    nodeType: mapOiOpportunityTypeToNodeType(c.opportunityType),
    title: c.title,
    description: c.description || c.summary || "",
    sourceType: "lia_oi_opportunity",
    sourceId: c.id,
    sourceUrl: c.canonicalUrl || c.sources[0]?.url || null,
    country: c.country || "RU",
    region: c.region || null,
    city: c.city || null,
    visibility: "OWNER_ONLY",
    status: "ACTIVE",
    fingerprint:
      c.fingerprint ||
      bgHash(
        `oi|${c.sourceObjectId || ""}|${c.canonicalUrl || c.canonicalKey || c.id}`,
      ),
    dataConfidence: c.sourceConfidence ?? c.score.confidence ?? 40,
    dataQualityScore: c.dataQualityScore ?? c.score.quality ?? 0,
    // Keep opportunity score separate from data confidence
    opportunityAttractiveness: c.score.opportunity ?? c.score.overall ?? null,
    structuredData: {
      opportunityType: c.opportunityType,
      sourceObjectId: c.sourceObjectId,
      procurement_id:
        c.opportunityType === "PROCUREMENT" ? c.sourceObjectId : undefined,
      lot_id: c.opportunityType === "AUCTION_ASSET" ? c.sourceObjectId : undefined,
      nmck: c.nmck,
      askingPrice: c.askingPrice,
      matchingReadiness: c.matchingReadiness,
      phone: c.contactPhone,
      email: c.contactEmail,
      dataChannel: c.dataChannel,
    },
  };
}

export function projectToNodeInput(project: {
  id: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  region?: string | null;
  city?: string | null;
  status?: string | null;
}): CreateNodeInput {
  return {
    nodeType: "PROJECT",
    title: project.title,
    description: project.summary || project.description || "",
    internalEntityType: "projects",
    internalEntityId: project.id,
    region: project.region || null,
    city: project.city || null,
    visibility: "INTERNAL",
    fingerprint: bgHash(`int|projects|${project.id}`),
    dataConfidence: 90,
    dataQualityScore: 70,
    structuredData: { status: project.status },
  };
}

/** Organization (CKR) → COMPANY graph node. No MATCHES. */
export function organizationToNodeInput(org: {
  id: string;
  name: string;
  description?: string | null;
  region?: string | null;
  city?: string | null;
  website?: string | null;
  inn?: string | null;
  ogrn?: string | null;
  industry?: string | null;
  verificationStatus?: string | null;
}): CreateNodeInput {
  const inn = (org.inn || "").replace(/\D/g, "");
  const ogrn = (org.ogrn || "").replace(/\D/g, "");
  return {
    nodeType: "COMPANY",
    title: org.name,
    description: org.description || "",
    internalEntityType: "organizations",
    internalEntityId: org.id,
    sourceType: "ckr_organization",
    sourceId: org.id,
    sourceUrl: org.website || null,
    region: org.region || null,
    city: org.city || null,
    visibility: "INTERNAL",
    status: "ACTIVE",
    fingerprint: bgHash(
      inn
        ? `org|inn|${inn}`
        : ogrn
          ? `org|ogrn|${ogrn}`
          : `int|organizations|${org.id}`,
    ),
    dataConfidence: inn || ogrn ? 92 : 75,
    dataQualityScore: inn || ogrn ? 80 : 55,
    structuredData: {
      inn: inn || undefined,
      ogrn: ogrn || undefined,
      industry: org.industry || undefined,
      verificationStatus: org.verificationStatus || undefined,
      website: org.website || undefined,
    },
  };
}

export function investmentOfferToNodeInput(offer: {
  id: string;
  title: string;
  description?: string | null;
  budgetMax?: number | null;
  regions?: string[] | null;
}): CreateNodeInput {
  return {
    nodeType: "CAPITAL",
    title: offer.title,
    description: offer.description || "",
    internalEntityType: "investment_offers",
    internalEntityId: offer.id,
    region: offer.regions?.[0] || null,
    visibility: "INTERNAL",
    fingerprint: bgHash(`int|investment_offers|${offer.id}`),
    dataConfidence: 88,
    dataQualityScore: 65,
    structuredData: { budgetMax: offer.budgetMax ?? null },
  };
}
