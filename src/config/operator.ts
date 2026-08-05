export const OPERATOR_ROLES = [
  "manager",
  "analyst",
  "moderator",
  "admin",
] as const;

export type OperatorRole = (typeof OPERATOR_ROLES)[number];

export const operatorRoleLabels: Record<OperatorRole, string> = {
  manager: "Менеджер",
  analyst: "Аналитик",
  moderator: "Модератор",
  admin: "Администратор центра",
};

export const operatorRoleDescriptions: Record<OperatorRole, string> = {
  manager: "Ведение лидов, задач и координация команды",
  analyst: "Разбор очереди, SLA и рекомендации",
  moderator: "Проверка проектов, документов и заявок",
  admin: "Полный доступ к операционному центру и ролям",
};

export const TASK_STATUSES = [
  "new",
  "in_progress",
  "waiting",
  "completed",
  "cancelled",
] as const;

export type OperatorTaskStatus = (typeof TASK_STATUSES)[number];

export const taskStatusLabels: Record<OperatorTaskStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  waiting: "Ожидание",
  completed: "Выполнена",
  cancelled: "Отменена",
};

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
};

export const TASK_RELATED_TYPES = [
  "lead",
  "project",
  "deal",
  "document",
  "verification",
] as const;

export type TaskRelatedType = (typeof TASK_RELATED_TYPES)[number];

export const taskRelatedTypeLabels: Record<TaskRelatedType, string> = {
  lead: "Лид",
  project: "Проект",
  deal: "Сделка",
  document: "Документ",
  verification: "Верификация",
};

export const OPEN_TASK_STATUSES: OperatorTaskStatus[] = [
  "new",
  "in_progress",
  "waiting",
];

export function isOperatorRole(value: string): value is OperatorRole {
  return (OPERATOR_ROLES as readonly string[]).includes(value);
}

export function isTaskStatus(value: string): value is OperatorTaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(value);
}

export function isTaskRelatedType(value: string): value is TaskRelatedType {
  return (TASK_RELATED_TYPES as readonly string[]).includes(value);
}
