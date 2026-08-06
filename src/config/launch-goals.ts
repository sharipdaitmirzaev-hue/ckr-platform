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
