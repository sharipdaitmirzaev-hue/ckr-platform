import type {
  Opportunity,
  OpportunityType,
  PublishStatus,
  VerificationStatus,
} from "@/types";
import type { OpportunityRow } from "@/types/database";

export function mapOpportunityRow(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    type: row.type as OpportunityType,
    region: row.region,
    city: row.city,
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    currency: row.currency,
    status: row.status as PublishStatus,
    verificationStatus:
      (row.verification_status as VerificationStatus | undefined) ??
      "unverified",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceType: row.source_type,
    sourceId: row.source_id ?? null,
    sourceUrl: row.source_url ?? null,
    canonicalUrl: row.canonical_url ?? null,
    sourceLabel: row.source_label ?? null,
    fingerprint: row.fingerprint ?? null,
    amountKind: row.amount_kind ?? null,
    deadlineAt: row.deadline_at ?? null,
    ownerEditedFields: row.owner_edited_fields ?? [],
  };
}
