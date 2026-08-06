/** Цели запуска (этап 42). */

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

/** Analytics / feed / notifications event names (этап 42). */
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

/** Seed UUID целей closed wave. */
export const LAUNCH_GOAL_IDS = {
  users20: "c0000003-0000-4000-8000-000000000001",
  profiles10: "c0000003-0000-4000-8000-000000000002",
  projects5: "c0000003-0000-4000-8000-000000000003",
  applications3: "c0000003-0000-4000-8000-000000000004",
  deals1: "c0000003-0000-4000-8000-000000000005",
  lia5: "c0000003-0000-4000-8000-000000000006",
  tindaClients: "c0000003-0000-4000-8000-000000000007",
  tindaNegotiations: "c0000003-0000-4000-8000-000000000008",
  tindaPartners: "c0000003-0000-4000-8000-000000000009",
  tindaDeals: "c0000003-0000-4000-8000-00000000000a",
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
