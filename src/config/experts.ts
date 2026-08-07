import type {
  ExpertProfileStatus,
  ExpertSpecialization,
} from "@/types";

export {
  VERIFICATION_STATUSES,
  verificationStatusLabels,
} from "@/config/verification";

export const EXPERT_SPECIALIZATIONS = [
  "lawyer",
  "accountant",
  "marketer",
  "engineer",
  "builder",
  "consultant",
  "other",
] as const satisfies readonly ExpertSpecialization[];

export const EXPERT_STATUSES = [
  "draft",
  "moderation",
  "published",
  "archived",
] as const satisfies readonly ExpertProfileStatus[];

export const expertSpecializationLabels: Record<ExpertSpecialization, string> =
  {
    lawyer: "Юрист",
    accountant: "Бухгалтер",
    marketer: "Маркетолог",
    engineer: "Инженер",
    builder: "Строитель",
    consultant: "Консультант",
    other: "Другое",
  };

export const expertStatusLabels: Record<ExpertProfileStatus, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликован",
  archived: "В архиве",
};

export const expertStatusDescriptions: Record<ExpertProfileStatus, string> = {
  draft: "Виден только вам.",
  moderation: "На проверке перед публикацией в каталоге.",
  published: "Доступен в каталоге экспертов ЦКР.",
  archived: "Скрыт из каталога.",
};
