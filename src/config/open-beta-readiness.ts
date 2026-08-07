/** Open Beta Readiness — этап 54: готовность к открытому запуску. */

/** Статусы проверок Product / Technical / Business. */
export const READINESS_STATUSES = [
  "ready",
  "needs_attention",
  "blocked",
] as const;

export type ReadinessStatus = (typeof READINESS_STATUSES)[number];

export const readinessStatusLabels: Record<ReadinessStatus, string> = {
  ready: "Готово",
  needs_attention: "Требует внимания",
  blocked: "Блокер",
};

export type ReadinessCheckItem = {
  id: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
  href?: string;
};

/** Product Readiness — поверхности продукта. */
export const PRODUCT_READINESS_CHECKS = [
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
    label: "Карточки объектов",
    href: "/projects",
    readyDetail: "Презентации /project/[id], /expert/[id] и аналоги.",
  },
  {
    id: "registration",
    label: "Регистрация",
    href: "/register",
    readyDetail: "Путь: Главная → Лия → Регистрация → Роль → Онбординг.",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    href: "/onboarding",
    readyDetail: "Выбор роли и персональный первый шаг.",
  },
  {
    id: "lia",
    label: "Лия",
    href: "/lia",
    readyDetail: "Консультация и сценарии с CTA к действию.",
  },
  {
    id: "dashboard",
    label: "Кабинет",
    href: "/dashboard",
    readyDetail: "Обзор, подсказки первого действия, empty states.",
  },
] as const;

export type UserReadinessRoleKey =
  | "entrepreneurs"
  | "experts"
  | "investors"
  | "organizations";

export const USER_READINESS_ROLES: Record<
  UserReadinessRoleKey,
  { label: string; checks: string[] }
> = {
  entrepreneurs: {
    label: "Предприниматели",
    checks: ["регистрация", "профиль", "проекты", "Лия", "заявки"],
  },
  experts: {
    label: "Эксперты",
    checks: ["профиль", "проверка", "запросы"],
  },
  investors: {
    label: "Инвесторы",
    checks: ["проекты", "интересы"],
  },
  organizations: {
    label: "Организации",
    checks: ["профиль", "возможности"],
  },
};

/** TechnicalChecklist — без новых модулей, только проверки. */
export const TECHNICAL_CHECKLIST_ITEMS = [
  {
    id: "build",
    label: "Build",
    detail: "npm run build — обязателен зелёный перед open beta.",
  },
  {
    id: "lint",
    label: "Lint",
    detail: "npm run lint — без ошибок.",
  },
  {
    id: "errors",
    label: "Ошибки / Critical issues",
    detail: "Нет открытых Critical в pilot_issues / product_improvements.",
  },
  {
    id: "security",
    label: "Безопасность",
    detail: "RLS, auth, docs/security-audit.md и production-checklist.",
  },
  {
    id: "env",
    label: "Environment",
    detail: "Supabase env и секреты production настроены.",
  },
  {
    id: "performance",
    label: "Производительность",
    detail: "Ключевые страницы и каталоги отвечают приемлемо на когорте beta.",
  },
] as const;

/** BusinessReadiness — позиционирование и кейсы. */
export const BUSINESS_READINESS_CHECKS = [
  {
    id: "positioning",
    label: "Позиционирование",
    href: "/trust",
    readyDetail: "Цель ЦКР и путь работы понятны на /trust и главной.",
  },
  {
    id: "roles",
    label: "Роли",
    href: "/how-it-works",
    readyDetail:
      "Предприниматель / эксперт / инвестор / организация — короткие пути.",
  },
  {
    id: "cases",
    label: "Первые кейсы",
    href: "/cases",
    readyDetail: "Есть кейс ТИНДА и материалы для демо.",
  },
  {
    id: "invite_pipeline",
    label: "Кому приглашать",
    href: "/admin/invites",
    readyDetail: "Есть пайплайн приглашений и план волн open beta.",
  },
] as const;

/** Решение открытия Open Beta. */
export const OPEN_BETA_DECISIONS = [
  "open_beta",
  "continue_beta",
  "needs_improvement",
] as const;

export type OpenBetaDecision = (typeof OPEN_BETA_DECISIONS)[number];

export const openBetaDecisionLabels: Record<OpenBetaDecision, string> = {
  open_beta: "Открыть Open Beta",
  continue_beta: "Продолжить закрытую beta",
  needs_improvement: "Нужны улучшения",
};

export const openBetaDecisionHints: Record<OpenBetaDecision, string> = {
  open_beta:
    "Продукт, UX и экосистема достаточны для контролируемого open beta.",
  continue_beta:
    "Держать расширенную закрытую beta: донабрать активацию и связи.",
  needs_improvement:
    "Сначала закрыть блокеры Product/Technical и Critical issues.",
};

export function isOpenBetaDecision(value: string): value is OpenBetaDecision {
  return (OPEN_BETA_DECISIONS as readonly string[]).includes(value);
}
