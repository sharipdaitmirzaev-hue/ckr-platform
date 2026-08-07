import type { CrmActivity, CrmContact, CrmLead } from "@/types";
import type { CrmActivityRow, CrmContactRow, LeadRow } from "@/types/database";

export function mapCrmContactRow(row: CrmContactRow): CrmContact {
  return {
    id: row.id,
    name: row.name,
    companyName: row.company_name,
    phone: row.phone,
    email: row.email,
    type: row.type,
    source: row.source,
    assignedTo: row.assigned_to,
    status: row.status,
    notes: row.notes,
    linkedUserId: row.linked_user_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLeadRow(
  row: LeadRow,
  extras?: { contactName?: string; contactEmail?: string },
): CrmLead {
  return {
    id: row.id,
    contactId: row.contact_id,
    title: row.title,
    description: row.description,
    category: row.category,
    assignedTo: row.assigned_to,
    stage: row.stage,
    convertedUserId: row.converted_user_id,
    convertedProjectId: row.converted_project_id,
    convertedOpportunityId: row.converted_opportunity_id,
    convertedInvestmentId: row.converted_investment_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contactName: extras?.contactName,
    contactEmail: extras?.contactEmail,
  };
}

export function mapCrmActivityRow(
  row: CrmActivityRow,
  extras?: { contactName?: string; leadTitle?: string },
): CrmActivity {
  return {
    id: row.id,
    contactId: row.contact_id,
    leadId: row.lead_id,
    type: row.type,
    title: row.title,
    body: row.body,
    taskStatus: row.task_status,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    contactName: extras?.contactName,
    leadTitle: extras?.leadTitle,
  };
}
