/** Open Beta Growth — этап 56: рост и удержание после Open Beta. */

export const RETENTION_DAYS = [1, 7, 14, 30] as const;

export type RetentionDay = (typeof RETENTION_DAYS)[number];

export type GrowthRoleKey =
  | "entrepreneurs"
  | "experts"
  | "investors"
  | "organizations";

export const GROWTH_ROLE_LABELS: Record<GrowthRoleKey, string> = {
  entrepreneurs: "Предприниматели",
  experts: "Эксперты",
  investors: "Инвесторы",
  organizations: "Организации",
};

/** Цепочки ценных действий (только аналитика). */
export const VALUABLE_ACTION_CHAINS = [
  {
    id: "lia_to_application",
    label: "Лия → Проект → Эксперт → Заявка",
    steps: [
      "lia_started",
      "project_created",
      "first_object_created",
      "application_created",
    ] as const,
  },
  {
    id: "project_to_interest",
    label: "Просмотр проекта → Интерес → Контакт",
    steps: [
      "public_page_view",
      "investment_interest_created",
      "application_created",
    ] as const,
  },
  {
    id: "expert_loop",
    label: "Профиль эксперта → Запрос → Взаимодействие",
    steps: [
      "expert_profile_created",
      "application_created",
      "first_application",
    ] as const,
  },
] as const;

/** Решение после анализа роста Open Beta. */
export const OPEN_BETA_GROWTH_DECISIONS = [
  "scale_public",
  "continue_growth",
  "improve_retention",
] as const;

export type OpenBetaGrowthDecision =
  (typeof OPEN_BETA_GROWTH_DECISIONS)[number];

export const openBetaGrowthDecisionLabels: Record<
  OpenBetaGrowthDecision,
  string
> = {
  scale_public: "Масштабировать public",
  continue_growth: "Продолжить рост",
  improve_retention: "Улучшить удержание",
};

export const openBetaGrowthDecisionHints: Record<
  OpenBetaGrowthDecision,
  string
> = {
  scale_public:
    "Удержание и ценность ролей достаточны для расширения публичного доступа.",
  continue_growth:
    "Держать Open Beta Wave: наращивать когорту и укреплять связи.",
  improve_retention:
    "Сначала закрыть drop-off и усилить действия, связанные с возвратом.",
};

export function isOpenBetaGrowthDecision(
  value: string,
): value is OpenBetaGrowthDecision {
  return (OPEN_BETA_GROWTH_DECISIONS as readonly string[]).includes(value);
}

/** Критерии масштабирования (рекомендация). */
export const GROWTH_SCALE_CRITERIA = [
  "D7 retention ≥ 25%",
  "D30 retention ≥ 15%",
  "≥40% вернувшихся использовали Лию или создали объект",
  "Есть заявки / интересы / сделки в экосистеме",
  "Critical issues = 0",
] as const;
