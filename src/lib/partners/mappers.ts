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
    pipelineStage: row.pipeline_stage,
    assigneeId: row.assignee_id ?? null,
    startedAt: row.started_at ?? null,
  };
}
