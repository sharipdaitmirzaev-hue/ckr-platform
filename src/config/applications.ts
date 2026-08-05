import type { ApplicationStatus, ApplicationTargetType } from "@/types";

export const APPLICATION_TARGET_TYPES = [
  "project",
  "opportunity",
  "investment",
  "expert",
] as const satisfies readonly ApplicationTargetType[];

export const APPLICATION_STATUSES = [
  "new",
  "reviewing",
  "accepted",
  "rejected",
  "closed",
] as const satisfies readonly ApplicationStatus[];

export const applicationTargetLabels: Record<ApplicationTargetType, string> = {
  project: "Проект",
  opportunity: "Возможность",
  investment: "Инвестиции",
  expert: "Эксперт",
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  new: "Новая",
  reviewing: "На рассмотрении",
  accepted: "Принята",
  rejected: "Отклонена",
  closed: "Закрыта",
};

export const ownerActionStatuses = [
  "reviewing",
  "accepted",
  "rejected",
  "closed",
] as const satisfies readonly ApplicationStatus[];
