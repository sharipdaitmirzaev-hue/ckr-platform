import type { PilotIssueSeverity, PilotIssueStatus } from "@/config/pilot";
import type { PilotIssue } from "@/types";
import type { PilotIssueRow } from "@/types/database";

export function mapPilotIssueRow(row: PilotIssueRow): PilotIssue {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    severity: row.severity as PilotIssueSeverity,
    status: row.status as PilotIssueStatus,
    createdBy: row.created_by,
    sourceType: row.source_type ?? null,
    sourceId: row.source_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
