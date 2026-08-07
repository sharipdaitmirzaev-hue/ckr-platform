/**
 * Public Website Packaging & Marketplace Launch — этап 65.
 * Упаковка существующих возможностей в понятные публичные сценарии.
 */

/** Публичные категории услуг (маппинг на существующие ServiceCategory). */
export const PUBLIC_SERVICE_PACKAGES = [
  {
    id: "business_audit",
    label: "Аудит бизнеса",
    description:
      "Диагностика ситуации: сильные стороны, риски и следующий шаг в ЦКР.",
    href: "/lia?scenario=business_audit",
    serviceCategories: ["consulting"] as const,
    cta: "Получить аудит",
  },
  {
    id: "project_support",
    label: "Сопровождение проектов",
    description:
      "Ведение этапов, сделок и коммуникаций проекта до результата.",
    href: "/services?category=project_support",
    serviceCategories: ["project_support", "business_plan"] as const,
    cta: "Смотреть услуги",
  },
  {
    id: "partners",
    label: "Поиск партнёров",
    description:
      "Подбор организаций и партнёров экосистемы под задачу проекта.",
    href: "/services?category=marketing",
    serviceCategories: ["marketing"] as const,
    cta: "Найти партнёров",
  },
  {
    id: "expertise",
    label: "Экспертиза",
    description:
      "Экспертное и юридическое сопровождение договорённостей и проектов.",
    href: "/services?category=legal",
    serviceCategories: ["legal"] as const,
    cta: "К экспертам",
  },
  {
    id: "investment_support",
    label: "Инвестиционное сопровождение",
    description:
      "Подбор инвестиционных предложений и подготовка к переговорам.",
    href: "/services?category=investment_search",
    serviceCategories: ["investment_search"] as const,
    cta: "К инвестициям",
  },
] as const;

/** Путь предпринимателя на /entrepreneur. */
export const ENTREPRENEUR_PUBLIC_PATH = [
  "Идея",
  "Анализ",
  "Проект",
  "Эксперты",
  "Партнёры",
  "Развитие",
] as const;

/** Инвестор — блоки на лендинге. */
export const INVESTOR_PUBLIC_BLOCKS = [
  {
    title: "Проекты",
    text: "Каталог опубликованных проектов с фильтрами по стадии и региону.",
    href: "/projects",
  },
  {
    title: "Возможности",
    text: "Ресурсы и партнёрские предложения рядом с проектами.",
    href: "/opportunities",
  },
  {
    title: "Аналитика",
    text: "Прозрачные статусы и история взаимодействий в кабинете.",
    href: "/dashboard",
  },
  {
    title: "Интересы",
    text: "Отметьте интерес к проекту или предложению — без выхода из ЦКР.",
    href: "/investments",
  },
] as const;

export const EXPERT_PUBLIC_BLOCKS = [
  {
    title: "Участие в проектах",
    text: "Заявки от предпринимателей и сопровождение в workspace.",
    href: "/projects",
  },
  {
    title: "Компетенции",
    text: "Публичный профиль со специализацией и опытом.",
    href: "/experts",
  },
  {
    title: "Репутация",
    text: "Верификация и доверие внутри экосистемы ЦКР.",
    href: "/trust",
  },
] as const;

export const ORGANIZATION_PUBLIC_BLOCKS = [
  {
    title: "Партнёрство",
    text: "Профиль организации и партнёрский кабинет.",
    href: "/partner",
  },
  {
    title: "Проекты",
    text: "Проекты развития компании в каталоге ЦКР.",
    href: "/projects",
  },
  {
    title: "Возможности",
    text: "Предложения ресурсов и поиск партнёров.",
    href: "/opportunities",
  },
] as const;

/** Конверсионные точки публичного сайта. */
export const PUBLIC_CONVERSION_POINTS = [
  {
    id: "hero_audit",
    label: "Получить аудит бизнеса",
    href: "/lia?scenario=business_audit",
  },
  {
    id: "hero_project",
    label: "Разместить проект",
    href: "/register?next=/dashboard/projects/create",
  },
  {
    id: "hero_opportunities",
    label: "Найти возможности",
    href: "/opportunities",
  },
  {
    id: "lia_entry",
    label: "Первый вход через Лию",
    href: "/lia?scenario=business_audit",
  },
  {
    id: "register",
    label: "Регистрация",
    href: "/register",
  },
] as const;
