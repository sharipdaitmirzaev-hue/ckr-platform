import type { ActivityFeedRow } from "@/types/database";

export type ActivityFeedItem = {
  id: string;
  userId: string;
  projectId: string | null;
  actionType: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export function mapActivityFeedRow(row: ActivityFeedRow): ActivityFeedItem {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    actionType: row.action_type,
    description: row.description,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at,
  };
}
