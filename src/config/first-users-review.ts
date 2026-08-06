/** First Users Review — этап 51: анализ первой когорты и решение. */

export const FIRST_USERS_REVIEW_FUNNEL = [
  { key: "invited", label: "Приглашено" },
  { key: "registration", label: "Регистрация" },
  { key: "role", label: "Выбор роли" },
  { key: "profile", label: "Заполнение профиля" },
  { key: "first_action", label: "Первое действие" },
  { key: "lia", label: "Использование Лии" },
  { key: "object", label: "Создание объекта" },
] as const;

export type FirstUsersReviewFunnelKey =
  (typeof FIRST_USERS_REVIEW_FUNNEL)[number]["key"];

/** Решение по следующему этапу после First Users Wave. */
export const FIRST_USERS_DECISIONS = [
  "continue_closed",
  "expand_beta",
  "prepare_public",
] as const;

export type FirstUsersDecision = (typeof FIRST_USERS_DECISIONS)[number];

export const firstUsersDecisionLabels: Record<FirstUsersDecision, string> = {
  continue_closed: "Продолжить closed",
  expand_beta: "Расширить beta",
  prepare_public: "Готовить public",
};

export const firstUsersDecisionHints: Record<FirstUsersDecision, string> = {
  continue_closed:
    "Держать First Users Wave closed: донабрать когорту и закрыть блокеры активации.",
  expand_beta:
    "Расширить beta-доступ: добавить участников при стабильной активации и без critical.",
  prepare_public:
    "Готовить public-контур: метрики когорты и UX достаточны для планирования открытого запуска.",
};

export const ISSUE_PRIORITY_ORDER = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export type IssuePriorityBucket = (typeof ISSUE_PRIORITY_ORDER)[number];

export function isFirstUsersDecision(
  value: string,
): value is FirstUsersDecision {
  return (FIRST_USERS_DECISIONS as readonly string[]).includes(value);
}
