export type NotificationType =
  | "application"
  | "message"
  | "project_update"
  | "deal_update"
  | "document"
  | "verification"
  | "system"
  | "application_received"
  | "application_status";

export type NotificationRelatedType =
  | "application"
  | "message"
  | "project"
  | "deal"
  | "document"
  | "verification"
  | "system"
  | "opportunity"
  | "investment"
  | "expert";

export const notificationTypeLabels: Record<string, string> = {
  application: "Заявка",
  application_received: "Заявка",
  application_status: "Заявка",
  message: "Сообщение",
  project_update: "Проект",
  deal_update: "Сделка",
  document: "Документ",
  verification: "Проверка",
  system: "Система",
};

export type ActivityActionType =
  | "project_created"
  | "status_change"
  | "participant_added"
  | "document_uploaded"
  | "milestone_completed"
  | "milestone_created"
  | "milestone_updated"
  | "deal_created"
  | "deal_updated"
  | "note"
  | string;

export const activityActionLabels: Record<string, string> = {
  project_created: "Проект создан",
  status_change: "Статус",
  participant_added: "Участник",
  document_uploaded: "Документ",
  milestone_completed: "Этап завершён",
  milestone_created: "Этап создан",
  milestone_updated: "Этап обновлён",
  deal_created: "Сделка",
  deal_updated: "Сделка обновлена",
  note: "Заметка",
};

export function hrefForNotification(input: {
  link?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  applicationId?: string | null;
}): string {
  if (input.link) return input.link;
  if (input.relatedType === "message" && input.relatedId) {
    return `/messages?c=${input.relatedId}`;
  }
  if (input.relatedType === "application" || input.applicationId) {
    return "/dashboard/applications";
  }
  if (input.relatedType === "project" && input.relatedId) {
    return `/dashboard/projects/${input.relatedId}/workspace`;
  }
  if (input.relatedType === "deal" && input.relatedId) {
    return "/dashboard/projects";
  }
  if (input.relatedType === "document") {
    return "/dashboard/documents";
  }
  if (input.relatedType === "verification") {
    return "/dashboard/documents";
  }
  return "/dashboard/notifications";
}
