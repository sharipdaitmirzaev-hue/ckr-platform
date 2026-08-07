/** Цели запуска (этапы 42–43). */

export const LAUNCH_GOAL_STATUSES = [
  "active",
  "achieved",
  "failed",
  "cancelled",
] as const;

export type LaunchGoalStatus = (typeof LAUNCH_GOAL_STATUSES)[number];

export const launchGoalStatusLabels: Record<LaunchGoalStatus, string> = {
  active: "Активна",
  achieved: "Достигнута",
  failed: "Не достигнута",
  cancelled: "Отменена",
};

export const LAUNCH_GOAL_METRIC_TYPES = [
  "users",
  "activation",
  "projects",
  "applications",
  "deals",
  "lia_usage",
  "business_results",
] as const;

export type LaunchGoalMetricType = (typeof LAUNCH_GOAL_METRIC_TYPES)[number];

export const launchGoalMetricLabels: Record<LaunchGoalMetricType, string> = {
  users: "Пользователи",
  activation: "Активация",
  projects: "Проекты",
  applications: "Заявки",
  deals: "Сделки",
  lia_usage: "Лия",
  business_results: "Бизнес-результаты",
};

/** Analytics / feed / notifications event names. */
export const LAUNCH_GOAL_EVENT_TYPES = [
  "launch_goal_created",
  "launch_goal_achieved",
  "launch_goal_failed",
  "launch_wave_completed",
] as const;

export type LaunchGoalEventType = (typeof LAUNCH_GOAL_EVENT_TYPES)[number];

export const launchGoalEventLabels: Record<LaunchGoalEventType, string> = {
  launch_goal_created: "Цель запуска создана",
  launch_goal_achieved: "Цель запуска достигнута",
  launch_goal_failed: "Цель запуска не достигнута",
  launch_wave_completed: "Волна запуска завершена",
};

/** Seed UUID целей Closed Wave 1 — ТИНДА (этап 43). */
export const LAUNCH_GOAL_IDS = {
  orgProfile: "c0000004-0000-4000-8000-000000000001",
  projectCreated: "c0000004-0000-4000-8000-000000000002",
  onboarding: "c0000004-0000-4000-8000-000000000003",
  roadmap: "c0000004-0000-4000-8000-000000000004",
  firstTasks: "c0000004-0000-4000-8000-000000000005",
  kpiUpdated: "c0000004-0000-4000-8000-000000000006",
  crmClients: "c0000004-0000-4000-8000-000000000007",
  partners: "c0000004-0000-4000-8000-000000000008",
  deals: "c0000004-0000-4000-8000-000000000009",
} as const;

/** Seed UUID целей Wave 2 — Ecosystem Beta (этап 46). */
export const WAVE2_ECOSYSTEM_GOAL_IDS = {
  entrepreneurs: "c0000006-0000-4000-8000-000000000001",
  experts: "c0000006-0000-4000-8000-000000000002",
  investors: "c0000006-0000-4000-8000-000000000003",
  organizations: "c0000006-0000-4000-8000-000000000004",
  profilePct: "c0000006-0000-4000-8000-000000000005",
  liaPct: "c0000006-0000-4000-8000-000000000006",
  firstActionPct: "c0000006-0000-4000-8000-000000000007",
  projects: "c0000006-0000-4000-8000-000000000008",
  interests: "c0000006-0000-4000-8000-000000000009",
  applications: "c0000006-0000-4000-8000-00000000000a",
  expertInteractions: "c0000006-0000-4000-8000-00000000000b",
  dealOrPartnership: "c0000006-0000-4000-8000-00000000000c",
} as const;

/** Seed UUID целей First Users Wave (этап 50). */
export const FIRST_USERS_WAVE_GOAL_IDS = {
  entrepreneurs: "c0000007-0000-4000-8000-000000000001",
  experts: "c0000007-0000-4000-8000-000000000002",
  investors: "c0000007-0000-4000-8000-000000000003",
  organizations: "c0000007-0000-4000-8000-000000000004",
  activationPct: "c0000007-0000-4000-8000-000000000005",
  firstActionPct: "c0000007-0000-4000-8000-000000000006",
  liaPct: "c0000007-0000-4000-8000-000000000007",
  feedback: "c0000007-0000-4000-8000-000000000008",
} as const;

/** Seed UUID целей Beta Expansion Wave (этап 53). */
export const BETA_EXPANSION_GOAL_IDS = {
  entrepreneurs: "c0000009-0000-4000-8000-000000000001",
  experts: "c0000009-0000-4000-8000-000000000002",
  investors: "c0000009-0000-4000-8000-000000000003",
  organizations: "c0000009-0000-4000-8000-000000000004",
  registrationPct: "c0000009-0000-4000-8000-000000000005",
  profilePct: "c0000009-0000-4000-8000-000000000006",
  liaPct: "c0000009-0000-4000-8000-000000000007",
  firstObjectPct: "c0000009-0000-4000-8000-000000000008",
  projects: "c0000009-0000-4000-8000-000000000009",
  expertInteractions: "c0000009-0000-4000-8000-00000000000a",
  interests: "c0000009-0000-4000-8000-00000000000b",
  applications: "c0000009-0000-4000-8000-00000000000c",
  deals: "c0000009-0000-4000-8000-00000000000d",
} as const;

/** Seed UUID целей Open Beta Wave 1 (этап 55). */
export const OPEN_BETA_GOAL_IDS = {
  invited: "c000000a-0000-4000-8000-000000000001",
  registered: "c000000a-0000-4000-8000-000000000002",
  activated: "c000000a-0000-4000-8000-000000000003",
  active: "c000000a-0000-4000-8000-000000000004",
  projects: "c000000a-0000-4000-8000-000000000005",
  applications: "c000000a-0000-4000-8000-000000000006",
  interests: "c000000a-0000-4000-8000-000000000007",
  liaPct: "c000000a-0000-4000-8000-000000000008",
  feedback: "c000000a-0000-4000-8000-000000000009",
} as const;

/** Seed UUID целей Public Launch Wave 1 (этап 58). */
export const PUBLIC_LAUNCH_GOAL_IDS = {
  registered: "c000000b-0000-4000-8000-000000000001",
  activated: "c000000b-0000-4000-8000-000000000002",
  projects: "c000000b-0000-4000-8000-000000000003",
  applications: "c000000b-0000-4000-8000-000000000004",
  deals: "c000000b-0000-4000-8000-000000000005",
  liaPct: "c000000b-0000-4000-8000-000000000006",
  feedback: "c000000b-0000-4000-8000-000000000007",
} as const;

export function isLaunchGoalStatus(value: string): value is LaunchGoalStatus {
  return (LAUNCH_GOAL_STATUSES as readonly string[]).includes(value);
}

export function isLaunchGoalMetricType(
  value: string,
): value is LaunchGoalMetricType {
  return (LAUNCH_GOAL_METRIC_TYPES as readonly string[]).includes(value);
}

export function goalProgressPercent(
  current: number,
  target: number,
): number {
  if (target <= 0) return current > 0 ? 100 : 0;
  return Math.min(100, Math.round((current / target) * 100));
}
