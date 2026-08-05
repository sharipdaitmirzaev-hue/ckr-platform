import type { ProjectStage, PublishStatus } from "@/types";

export const PROJECT_STATUSES = [
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

export const projectStatusLabels: Record<PublishStatus, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликован",
  archived: "В архиве",
};

export const projectStageLabels: Record<ProjectStage, string> = {
  idea: "Идея",
  startup: "Стартап",
  operating: "Действующий бизнес",
  expansion: "Расширение",
};

export const projectStatusDescriptions: Record<PublishStatus, string> = {
  draft: "Виден только владельцу. Можно дорабатывать.",
  moderation: "Отправлен на проверку перед публикацией.",
  published: "Доступен в публичном каталоге ЦКР.",
  archived: "Скрыт из каталога, сохранён у владельца.",
};

export const CURRENCIES = ["RUB", "USD", "EUR"] as const;
