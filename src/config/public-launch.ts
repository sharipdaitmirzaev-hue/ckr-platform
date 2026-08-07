/**
 * Public Launch Wave 1 — этап 58: управление публичным запуском после Decision Gate.
 */

import { PUBLIC_LAUNCH_GOAL_IDS } from "@/config/launch-goals";
import { LAUNCH_WAVE_IDS } from "@/config/launch-waves";

export const PUBLIC_LAUNCH_WAVE_ID = LAUNCH_WAVE_IDS.publicLaunch;

export const PUBLIC_LAUNCH_WAVE_NAME = "Public Launch Wave 1" as const;

export const PUBLIC_LAUNCH_GOAL_ID_MAP = PUBLIC_LAUNCH_GOAL_IDS;

export const PUBLIC_LAUNCH_INVITE_SOURCE = "public_launch_wave" as const;

/**
 * LaunchChannels — каналы привлечения Public Launch.
 * Значения пишутся в beta_invites.channel.
 */
export const LAUNCH_CHANNELS = [
  "referral",
  "partner",
  "events",
  "social",
  "content",
  "email",
] as const;

export type LaunchChannel = (typeof LAUNCH_CHANNELS)[number];

export const launchChannelLabels: Record<LaunchChannel, string> = {
  referral: "Рекомендации",
  partner: "Партнёры",
  events: "Мероприятия",
  social: "Социальные сети",
  content: "Контент",
  email: "Прямые приглашения",
};

export function isLaunchChannel(value: string): value is LaunchChannel {
  return (LAUNCH_CHANNELS as readonly string[]).includes(value);
}

/** Маппинг прочих channel → LaunchChannels для аналитики. */
export function normalizeLaunchChannel(raw: string): LaunchChannel {
  if (isLaunchChannel(raw)) return raw;
  if (raw === "website" || raw === "organic") return "content";
  if (raw === "internal" || raw === "direct") return "email";
  if (raw === "other") return "referral";
  return "email";
}

/** Feedback категория Public Launch. */
export const PUBLIC_LAUNCH_FEEDBACK_CATEGORY = "public_launch" as const;

export const PUBLIC_LAUNCH_FEEDBACK_CATEGORIES = [
  "public_launch",
  "UX",
  "Lia",
  "Project",
  "Expert",
  "Investment",
  "Other",
] as const;

export type PublicLaunchFeedbackCategory =
  (typeof PUBLIC_LAUNCH_FEEDBACK_CATEGORIES)[number];

export const publicLaunchFeedbackCategoryLabels: Record<
  PublicLaunchFeedbackCategory,
  string
> = {
  public_launch: "Public Launch",
  UX: "UX",
  Lia: "Лия",
  Project: "Проект",
  Expert: "Эксперт",
  Investment: "Инвестиции",
  Other: "Другое",
};

/** План первых 90 дней. */
export const PUBLIC_LAUNCH_90_DAYS = [
  {
    id: "days_1_30",
    range: "1-30",
    label: "Дни 1–30",
    goal: "Стабильность и первые пользователи",
    metrics: [
      "регистрации",
      "активация",
      "использование Лии",
      "первые проекты",
    ],
  },
  {
    id: "days_31_60",
    range: "31-60",
    label: "Дни 31–60",
    goal: "Рост экосистемы",
    metrics: ["новые проекты", "эксперты", "партнёры", "заявки"],
  },
  {
    id: "days_61_90",
    range: "61-90",
    label: "Дни 61–90",
    goal: "Масштабирование",
    metrics: ["сделки", "удержание", "коммерческие результаты"],
  },
] as const;

export type PublicLaunch90PhaseId =
  (typeof PUBLIC_LAUNCH_90_DAYS)[number]["id"];

export type PublicLaunchGateMode =
  | "no_decision"
  | "continue_beta"
  | "improve_product"
  | "ready"
  | "active";

export const publicLaunchGateMessages: Record<PublicLaunchGateMode, string> = {
  no_decision:
    "Сначала зафиксируйте PublicLaunchDecision = public_launch на /admin/public-launch-decision.",
  continue_beta:
    "Решение Decision Gate: continue_beta — продолжайте Open Beta, публичный запуск не активируется.",
  improve_product:
    "Решение Decision Gate: improve_product — запуск остановлен, работайте над улучшениями.",
  ready:
    "Решение public_launch зафиксировано. Подтвердите активацию волны Public Launch Wave 1.",
  active: "Public Launch Wave 1 активна. Контролируйте KPI и первые 90 дней.",
};
