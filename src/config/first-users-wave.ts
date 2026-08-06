/** First Users Wave — этап 50: ограниченный запуск на реальных пользователях. */

import { FIRST_USERS_WAVE_GOAL_IDS } from "@/config/launch-goals";
import { LAUNCH_WAVE_IDS } from "@/config/launch-waves";

export const FIRST_USERS_WAVE_ID = LAUNCH_WAVE_IDS.firstUsers;

export const FIRST_USERS_WAVE_NAME = "First Users Wave" as const;

export const FIRST_USERS_WAVE_GOAL_ID_MAP = FIRST_USERS_WAVE_GOAL_IDS;

/** Источники приглашения beta_invites.source */
export const INVITE_SOURCES = [
  "beta_expansion_wave",
  "first_users_wave",
  "manual",
  "referral",
  "partner",
  "internal",
] as const;

export type InviteSource = (typeof INVITE_SOURCES)[number];

export const inviteSourceLabels: Record<InviteSource, string> = {
  beta_expansion_wave: "Beta Expansion Wave",
  first_users_wave: "First Users Wave",
  manual: "Вручную",
  referral: "Реферал",
  partner: "Партнёр",
  internal: "Внутренний",
};

export function isInviteSource(value: string): value is InviteSource {
  return (INVITE_SOURCES as readonly string[]).includes(value);
}

export type FirstUsersRoleKey =
  | "entrepreneurs"
  | "experts"
  | "investors"
  | "organizations";

export const FIRST_USERS_ROLE_TARGETS: Record<
  FirstUsersRoleKey,
  {
    label: string;
    role: "entrepreneur" | "expert" | "investor" | "company";
    min: number;
    max: number;
    checks: string[];
  }
> = {
  entrepreneurs: {
    label: "Предприниматели",
    role: "entrepreneur",
    min: 5,
    max: 10,
    checks: [
      "регистрация",
      "выбор роли",
      "профиль",
      "работа с Лией",
      "создание проекта",
    ],
  },
  experts: {
    label: "Эксперты",
    role: "expert",
    min: 2,
    max: 3,
    checks: [
      "создание профиля",
      "описание компетенций",
      "получение запросов",
    ],
  },
  investors: {
    label: "Инвесторы",
    role: "investor",
    min: 1,
    max: 2,
    checks: ["просмотр проектов", "интерес", "взаимодействие"],
  },
  organizations: {
    label: "Организации",
    role: "company",
    min: 1,
    max: 3,
    checks: ["профиль", "проекты", "возможности"],
  },
};

/** Путь участника First Users Wave. */
export const FIRST_USERS_JOURNEY_STEPS = [
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
    key: "first_action",
    label: "Первое действие",
    events: ["first_object_created", "first_action"],
  },
  {
    key: "lia",
    label: "Использование Лии",
    events: ["lia_first_used", "lia_started", "first_lia_use"],
  },
  {
    key: "object",
    label: "Создание объекта",
    events: [
      "project_created",
      "expert_profile_created",
      "first_project_created",
      "first_project",
    ],
  },
] as const;

export type FirstUsersJourneyStepKey =
  (typeof FIRST_USERS_JOURNEY_STEPS)[number]["key"];

export const FIRST_USERS_SUCCESS_METRICS = [
  "≥70% приглашённых активировали аккаунт",
  "≥50% прошли до первого действия",
  "≥40% использовали Лию",
  "Каждый активный оставил feedback (liked / unclear / blockers)",
  "Критические блоки зафиксированы в pilot_issues",
] as const;
