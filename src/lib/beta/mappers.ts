import type { BetaInvite, Feedback, UserFeedbackEvent } from "@/types";
import type {
  BetaInviteRow,
  FeedbackRow,
  UserFeedbackEventRow,
} from "@/types/database";

export function mapBetaInviteRow(row: BetaInviteRow): BetaInvite {
  return {
    id: row.id,
    email: row.email,
    code: row.code,
    role: row.role,
    status: row.status,
    source: row.source ?? "manual",
    createdAt: row.created_at,
    usedAt: row.used_at,
    createdBy: row.created_by,
    usedBy: row.used_by,
  };
}

export function mapFeedbackRow(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    message: row.message,
    rating: row.rating,
    page: row.page,
    relatedType: row.related_type ?? null,
    relatedId: row.related_id ?? null,
    priority: row.priority ?? "medium",
    createdAt: row.created_at,
  };
}

export function mapUserFeedbackEventRow(
  row: UserFeedbackEventRow,
): UserFeedbackEvent {
  return {
    id: row.id,
    userId: row.user_id,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}
