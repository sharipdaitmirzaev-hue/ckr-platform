/**
 * Public Launch Decision Gate — этап 57.
 * Готовность к полноценному публичному запуску после Open Beta.
 */

import type { ReadinessStatus } from "@/config/open-beta-readiness";

export type { ReadinessStatus };

/** Product Readiness — поверхности перед public. */
export const PUBLIC_PRODUCT_CHECKS = [
  {
    id: "public_site",
    label: "Публичный сайт",
    href: "/",
    readyDetail: "Главная, /trust, /how-it-works, /cases доступны.",
  },
  {
    id: "catalogs",
    label: "Каталоги",
    href: "/projects",
    readyDetail: "/projects, /experts, /investments, /opportunities.",
  },
  {
    id: "object_cards",
    label: "Карточки",
    href: "/projects",
    readyDetail: "Карточки проектов, экспертов, инвестиций, возможностей.",
  },
  {
    id: "registration",
    label: "Регистрация",
    href: "/register",
    readyDetail: "Путь регистрации и выбора роли работает.",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    href: "/onboarding",
    readyDetail: "Первый шаг по роли понятен.",
  },
  {
    id: "lia",
    label: "Лия",
    href: "/lia",
    readyDetail: "Сценарии Лии доступны, только рекомендации.",
  },
  {
    id: "dashboards",
    label: "Кабинеты",
    href: "/dashboard",
    readyDetail: "Кабинеты ролей и партнёра доступны.",
  },
  {
    id: "core_scenarios",
    label: "Основные сценарии",
    href: "/how-it-works",
    readyDetail:
      "Идея → проект → поиск → заявка / интерес → взаимодействие.",
  },
] as const;

/** BusinessLaunchReadiness — бизнес-готовность к public. */
export const BUSINESS_LAUNCH_CHECKS = [
  {
    id: "value_clarity",
    label: "Понятность ценности",
    href: "/trust",
    readyDetail: "Ценность ЦКР сформулирована на публичных страницах.",
  },
  {
    id: "tinda_case",
    label: "Кейс ТИНДА",
    href: "/cases",
    readyDetail: "Кейс ТИНДА и материалы демо доступны.",
  },
  {
    id: "commercial_scenarios",
    label: "Коммерческие сценарии",
    href: "/pricing",
    readyDetail: "Есть понятные коммерческие пути (подписка / услуги).",
  },
  {
    id: "partner_readiness",
    label: "Готовность партнёров",
    href: "/partner",
    readyDetail: "Партнёрский кабинет и организации готовы к росту.",
  },
  {
    id: "monetization",
    label: "Модель монетизации",
    href: "/pricing",
    readyDetail: "Модель монетизации описана; без новых модулей.",
  },
] as const;

export const LAUNCH_RISK_CATEGORIES = [
  "Product",
  "Technical",
  "User",
  "Business",
  "Ecosystem",
] as const;

export type LaunchRiskCategory = (typeof LAUNCH_RISK_CATEGORIES)[number];

export const launchRiskCategoryLabels: Record<LaunchRiskCategory, string> = {
  Product: "Product",
  Technical: "Technical",
  User: "User",
  Business: "Business",
  Ecosystem: "Ecosystem",
};

export const RISK_PROBABILITIES = ["low", "medium", "high"] as const;
export type RiskProbability = (typeof RISK_PROBABILITIES)[number];

export const RISK_IMPACTS = ["low", "medium", "high", "critical"] as const;
export type RiskImpact = (typeof RISK_IMPACTS)[number];

/** Решение Public Launch Decision Gate. */
export const PUBLIC_LAUNCH_DECISIONS = [
  "public_launch",
  "continue_beta",
  "improve_product",
] as const;

export type PublicLaunchDecision =
  (typeof PUBLIC_LAUNCH_DECISIONS)[number];

export const PUBLIC_LAUNCH_DECISION_CHOICES = PUBLIC_LAUNCH_DECISIONS;

export const publicLaunchDecisionLabels: Record<
  PublicLaunchDecision,
  string
> = {
  public_launch: "Публичный запуск",
  continue_beta: "Продолжить beta",
  improve_product: "Улучшить продукт",
};

export const publicLaunchDecisionHints: Record<
  PublicLaunchDecision,
  string
> = {
  public_launch:
    "Продукт, пользователи, экосистема и бизнес готовы к полноценному public.",
  continue_beta:
    "Держать Open Beta: наращивать когорту и укреплять удержание.",
  improve_product:
    "Сначала закрыть блокеры продукта, Critical и слабое удержание.",
};

export function isPublicLaunchDecision(
  value: string,
): value is PublicLaunchDecision {
  return (PUBLIC_LAUNCH_DECISIONS as readonly string[]).includes(value);
}

/** Критерии готовности к public (рекомендация). */
export const PUBLIC_LAUNCH_CRITERIA = [
  "Product / Technical без blocked",
  "Critical issues = 0",
  "D7 retention ≥ 25% и D30 ≥ 15%",
  "Есть реальные связи: заявки / интересы / сделки",
  "BusinessLaunchReadiness без blocked",
  "Нет блокирующих рисков LaunchRiskReview",
] as const;
