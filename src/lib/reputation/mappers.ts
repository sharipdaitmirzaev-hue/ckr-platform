import type {
  EntityHistoryItem,
  ReputationProfile,
  Review,
  TrustBadgeAward,
} from "@/types";
import type {
  EntityHistoryRow,
  ReputationProfileRow,
  ReviewRow,
  TrustBadgeRow,
} from "@/types/database";

export function mapReputationProfileRow(
  row: ReputationProfileRow,
): ReputationProfile {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    score: Number(row.score),
    verificationLevel: row.verification_level,
    completedProjects: row.completed_projects,
    completedDeals: row.completed_deals,
    reviewsCount: row.reviews_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapReviewRow(
  row: ReviewRow,
  extras?: { authorName?: string },
): Review {
  return {
    id: row.id,
    authorId: row.author_id,
    targetType: row.target_type,
    targetId: row.target_id,
    dealId: row.deal_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    authorName: extras?.authorName,
  };
}

export function mapEntityHistoryRow(row: EntityHistoryRow): EntityHistoryItem {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    kind: row.kind,
    title: row.title,
    relatedType: row.related_type,
    relatedId: row.related_id,
    meta: (row.meta as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}

export function mapTrustBadgeRow(row: TrustBadgeRow): TrustBadgeAward {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    badge: row.badge,
    createdAt: row.created_at,
  };
}
