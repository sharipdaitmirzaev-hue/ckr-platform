import { ASSIGNABLE_ROLES, type AssignableRole } from "@/config/roles";

export const BETA_INVITE_STATUSES = [
  "created",
  "sent",
  "used",
  "expired",
] as const;

export type BetaInviteStatus = (typeof BETA_INVITE_STATUSES)[number];

export const betaInviteStatusLabels: Record<BetaInviteStatus, string> = {
  created: "Создано",
  sent: "Отправлено",
  used: "Использовано",
  expired: "Отключено",
};

export const FEEDBACK_TYPES = [
  "bug",
  "idea",
  "question",
  "review",
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const feedbackTypeLabels: Record<FeedbackType, string> = {
  bug: "Ошибка",
  idea: "Идея",
  question: "Вопрос",
  review: "Отзыв",
};

export const USER_FEEDBACK_EVENT_TYPES = [
  "project_created",
  "application_sent",
  "opportunity_created",
  "investment_created",
] as const;

export type UserFeedbackEventType =
  (typeof USER_FEEDBACK_EVENT_TYPES)[number];

export const userFeedbackEventLabels: Record<UserFeedbackEventType, string> = {
  project_created: "Создание проекта",
  application_sent: "Отправка заявки",
  opportunity_created: "Создание возможности",
  investment_created: "Создание инвестиции",
};

export const betaInviteRoles = ASSIGNABLE_ROLES;

export function isBetaInviteRole(value: string): value is AssignableRole {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

/** Требовать invite code при регистрации. */
export function isInviteRequired(): boolean {
  return process.env.NEXT_PUBLIC_BETA_REQUIRE_INVITE === "true";
}

export function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CKR-";
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}
