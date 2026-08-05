import type {
  OperatorRoleRecord,
  OperatorTask,
  SlaRule,
} from "@/types";
import type {
  OperatorRoleRow,
  SlaRuleRow,
  TaskRow,
} from "@/types/database";

export function mapTaskRow(
  row: TaskRow,
  extras?: { assigneeName?: string },
): OperatorTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assignedTo: row.assigned_to,
    relatedType: row.related_type,
    relatedId: row.related_id,
    priority: row.priority,
    status: row.status,
    deadline: row.deadline,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assigneeName: extras?.assigneeName,
  };
}

export function mapOperatorRoleRow(row: OperatorRoleRow): OperatorRoleRecord {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSlaRuleRow(row: SlaRuleRow): SlaRule {
  return {
    id: row.id,
    entityType: row.entity_type,
    timeLimitHours: row.time_limit_hours,
    active: row.active,
    label: row.label,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
