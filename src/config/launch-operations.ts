/** Public Launch Operations — этап 59: операционное управление после активации. */

export const LAUNCH_OPS_TASK_TYPES = [
  "check_project",
  "check_expert",
  "reply_user",
  "handle_issue",
  "contact_partner",
] as const;

export type LaunchOpsTaskType = (typeof LAUNCH_OPS_TASK_TYPES)[number];

export const launchOpsTaskTypeLabels: Record<LaunchOpsTaskType, string> = {
  check_project: "Проверить проект",
  check_expert: "Проверить профиль эксперта",
  reply_user: "Ответить пользователю",
  handle_issue: "Обработать проблему",
  contact_partner: "Связаться с партнёром",
};

export const LAUNCH_OPS_TASK_STATUSES = [
  "new",
  "in_progress",
  "completed",
] as const;

export type LaunchOpsTaskStatus = (typeof LAUNCH_OPS_TASK_STATUSES)[number];

export const launchOpsTaskStatusLabels: Record<LaunchOpsTaskStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  completed: "Выполнена",
};

export function isLaunchOpsTaskType(value: string): value is LaunchOpsTaskType {
  return (LAUNCH_OPS_TASK_TYPES as readonly string[]).includes(value);
}

export function isLaunchOpsTaskStatus(
  value: string,
): value is LaunchOpsTaskStatus {
  return (LAUNCH_OPS_TASK_STATUSES as readonly string[]).includes(value);
}

/** Seed-задачи при активации волны. */
export const DEFAULT_LAUNCH_OPS_TASKS: Array<{
  taskType: LaunchOpsTaskType;
  title: string;
  description: string;
}> = [
  {
    taskType: "check_project",
    title: "Проверить первые публичные проекты",
    description: "Smoke карточек и качества данных проектов после запуска.",
  },
  {
    taskType: "check_expert",
    title: "Проверить профили экспертов",
    description: "Убедиться, что публичные профили экспертов корректны.",
  },
  {
    taskType: "reply_user",
    title: "Ответить первым пользователям",
    description: "Закрыть входящие вопросы / feedback public_launch.",
  },
  {
    taskType: "handle_issue",
    title: "Обработать Critical / High",
    description: "Очередь проблем запуска → pilot_issues / improvements.",
  },
  {
    taskType: "contact_partner",
    title: "Связаться с ключевыми партнёрами",
    description: "Подтвердить партнёрский поток и каналы привлечения.",
  },
] as const;

export const LAUNCH_HEALTH_AREAS = [
  "Product",
  "Users",
  "Ecosystem",
  "Business",
] as const;

export type LaunchHealthArea = (typeof LAUNCH_HEALTH_AREAS)[number];
