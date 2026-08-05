import type {
  Deal,
  DealParticipant,
  ProjectActivity,
  ProjectMilestone,
} from "@/types";
import type {
  DealParticipantRow,
  DealRow,
  ProjectActivityRow,
  ProjectMilestoneRow,
} from "@/types/database";

export function mapDealRow(row: DealRow): Deal {
  return {
    id: row.id,
    projectId: row.project_id,
    initiatorId: row.initiator_id,
    partnerId: row.partner_id,
    dealType: row.deal_type,
    amount: row.amount === null || row.amount === undefined
      ? null
      : Number(row.amount),
    currency: row.currency,
    status: row.status,
    description: row.description,
    commissionType: row.commission_type ?? null,
    commissionAmount:
      row.commission_amount === null || row.commission_amount === undefined
        ? null
        : Number(row.commission_amount),
    commissionStatus: row.commission_status ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDealParticipantRow(row: DealParticipantRow): DealParticipant {
  return {
    id: row.id,
    dealId: row.deal_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function mapMilestoneRow(row: ProjectMilestoneRow): ProjectMilestone {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    deadline: row.deadline,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapActivityRow(row: ProjectActivityRow): ProjectActivity {
  return {
    id: row.id,
    projectId: row.project_id,
    actorId: row.actor_id,
    activityType: row.activity_type,
    title: row.title,
    body: row.body,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}
