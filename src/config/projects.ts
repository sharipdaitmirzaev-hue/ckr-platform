import type { ProjectStage, ProjectStatus, PublishStatus } from "@/types";

/** Жизненный цикл проекта (поле status). */
export const PROJECT_STATUSES = [
  "draft",
  "moderation",
  "published",
  "active",
  "completed",
  "archived",
] as const satisfies readonly ProjectStatus[];

/** Статус публикации возможностей / офферов (без active/completed). */
export const PUBLISH_STATUSES = [
  "draft",
  "moderation",
  "published",
  "archived",
] as const satisfies readonly PublishStatus[];

export const PROJECT_STAGES = [
  "idea",
  "startup",
  "operating",
  "expansion",
] as const satisfies readonly ProjectStage[];

export const projectStatusLabels: Record<ProjectStatus, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликован",
  active: "В реализации",
  completed: "Завершён",
  archived: "В архиве",
};

export const projectStageLabels: Record<ProjectStage, string> = {
  idea: "Идея",
  startup: "Стартап",
  operating: "Действующий бизнес",
  expansion: "Расширение",
};

export const projectStatusDescriptions: Record<ProjectStatus, string> = {
  draft: "Виден только владельцу. Можно дорабатывать.",
  moderation: "Отправлен на проверку перед публикацией.",
  published: "Доступен в публичном каталоге ЦКР.",
  active: "Проект в сопровождении: сделки и этапы реализации.",
  completed: "Реализация завершена. Сохранён в истории ЦКР.",
  archived: "Скрыт из каталога, сохранён у владельца.",
};

export const PROJECT_LIFECYCLE_ORDER: readonly ProjectStatus[] = [
  "draft",
  "moderation",
  "published",
  "active",
  "completed",
  "archived",
];

export const CURRENCIES = ["RUB", "USD", "EUR"] as const;

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}

export function isPublishStatus(value: string): value is PublishStatus {
  return (PUBLISH_STATUSES as readonly string[]).includes(value);
}
