import type { Organization } from "@/types";
import type {
  CompanyViewerRole,
  CompanyVisibilityTier,
} from "@/lib/company-intelligence/types";

export function resolveViewerRole(input: {
  isAdmin?: boolean;
  isMember?: boolean;
  canManage?: boolean;
}): CompanyViewerRole {
  if (input.isAdmin) return "admin";
  if (input.canManage) return "owner_manager";
  if (input.isMember) return "member";
  return "anon";
}

export function canSeeTier(
  viewer: CompanyViewerRole,
  tier: CompanyVisibilityTier,
): boolean {
  if (tier === "PUBLIC") return true;
  if (viewer === "anon") return false;
  if (tier === "CKR_ONLY") return true;
  return viewer === "owner_manager" || viewer === "admin";
}

/** Strip OWNER_ONLY / CKR_ONLY fields for public projection. */
export function toPublicOrganizationFields(org: Organization) {
  const emptyToNull = (v?: string) => {
    const t = (v || "").trim();
    return t ? t : null;
  };
  return {
    name: org.name,
    legalName: emptyToNull(org.legalName),
    inn: emptyToNull(org.inn),
    ogrn: emptyToNull(org.ogrn),
    legalForm: emptyToNull(org.legalForm),
    status: org.type,
    industry: emptyToNull(org.industry),
    subindustry: emptyToNull(org.subindustry),
    region: emptyToNull(org.region),
    city: emptyToNull(org.city),
    website: emptyToNull(org.website),
    publicEmail: emptyToNull(org.publicEmail),
    publicPhone: emptyToNull(org.publicPhone),
    description: emptyToNull(org.description),
    productsServices: emptyToNull(org.productsServices),
    offersSummary: emptyToNull(org.offersSummary),
    seeksSummary: emptyToNull(org.seeksSummary),
    sourceLabel: emptyToNull(org.sourceLabel),
    sourceUrl: emptyToNull(org.sourceUrl),
    verificationStatus: org.verificationStatus,
  };
}
