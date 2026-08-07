/** Product Fix Sprint — этап 52: исправления по First Users Review. */

import type { ProductImprovementPriority } from "@/config/improvements";

/** UI-статусы спринта (completed = released в product_improvements). */
export const SPRINT_UI_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "rejected",
] as const;

export type SprintUiStatus = (typeof SPRINT_UI_STATUSES)[number];

export const sprintUiStatusLabels: Record<SprintUiStatus, string> = {
  planned: "Запланировано",
  in_progress: "В работе",
  completed: "Завершено",
  rejected: "Отклонено",
};

export function mapDbStatusToSprintUi(status: string): SprintUiStatus {
  if (status === "released") return "completed";
  if (status === "in_progress") return "in_progress";
  if (status === "rejected") return "rejected";
  return "planned";
}

export function mapSprintUiToDbStatus(
  status: SprintUiStatus,
): "planned" | "in_progress" | "released" | "rejected" {
  if (status === "completed") return "released";
  return status;
}

/** Влияние на активацию (1–5) для Impact Score. */
export type ActivationImpact = 1 | 2 | 3 | 4 | 5;

/** Сложность исправления (1=легко … 5=сложно); в формуле используется как 1/complexity. */
export type FixComplexity = 1 | 2 | 3 | 4 | 5;

/**
 * Impact Score = users × activationImpact × (6 − complexity)
 * Только рекомендация для приоритизации.
 */
export function computeImpactScore(input: {
  usersAffected: number;
  activationImpact: ActivationImpact;
  complexity: FixComplexity;
}): number {
  const users = Math.max(0, input.usersAffected);
  const ease = 6 - input.complexity;
  return Math.round(users * input.activationImpact * ease * 10) / 10;
}

export const FIRST_PATH_JOURNEY = [
  "Главная",
  "Лия",
  "Регистрация",
  "Роль",
  "Онбординг",
  "Первое действие",
] as const;

/** Понятные пути ролей после Product Fix Sprint. */
export const ROLE_FIX_PATHS = {
  entrepreneur: {
    label: "Предприниматель",
    path: ["Идея", "Проект"] as const,
    hint: "Опишите идею Лие или создайте проект — один понятный следующий шаг.",
    href: "/lia?scenario=business_idea&message=" + encodeURIComponent("У меня есть идея"),
  },
  expert: {
    label: "Эксперт",
    path: ["Профиль", "Доверие", "Запросы"] as const,
    hint: "Заполните профиль, пройдите проверку и принимайте запросы от проектов.",
    href: "/dashboard/expert",
  },
  investor: {
    label: "Инвестор",
    path: ["Проекты", "Интерес"] as const,
    hint: "Откройте каталог проектов и отметьте интерес к подходящим.",
    href: "/projects",
  },
  organization: {
    label: "Организация",
    path: ["Потребность", "Партнёры"] as const,
    hint: "Оформите профиль организации и найдите партнёров в экосистеме.",
    href: "/partner",
  },
} as const;

/**
 * Lia Improvement Notes — без изменения основной логики движка.
 * Подсказки операторам и тексты первого ответа.
 */
export const LIA_IMPROVEMENT_NOTES = [
  {
    id: "clear-first-question",
    title: "Понятность вопросов",
    note: "Первый вопрос сценария должен быть коротким и про действие пользователя («Что хотите сделать?»), без жаргона платформы.",
  },
  {
    id: "strong-first-reply",
    title: "Качество первого ответа",
    note: "Первый ответ Лии: 1) подтвердить задачу, 2) назвать 1–2 следующих шага, 3) дать CTA (создать проект / открыть каталог / заполнить профиль).",
  },
  {
    id: "action-bridge",
    title: "Переход к действию",
    note: "После анализа всегда показывать кнопку или ссылку на конкретное действие роли — не оставлять пользователя в чате без выхода.",
  },
  {
    id: "no-auto-actions",
    title: "Границы Лии",
    note: "Лия только рекомендует. Не создавать заявки и не менять объекты без подтверждения — это уже так; фиксируем в UX-текстах.",
  },
] as const;

