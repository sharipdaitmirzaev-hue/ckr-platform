/**
 * Project Acquisition Engine — этап 61: поток проектов от поиска до развития.
 * Без нового каталога проектов — используем existing projects + CRM leads.
 */

/** ProjectAcquisitionPipeline */
export const PROJECT_ACQUISITION_STAGES = [
  "lead_found",
  "contacted",
  "interested",
  "draft_created",
  "moderation",
  "published",
  "active",
] as const;

export type ProjectAcquisitionStage =
  (typeof PROJECT_ACQUISITION_STAGES)[number];

export const projectAcquisitionStageLabels: Record<
  ProjectAcquisitionStage,
  string
> = {
  lead_found: "Найден проект",
  contacted: "Контакт",
  interested: "Заинтересован",
  draft_created: "Создан проект",
  moderation: "На модерации",
  published: "Опубликован",
  active: "Получает взаимодействия",
};

/** Маппинг CRM lead.stage → acquisition pipeline */
export function crmLeadToAcquisitionStage(
  crmStage: string,
): ProjectAcquisitionStage {
  if (crmStage === "contacted") return "contacted";
  if (crmStage === "qualified") return "interested";
  if (crmStage === "project_created") return "draft_created";
  if (crmStage === "deal" || crmStage === "closed") return "active";
  return "lead_found";
}

/** ProjectSources */
export const PROJECT_SOURCES = [
  "entrepreneur",
  "tinda",
  "partners",
  "events",
  "crm",
  "lia",
  "referral",
] as const;

export type ProjectSource = (typeof PROJECT_SOURCES)[number];

export const projectSourceLabels: Record<ProjectSource, string> = {
  entrepreneur: "Предприниматель самостоятельно",
  tinda: "ТИНДА / кейсы",
  partners: "Партнёры",
  events: "Мероприятия",
  crm: "CRM",
  lia: "Лия",
  referral: "Рекомендации",
};

export function normalizeProjectSource(raw: string | null | undefined): ProjectSource {
  const value = (raw ?? "").toLowerCase().trim();
  if (!value) return "crm";
  if (
    value.includes("tinda") ||
    value.includes("тинда") ||
    value === "pilot" ||
    value === "case"
  ) {
    return "tinda";
  }
  if (
    value.includes("partner") ||
    value.includes("партнёр") ||
    value.includes("organization")
  ) {
    return "partners";
  }
  if (value.includes("event") || value.includes("мероприят")) {
    return "events";
  }
  if (
    value.includes("lia") ||
    value.includes("лия") ||
    value.includes("business_audit") ||
    value.includes("audit")
  ) {
    return "lia";
  }
  if (
    value.includes("referral") ||
    value.includes("recommend") ||
    value.includes("рекоменд")
  ) {
    return "referral";
  }
  if (
    value.includes("entrepreneur") ||
    value.includes("self") ||
    value.includes("organic") ||
    value.includes("website") ||
    value.includes("public") ||
    value.includes("предпринимат")
  ) {
    return "entrepreneur";
  }
  if (
    value.includes("crm") ||
    value.includes("manual") ||
    value.includes("operator") ||
    value.includes("admin")
  ) {
    return "crm";
  }
  return "crm";
}

/** Путь развития бизнеса через ЦКР (шаблон business_development). */
export const BUSINESS_DEVELOPMENT_PATH = [
  {
    id: "audit",
    label: "Аудит",
    hint: "BusinessAuditReport · Лия «Аудит моего бизнеса»",
  },
  {
    id: "strategy",
    label: "Стратегия",
    hint: "StrategyReport · «Разработать стратегию развития»",
  },
  {
    id: "project",
    label: "Проект развития",
    hint: "Шаблон business_development → draft → publish",
  },
  {
    id: "resources",
    label: "Ресурсы",
    hint: "opportunities · investments · workspace",
  },
  {
    id: "network",
    label: "Эксперты / партнёры / инвестиции",
    hint: "experts · organizations · applications",
  },
] as const;

/** Analytics event types этапа 61 (значения дублируются в config/analytics). */
export const PROJECT_ACQUISITION_EVENT_TYPES = [
  "project_lead_created",
  "project_contacted",
  "project_interest_confirmed",
  "project_draft_created",
  "project_published_from_acquisition",
] as const;

export type ProjectAcquisitionEventType =
  (typeof PROJECT_ACQUISITION_EVENT_TYPES)[number];
