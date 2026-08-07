export const CRM_CONTACT_TYPES = [
  "entrepreneur",
  "investor",
  "expert",
  "company",
  "partner",
  "other",
] as const;

export type CrmContactType = (typeof CRM_CONTACT_TYPES)[number];

export const crmContactTypeLabels: Record<CrmContactType, string> = {
  entrepreneur: "Предприниматель",
  investor: "Инвестор",
  expert: "Эксперт",
  company: "Компания",
  partner: "Партнёр",
  other: "Другое",
};

export const CRM_CONTACT_STATUSES = ["new", "active", "inactive"] as const;

export type CrmContactStatus = (typeof CRM_CONTACT_STATUSES)[number];

export const crmContactStatusLabels: Record<CrmContactStatus, string> = {
  new: "Новый",
  active: "Активный",
  inactive: "Неактивный",
};

export const CRM_LEAD_STAGES = [
  "new",
  "contacted",
  "qualified",
  "project_created",
  "deal",
  "closed",
] as const;

export type CrmLeadStage = (typeof CRM_LEAD_STAGES)[number];

export const crmLeadStageLabels: Record<CrmLeadStage, string> = {
  new: "Новый",
  contacted: "Контакт установлен",
  qualified: "Квалифицирован",
  project_created: "Создан проект",
  deal: "Сделка",
  closed: "Закрыт",
};

export const CRM_ACTIVITY_TYPES = [
  "call",
  "meeting",
  "email",
  "comment",
  "task",
] as const;

export type CrmActivityType = (typeof CRM_ACTIVITY_TYPES)[number];

export const crmActivityTypeLabels: Record<CrmActivityType, string> = {
  call: "Звонок",
  meeting: "Встреча",
  email: "Письмо",
  comment: "Комментарий",
  task: "Задача",
};

export const CRM_TASK_STATUSES = ["open", "done", "cancelled"] as const;

export type CrmTaskStatus = (typeof CRM_TASK_STATUSES)[number];

export const crmTaskStatusLabels: Record<CrmTaskStatus, string> = {
  open: "Открыта",
  done: "Выполнена",
  cancelled: "Отменена",
};

export const CRM_CONVERSION_TARGETS = [
  "user",
  "project",
  "opportunity",
  "investment",
] as const;

export type CrmConversionTarget = (typeof CRM_CONVERSION_TARGETS)[number];

export const crmConversionTargetLabels: Record<CrmConversionTarget, string> = {
  user: "Пользователь",
  project: "Проект",
  opportunity: "Возможность",
  investment: "Инвестиция",
};

export const CRM_TABS = [
  "contacts",
  "leads",
  "tasks",
  "history",
] as const;

export type CrmTab = (typeof CRM_TABS)[number];

export const crmTabLabels: Record<CrmTab, string> = {
  contacts: "Контакты",
  leads: "Лиды",
  tasks: "Задачи",
  history: "История",
};

export function isCrmContactType(value: string): value is CrmContactType {
  return (CRM_CONTACT_TYPES as readonly string[]).includes(value);
}

export function isCrmContactStatus(value: string): value is CrmContactStatus {
  return (CRM_CONTACT_STATUSES as readonly string[]).includes(value);
}

export function isCrmLeadStage(value: string): value is CrmLeadStage {
  return (CRM_LEAD_STAGES as readonly string[]).includes(value);
}

export function isCrmActivityType(value: string): value is CrmActivityType {
  return (CRM_ACTIVITY_TYPES as readonly string[]).includes(value);
}

export function isCrmConversionTarget(
  value: string,
): value is CrmConversionTarget {
  return (CRM_CONVERSION_TARGETS as readonly string[]).includes(value);
}

/** Роль платформы по типу CRM-контакта (для конвертации в пользователя). */
export function contactTypeToPlatformRole(
  type: CrmContactType,
): "entrepreneur" | "investor" | "expert" | "company" {
  if (type === "investor") return "investor";
  if (type === "expert") return "expert";
  if (type === "company" || type === "partner") return "company";
  return "entrepreneur";
}
