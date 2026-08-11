import type {
  Organization,
  OrganizationMember,
  Partnership,
} from "@/types";
import type {
  OrganizationMemberRow,
  OrganizationRow,
  PartnershipRow,
} from "@/types/database";

export function mapOrganizationRow(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    website: row.website,
    region: row.region,
    city: row.city,
    verificationStatus: row.verification_status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    legalName: row.legal_name || "",
    inn: row.inn || "",
    ogrn: row.ogrn || "",
    legalForm: row.legal_form || "",
    industry: row.industry || "",
    subindustry: row.subindustry || "",
    publicEmail: row.public_email || "",
    publicPhone: row.public_phone || "",
    productsServices: row.products_services || "",
    offersSummary: row.offers_summary || "",
    seeksSummary: row.seeks_summary || "",
    sourceUrl: row.source_url || "",
    sourceLabel: row.source_label || "",
    ownerNotes: row.owner_notes || "",
    liaEnrichmentDraft: row.lia_enrichment_draft ?? null,
    isListed: row.is_listed !== false,
  };
}

export function mapOrganizationMemberRow(
  row: OrganizationMemberRow,
  extras?: { fullName?: string; email?: string },
): OrganizationMember {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    fullName: extras?.fullName,
    email: extras?.email,
  };
}

export function mapPartnershipRow(row: PartnershipRow): Partnership {
  return {
    id: row.id,
    organizationId: row.organization_id,
    type: row.type,
    status: row.status,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
