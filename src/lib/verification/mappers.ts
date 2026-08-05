import type {
  DocumentRelatedType,
  VerificationRequest,
  VerificationRequestStatus,
} from "@/types";
import type { VerificationRequestRow } from "@/types/database";

export function mapVerificationRequestRow(
  row: VerificationRequestRow,
): VerificationRequest {
  return {
    id: row.id,
    userId: row.user_id,
    targetType: row.target_type as DocumentRelatedType,
    targetId: row.target_id,
    status: row.status as VerificationRequestStatus,
    adminComment: row.admin_comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
