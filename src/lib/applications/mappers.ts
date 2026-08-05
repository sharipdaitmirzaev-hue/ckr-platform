import type {
  Application,
  ApplicationStatus,
  ApplicationTargetType,
} from "@/types";
import type { ApplicationRow } from "@/types/database";

export function mapApplicationRow(row: ApplicationRow): Application {
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    targetType: row.target_type as ApplicationTargetType,
    targetId: row.target_id,
    message: row.message,
    status: row.status as ApplicationStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
