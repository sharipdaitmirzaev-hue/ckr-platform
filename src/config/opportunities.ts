import type { OpportunityType, PublishStatus } from "@/types";

export const OPPORTUNITY_TYPES = [
  "land",
  "premises",
  "equipment",
  "ready_business",
  "technology",
  "service",
  "partner",
  "support_program",
  "procurement",
  "auction_asset",
] as const satisfies readonly OpportunityType[];

export const OPPORTUNITY_STATUSES = [
  "draft",
  "moderation",
  "published",
  "archived",
] as const satisfies readonly PublishStatus[];

export const opportunityTypeLabels: Record<OpportunityType, string> = {
  land: "Земля",
  premises: "Помещения",
  equipment: "Оборудование",
  ready_business: "Готовый бизнес",
  technology: "Технологии",
  service: "Услуги",
  partner: "Партнёры",
  support_program: "Господдержка",
  procurement: "Закупки / тендеры",
  auction_asset: "Активы на торгах",
};

export const opportunityStatusLabels: Record<PublishStatus, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликована",
  archived: "В архиве",
};

/** Статус проверки для публичной карточки / владельца */
export const opportunityVerificationLabels: Record<PublishStatus, string> = {
  draft: "Не отправлена на проверку",
  moderation: "На проверке",
  published: "Проверена / опубликована",
  archived: "В архиве",
};

export const opportunityStatusDescriptions: Record<PublishStatus, string> = {
  draft: "Видна только владельцу. Можно дорабатывать.",
  moderation: "Отправлена на проверку перед публикацией.",
  published: "Доступна в публичном каталоге возможностей.",
  archived: "Скрыта из каталога, сохранена у владельца.",
};

export const OPPORTUNITY_CURRENCIES = ["RUB", "USD", "EUR"] as const;
