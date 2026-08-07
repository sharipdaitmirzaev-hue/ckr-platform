/** Beta Expansion Wave — этап 53: расширенная закрытая beta. */

import { BETA_EXPANSION_GOAL_IDS } from "@/config/launch-goals";
import { LAUNCH_WAVE_IDS } from "@/config/launch-waves";

export const BETA_EXPANSION_WAVE_ID = LAUNCH_WAVE_IDS.betaExpansion;

export const BETA_EXPANSION_WAVE_NAME = "Beta Expansion Wave" as const;

export const BETA_EXPANSION_GOAL_ID_MAP = BETA_EXPANSION_GOAL_IDS;

export const BETA_EXPANSION_INVITE_SOURCE = "beta_expansion_wave" as const;

export type BetaExpansionRoleKey =
  | "entrepreneurs"
  | "experts"
  | "investors"
  | "organizations";

export const BETA_EXPANSION_ROLE_TARGETS: Record<
  BetaExpansionRoleKey,
  {
    label: string;
    role: "entrepreneur" | "expert" | "investor" | "company";
    min: number;
    max: number;
    target: number;
    checks: string[];
  }
> = {
  entrepreneurs: {
    label: "Предприниматели",
    role: "entrepreneur",
    min: 20,
    max: 30,
    target: 25,
    checks: [
      "регистрация",
      "профиль",
      "Лия",
      "создание проекта",
      "поиск ресурсов",
    ],
  },
  experts: {
    label: "Эксперты",
    role: "expert",
    min: 5,
    max: 10,
    target: 8,
    checks: [
      "профиль",
      "верификация",
      "получение запросов",
      "взаимодействие",
    ],
  },
  investors: {
    label: "Инвесторы",
    role: "investor",
    min: 3,
    max: 5,
    target: 4,
    checks: ["просмотр проектов", "интерес", "заявки"],
  },
  organizations: {
    label: "Организации",
    role: "company",
    min: 5,
    max: 5,
    target: 5,
    checks: ["профиль", "возможности", "партнёрства"],
  },
};

/** Путь участника Beta Expansion (контроль). */
export const BETA_EXPANSION_JOURNEY_STEPS = [
  {
    key: "registration",
    label: "Регистрация",
    events: ["registration_completed", "invite_accepted", "user_registered"],
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
      "partnership_created",
    ],
  },
] as const;

export type BetaExpansionJourneyStepKey =
  (typeof BETA_EXPANSION_JOURNEY_STEPS)[number]["key"];

export const BETA_EXPANSION_ACTIVATION_TARGETS = {
  registrationPct: 80,
  profilePct: 70,
  liaPct: 50,
  firstObjectPct: 30,
} as const;

export const BETA_EXPANSION_ECOSYSTEM_TARGETS = {
  projects: 20,
  expertInteractions: 10,
  interests: 10,
  applications: 5,
  deals: 1,
} as const;

/** Решение после Beta Expansion. */
export const BETA_EXPANSION_DECISIONS = [
  "continue_beta",
  "open_beta_ready",
  "needs_improvement",
] as const;

export type BetaExpansionDecision = (typeof BETA_EXPANSION_DECISIONS)[number];

export const betaExpansionDecisionLabels: Record<
  BetaExpansionDecision,
  string
> = {
  continue_beta: "Продолжить beta",
  open_beta_ready: "Готовы к open beta",
  needs_improvement: "Нужны улучшения",
};

export const betaExpansionDecisionHints: Record<
  BetaExpansionDecision,
  string
> = {
  continue_beta:
    "Держать расширенную закрытую beta: донабрать когорту и укрепить активацию/связи.",
  open_beta_ready:
    "Метрики и качество связей достаточны для планирования open beta / следующей волны.",
  needs_improvement:
    "Сначала закрыть блокеры активации и Critical/High через цикл улучшений.",
};

export function isBetaExpansionDecision(
  value: string,
): value is BetaExpansionDecision {
  return (BETA_EXPANSION_DECISIONS as readonly string[]).includes(value);
}
