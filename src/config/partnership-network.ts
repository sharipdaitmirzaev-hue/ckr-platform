/**
 * Partnership Network — этап 62: развитие партнёрской сети ЦКР.
 * Без отдельной системы — organizations + partnerships.
 */

import {
  ORGANIZATION_TYPES,
  organizationTypeLabels,
  type OrganizationType,
  type PartnershipStatus,
} from "@/config/partners";

/** PartnershipPipeline */
export const PARTNERSHIP_PIPELINE_STAGES = [
  "partner_found",
  "contacted",
  "meeting",
  "negotiation",
  "active",
  "completed",
] as const;

export type PartnershipPipelineStage =
  (typeof PARTNERSHIP_PIPELINE_STAGES)[number];

export const partnershipPipelineStageLabels: Record<
  PartnershipPipelineStage,
  string
> = {
  partner_found: "Найден партнёр",
  contacted: "Контакт",
  meeting: "Встреча",
  negotiation: "Переговоры",
  active: "Активный",
  completed: "Завершён",
};

export function isPartnershipPipelineStage(
  value: string,
): value is PartnershipPipelineStage {
  return (PARTNERSHIP_PIPELINE_STAGES as readonly string[]).includes(value);
}

/** Маппинг legacy partnership.status → pipeline (если stage не задан). */
export function partnershipStatusToPipeline(
  status: PartnershipStatus | string,
): PartnershipPipelineStage {
  if (status === "active") return "active";
  if (status === "inactive") return "completed";
  return "partner_found";
}

/** Категории партнёров (UI) поверх organization.type */
export const PARTNER_CATEGORIES = ORGANIZATION_TYPES;

export type PartnerCategory = OrganizationType;

export const partnerCategoryLabels: Record<PartnerCategory, string> = {
  association: "Бизнес-объединение",
  bank: "Банк",
  fund: "Инвестиционная организация",
  university: "Образовательная организация",
  other: "Консалтинг / прочее",
  company: "Производственная компания",
  government: "Государственные / институциональные структуры",
  supplier: "Поставщик / производственный контур",
};

export function partnerCategoryLabel(type: string): string {
  if ((PARTNER_CATEGORIES as readonly string[]).includes(type)) {
    return partnerCategoryLabels[type as PartnerCategory];
  }
  return organizationTypeLabels[type as OrganizationType] ?? type;
}

/** Статусные корзины дашборда */
export type PartnerBucket = "active" | "potential" | "completed";

export function pipelineToBucket(
  stage: PartnershipPipelineStage,
): PartnerBucket {
  if (stage === "active") return "active";
  if (stage === "completed") return "completed";
  return "potential";
}

/** PartnershipTasks */
export const PARTNERSHIP_TASK_TYPES = [
  "find_contact",
  "hold_meeting",
  "prepare_offer",
  "sign_agreement",
  "support_partner",
] as const;

export type PartnershipTaskType = (typeof PARTNERSHIP_TASK_TYPES)[number];

export const partnershipTaskTypeLabels: Record<PartnershipTaskType, string> = {
  find_contact: "Найти контакт",
  hold_meeting: "Провести встречу",
  prepare_offer: "Подготовить предложение",
  sign_agreement: "Подписать соглашение",
  support_partner: "Сопровождать партнёра",
};

export const PARTNERSHIP_TASK_STATUSES = [
  "new",
  "in_progress",
  "completed",
] as const;

export type PartnershipTaskStatus =
  (typeof PARTNERSHIP_TASK_STATUSES)[number];

export const partnershipTaskStatusLabels: Record<
  PartnershipTaskStatus,
  string
> = {
  new: "Новая",
  in_progress: "В работе",
  completed: "Выполнена",
};

export function isPartnershipTaskType(
  value: string,
): value is PartnershipTaskType {
  return (PARTNERSHIP_TASK_TYPES as readonly string[]).includes(value);
}

export function isPartnershipTaskStatus(
  value: string,
): value is PartnershipTaskStatus {
  return (PARTNERSHIP_TASK_STATUSES as readonly string[]).includes(value);
}

export const DEFAULT_PARTNERSHIP_TASKS: Array<{
  taskType: PartnershipTaskType;
  title: string;
  description: string;
}> = [
  {
    taskType: "find_contact",
    title: "Найти контакт в целевой организации",
    description: "Банк / ТПП / ассоциация / университет.",
  },
  {
    taskType: "hold_meeting",
    title: "Провести первую встречу",
    description: "Знакомство с ЦКР и обсуждение формата партнёрства.",
  },
  {
    taskType: "prepare_offer",
    title: "Подготовить партнёрское предложение",
    description: "Ценность для партнёра и механика referrals.",
  },
  {
    taskType: "sign_agreement",
    title: "Зафиксировать соглашение",
    description: "Перевод в active + attribution source=partner.",
  },
  {
    taskType: "support_partner",
    title: "Сопровождать активного партнёра",
    description: "Проекты, пользователи, результаты.",
  },
] as const;

/** Источник атрибуции */
export const PARTNER_ATTRIBUTION_SOURCE = "partner" as const;

export const PARTNERSHIP_EVENT_TYPES = [
  "partner_created",
  "partner_contacted",
  "partner_activated",
  "partner_referral_created",
  "partner_result_created",
] as const;

export type PartnershipEventType = (typeof PARTNERSHIP_EVENT_TYPES)[number];
