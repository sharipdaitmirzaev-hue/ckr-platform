import type { Opportunity, OpportunityType, PublishStatus } from "@/types";
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
