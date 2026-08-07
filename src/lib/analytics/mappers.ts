import type { AnalyticsEventType } from "@/config/analytics";
import type { AnalyticsEvent } from "@/types";
import type { AnalyticsEventRow } from "@/types/database";

export function mapAnalyticsEventRow(row: AnalyticsEventRow): AnalyticsEvent {
  return {
    id: row.id,
    userId: row.user_id,
    eventType: row.event_type as AnalyticsEventType,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}