/** Типовые проблемы спринта (seed / fallback, если в БД ещё пусто). */
export type SprintSeedIssue = {
  id: string;
  title: string;
  description: string;
  priority: ProductImprovementPriority;
  status: SprintUiStatus;
  source: "feedback" | "pilot_issue" | "analytics" | "first_users_review" | "manual";
  usersAffected: number;
  activationImpact: ActivationImpact;
  complexity: FixComplexity;
  impact: string;
};

export const PRODUCT_FIX_SPRINT_SEEDS: SprintSeedIssue[] = [
  {
    id: "c0000008-0000-4000-8000-000000000001",
    title: "Неясный первый шаг после профиля",
    description:
      "Пользователи останавливаются после онбординга. Нужны явные подсказки «Что хотите сделать?» и путь роли.",
    priority: "critical",
    status: "completed",
    source: "first_users_review",
    usersAffected: 8,
    activationImpact: 5,
    complexity: 2,
    impact: "Прямая потеря на этапе «первое действие»",
  },
  {
    id: "c0000008-0000-4000-8000-000000000002",
    title: "Путь ролей не сформулирован коротко",
    description:
      "Предприниматель / эксперт / инвестор / организация — разные первые действия; нужны короткие цепочки.",
    priority: "critical",
    status: "completed",
    source: "first_users_review",
    usersAffected: 7,
    activationImpact: 5,
    complexity: 2,
    impact: "Путаница в сценариях ролей",
  },
  {
    id: "c0000008-0000-4000-8000-000000000003",
    title: "Лия: слабый мост к действию",
    description:
      "Первый ответ понятен не всегда; нет явного CTA после консультации.",
    priority: "high",
    status: "completed",
    source: "feedback",
    usersAffected: 6,
    activationImpact: 4,
    complexity: 2,
    impact: "Низкое использование Лии → объекта",
  },
  {
    id: "c0000008-0000-4000-8000-000000000004",
    title: "Empty states без следующего шага",
    description:
      "Пустые каталоги/проекты в кабинете не ведут к созданию объекта.",
    priority: "high",
    status: "completed",
    source: "analytics",
    usersAffected: 5,
    activationImpact: 4,
    complexity: 1,
    impact: "Drop-off в кабинете",
  },
  {
    id: "c0000008-0000-4000-8000-000000000005",
    title: "Регистрация: неочевиден путь к Лие",
    description:
      "На /register усилить текст: главная → Лия → регистрация → роль → онбординг → действие.",
    priority: "high",
    status: "completed",
    source: "feedback",
    usersAffected: 5,
    activationImpact: 3,
    complexity: 1,
    impact: "Слабая связка публичного входа и активации",
  },
  {
    id: "c0000008-0000-4000-8000-000000000006",
    title: "Доверие эксперта неочевидно",
    description:
      "Экспертам нужен явный путь Профиль → Доверие → Запросы.",
    priority: "medium",
    status: "in_progress",
    source: "first_users_review",
    usersAffected: 3,
    activationImpact: 3,
    complexity: 3,
    impact: "Медленная активация экспертов",
  },
  {
    id: "c0000008-0000-4000-8000-000000000007",
    title: "Инвестор: интерес спрятан",
    description:
      "Усилить подсказку «Проекты → Интерес» на карточках и в кабинете.",
    priority: "medium",
    status: "planned",
    source: "analytics",
    usersAffected: 2,
    activationImpact: 3,
    complexity: 2,
    impact: "Мало интересов от инвесторов",
  },
  {
    id: "c0000008-0000-4000-8000-000000000008",
    title: "Организация: путь к партнёрам",
    description:
      "Потребность → Партнёры должно быть видно с /partner и /organization.",
    priority: "low",
    status: "planned",
    source: "manual",
    usersAffected: 2,
    activationImpact: 2,
    complexity: 2,
    impact: "Слабая активация организаций",
  },
] as const;
