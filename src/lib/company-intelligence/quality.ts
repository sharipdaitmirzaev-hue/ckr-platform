import type { Organization } from "@/types";
import type { CompanyQualityFlags } from "@/lib/company-intelligence/types";

/**
 * Owner-only quality snapshot — not a credit score.
 */
export function computeCompanyQuality(input: {
  organization: Organization;
  activeNeedsCount: number;
  publicOffersCount: number;
  graphLinksCount: number;
}): CompanyQualityFlags {
  const o = input.organization;
  const legalIdentityKnown = Boolean(
    (o.inn && /^\d{10}(\d{2})?$/.test(o.inn)) ||
      (o.ogrn && /^\d{13}(\d{2})?$/.test(o.ogrn)) ||
      (o.legalName && o.legalName.trim().length >= 3),
  );
  const regionKnown = Boolean(o.region && o.region.trim().length >= 2);
  const industryKnown = Boolean(o.industry && o.industry.trim().length >= 2);
  const websiteKnown = Boolean(o.website && /^https?:\/\//i.test(o.website));
  const verifiedSource = Boolean(
    o.verificationStatus === "verified" ||
      (o.sourceUrl && o.sourceUrl.trim().length > 0),
  );
  const hasActiveNeeds = input.activeNeedsCount > 0;
  const hasPublicOffers =
    input.publicOffersCount > 0 ||
    Boolean(o.offersSummary && o.offersSummary.trim());
  const hasGraphLinks = input.graphLinksCount > 0;

  const flags = {
    legalIdentityKnown,
    regionKnown,
    industryKnown,
    websiteKnown,
    verifiedSource,
    hasActiveNeeds,
    hasPublicOffers,
    hasGraphLinks,
  };
  const score = Object.values(flags).filter(Boolean).length * 12.5;
  const labelsRu: string[] = [];
  if (legalIdentityKnown) labelsRu.push("юридическая идентичность");
  if (regionKnown) labelsRu.push("регион");
  if (industryKnown) labelsRu.push("отрасль");
  if (websiteKnown) labelsRu.push("сайт");
  if (verifiedSource) labelsRu.push("источник/верификация");
  if (hasActiveNeeds) labelsRu.push("активные потребности");
  if (hasPublicOffers) labelsRu.push("публичные предложения");
  if (hasGraphLinks) labelsRu.push("связи Graph");

  return { ...flags, score: Math.round(score), labelsRu };
}
