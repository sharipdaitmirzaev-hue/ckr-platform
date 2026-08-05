import type { Project, ProjectStage, PublishStatus } from "@/types";
import type { ProjectRow } from "@/types/database";

export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    category: row.category,
    region: row.region,
    investmentRequired: Number(row.investment_required),
    currency: row.currency,
    stage: row.stage as ProjectStage,
    status: row.status as PublishStatus,
    coverUrl: row.cover_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
