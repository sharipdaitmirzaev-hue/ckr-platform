/** Open Beta Wave 1 — этап 55: контролируемый публичный запуск. */

import { OPEN_BETA_GOAL_IDS } from "@/config/launch-goals";
import { LAUNCH_WAVE_IDS } from "@/config/launch-waves";

export const OPEN_BETA_WAVE_ID = LAUNCH_WAVE_IDS.openBeta;

export const OPEN_BETA_WAVE_NAME = "Open Beta Wave 1" as const;

export const OPEN_BETA_GOAL_ID_MAP = OPEN_BETA_GOAL_IDS;

export const OPEN_BETA_INVITE_SOURCE = "open_beta_wave" as const;

/** Каналы привлечения (beta_invites.channel). */
export const INVITE_CHANNELS = [
  "email",
  "partner",
  "referral",
  "social",
  "events",
  "content",
  "website",
  "internal",
  "other",
] as const;

export type InviteChannel = (typeof INVITE_CHANNELS)[number];

export const inviteChannelLabels: Record<InviteChannel, string> = {
  email: "Прямые приглашения",
  partner: "Партнёры",
  referral: "Рекомендации",
  social: "Социальные сети",
  events: "Мероприятия",
  content: "Контент",
  website: "Сайт",
  internal: "Внутренний",
  other: "Другое",
};

export function isInviteChannel(value: string): value is InviteChannel {
  return (INVITE_CHANNELS as readonly string[]).includes(value);
}

/**
 * Статусы прохождения Open Beta (расширение beta_invites.status).
 * disabled (legacy) отображается как inactive.
 */
export const OPEN_BETA_JOURNEY_STATUSES = [
  "invited",
  "registered",
  "activated",
  "active",
  "completed",
  "inactive",
] as const;

export type OpenBetaJourneyStatus =
  (typeof OPEN_BETA_JOURNEY_STATUSES)[number];

export const openBetaJourneyStatusLabels: Record<
  OpenBetaJourneyStatus,
  string
> = {
  invited: "Приглашён",
  registered: "Зарегистрирован",
  activated: "Активирован",
  active: "Активен",
  completed: "Завершил",
  inactive: "Неактивен",
};

/** Нормализация legacy status → Open Beta journey status. */
export function toOpenBetaJourneyStatus(status: string): OpenBetaJourneyStatus {
  if (status === "disabled" || status === "expired") return "inactive";
  if (status === "created" || status === "sent") return "invited";
  if (status === "used") return "activated";
  if (
    (OPEN_BETA_JOURNEY_STATUSES as readonly string[]).includes(status)
  ) {
    return status as OpenBetaJourneyStatus;
  }
  return "invited";
}

export type OpenBetaRoleKey =
  | "entrepreneurs"
  | "experts"
  | "investors"
  | "organizations";

export const OPEN_BETA_ROLE_TARGETS: Record<
  OpenBetaRoleKey,
  {
    label: string;
    role: "entrepreneur" | "expert" | "investor" | "company";
    checks: string[];
  }
> = {
  entrepreneurs: {
    label: "Предприниматели",
    role: "entrepreneur",
    checks: ["проекты", "активность"],
  },
  experts: {
    label: "Эксперты",
    role: "expert",
    checks: ["профили", "запросы"],
  },
  investors: {
    label: "Инвесторы",
    role: "investor",
    checks: ["интересы", "заявки"],
  },
  organizations: {
    label: "Организации",
    role: "company",
    checks: ["проекты", "партнёрства"],
  },
};

/** Путь пользователя Open Beta. */
export const OPEN_BETA_JOURNEY_STEPS = [
  {
    key: "entry",
    label: "Вход",
    events: ["invite_sent", "public_page_view", "invite_accepted"],
  },
  {
    key: "registration",
    label: "Регистрация",
    events: ["registration_completed", "user_registered", "invite_accepted"],
  },
  {
    key: "role",
    label: "Роль",
    events: ["role_selected"],
  },
  {
    key: "profile",
    label: "Профиль",
    events: ["profile_completed", "onboarding_completed"],
  },
  {
    key: "lia",
    label: "Лия",
    events: ["lia_first_used", "lia_started", "first_lia_use", "lia_used"],
  },
  {
    key: "first_action",
    label: "Первое действие",
    events: [
      "first_object_created",
      "first_action",
      "project_created",
      "expert_profile_created",
      "investment_interest_created",
      "activation_after_fix",
    ],
  },
  {
    key: "result",
    label: "Результат",
    events: [
      "application_created",
      "deal_created",
      "first_application",
      "first_deal",
    ],
  },
] as const;

export type OpenBetaJourneyStepKey =
  (typeof OPEN_BETA_JOURNEY_STEPS)[number]["key"];

/** Категории feedback в Open Beta. */
export const OPEN_BETA_FEEDBACK_CATEGORIES = [
  "UX",
  "Lia",
  "Project",
  "Expert",
  "Investment",
  "Other",
] as const;

export type OpenBetaFeedbackCategory =
  (typeof OPEN_BETA_FEEDBACK_CATEGORIES)[number];

export const openBetaFeedbackCategoryLabels: Record<
  OpenBetaFeedbackCategory,
  string
> = {
  UX: "UX",
  Lia: "Лия",
  Project: "Проект",
  Expert: "Эксперт",
  Investment: "Инвестиции",
  Other: "Другое",
};

/** Маппинг категории Open Beta → тип feedback (совместимость). */
export function openBetaCategoryToFeedbackType(
  category: OpenBetaFeedbackCategory,
): "ux" | "lia_quality" | "business_value" | "review" | "idea" | "question" {
  if (category === "UX") return "ux";
  if (category === "Lia") return "lia_quality";
  if (category === "Project") return "business_value";
  if (category === "Expert") return "review";
  if (category === "Investment") return "idea";
  return "question";
}

export function isOpenBetaFeedbackCategory(
  value: string,
): value is OpenBetaFeedbackCategory {
  return (OPEN_BETA_FEEDBACK_CATEGORIES as readonly string[]).includes(value);
}

/** Критерии успеха Open Beta (контроль). */
export const OPEN_BETA_SUCCESS_CRITERIA = [
  "Critical issues = 0 в проде",
  "Регистрация ≥ 60% от приглашённых",
  "Первое действие ≥ 25% зарегистрированных",
  "Лия ≥ 35% зарегистрированных",
  "Feedback loop: feedback → issue → improvement работает",
  "Есть связи: интересы / заявки / экспертные взаимодействия",
] as const;
