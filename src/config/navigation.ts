export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

/**
 * Catalog / deep public sections — SEO + footer «Ещё на сайте».
 * Not shown as heavy primary nav (Stage 4I + UX B).
 */
export const mainNav: NavItem[] = [
  {
    label: "Проекты",
    href: "/projects",
    description: "Бизнес-идеи и проекты, ищущие ресурсы и партнёров",
  },
  {
    label: "Возможности",
    href: "/opportunities",
    description: "Земля, помещения, оборудование, готовый бизнес",
  },
  {
    label: "Инвестиции",
    href: "/investments",
    description: "Инвестиционные предложения и интересы капитала",
  },
  {
    label: "Эксперты",
    href: "/experts",
    description: "Проверенные компетенции для сопровождения проектов",
  },
  {
    label: "Как работает",
    href: "/how-it-works",
    description: "Путь от идеи до сделки в экосистеме ЦКР",
  },
  {
    label: "Кейсы",
    href: "/cases",
    description: "ТИНДА и публичные результаты на платформе",
  },
  {
    label: "Доверие",
    href: "/trust",
    description: "Что такое ЦКР, как работает и принципы доверия",
  },
  {
    label: "О ЦКР",
    href: "/about",
    description: "Миссия и подход ЦКР",
  },
];

/** Stage 4I — light public header. */
export const publicNav: NavItem[] = [
  { label: "О ЦКР", href: "/about", description: "Миссия и подход ЦКР" },
  { label: "Контакты", href: "/contacts", description: "Связь с ЦКР" },
];

/**
 * UX B — Client primary nav (BASIC / STANDARD / ADVANCED share the same top level).
 * Power tools → dashboardNavMore (Ещё / Инструменты). Deep links preserved.
 */
export const dashboardNavPrimary: NavItem[] = [
  { label: "Главная", href: "/dashboard" },
  { label: "Обращения", href: "/dashboard/ckr-requests" },
  { label: "Возможности", href: "/dashboard/for-you" },
  { label: "Профиль", href: "/dashboard/settings" },
];

/** ADVANCED / power — not top-level; shown under «Ещё». Routes kept. */
export const dashboardNavMore: NavItem[] = [
  { label: "Что вам нужно", href: "/dashboard/needs" },
  { label: "Уведомления", href: "/dashboard/notifications" },
  { label: "Мои проекты", href: "/dashboard/projects" },
  { label: "Мои предложения", href: "/dashboard/opportunities" },
  { label: "Мои инвестиции", href: "/dashboard/investments" },
  { label: "Профиль эксперта", href: "/dashboard/expert" },
  { label: "Отклики", href: "/dashboard/applications" },
  { label: "Сообщения", href: "/messages" },
  { label: "Документы", href: "/dashboard/documents" },
];

/** @deprecated — use dashboardNavPrimary + resolveDashboardNav */
export const dashboardNavBasic: NavItem[] = [
  { label: "Главная", href: "/dashboard" },
  { label: "Обращения", href: "/dashboard/ckr-requests" },
  { label: "Профиль", href: "/dashboard/settings" },
];

/** @deprecated — use dashboardNavPrimary */
export const dashboardNavStandard: NavItem[] = [
  { label: "Главная", href: "/dashboard" },
  { label: "Обращения", href: "/dashboard/ckr-requests" },
  { label: "Компания", href: "/partner" },
  { label: "Возможности", href: "/dashboard/for-you" },
  { label: "Профиль", href: "/dashboard/settings" },
];

/** @deprecated — primary + more */
export const dashboardNavAdvanced: NavItem[] = [
  ...dashboardNavPrimary.slice(0, 3),
  { label: "Компания", href: "/partner" },
  ...dashboardNavMore,
  { label: "Профиль", href: "/dashboard/settings" },
];

/** @deprecated alias */
export const dashboardNav = dashboardNavAdvanced;

export const authNav = {
  login: { label: "Войти", href: "/login" },
  register: { label: "Регистрация", href: "/register" },
  dashboard: { label: "Кабинет", href: "/dashboard" },
  idea: { label: "Расскажите нам вашу идею", href: "/idea" },
  newRequest: { label: "Новое обращение", href: "/idea" },
} as const;

export const adminNav: NavItem[] = [
  {
    label: "Кабинет владельца",
    href: "/admin/owner",
    description: "Сводка владельца платформы ЦКР",
  },
];

/** UX B — Operator primary (day-to-day). */
export const operatorPrimaryNav: NavItem[] = [
  { label: "Главная", href: "/admin/owner" },
  { label: "Заявки", href: "/admin/owner/inbox" },
  { label: "Компании", href: "/admin/owner/companies" },
  { label: "Возможности", href: "/admin/owner/lia/opportunities" },
  { label: "Поиск", href: "/admin/owner/discovery" },
  { label: "Задачи", href: "/operator/tasks" },
];

/** UX B — System tools (Ещё → Система). Deep links preserved. */
export const operatorSystemNav: NavItem[] = [
  {
    label: "Лия — поиск",
    href: "/admin/owner/lia",
    description: "Поиск и проверка внешних сигналов",
  },
  {
    label: "К публикации",
    href: "/admin/owner/publishing",
    description: "Проверка перед показом клиенту",
  },
  {
    label: "Диагностика ленты",
    href: "/admin/owner/feed",
    description: "Служебная проверка подборок",
  },
  {
    label: "Связи",
    href: "/admin/owner/graph",
    description: "Служебный граф связей",
  },
  {
    label: "Регионы",
    href: "/admin/owner/regional",
    description: "Региональное покрытие",
  },
  {
    label: "Чего не хватает",
    href: "/admin/owner/content-gap",
    description: "Пробелы в базе ЦКР",
  },
  {
    label: "Источники",
    href: "/admin/owner/lia/sources",
    description: "Состояние источников",
  },
  {
    label: "CRM",
    href: "/admin/crm",
    description: "Контакты и лиды",
  },
  {
    label: "Операционный центр",
    href: "/operator",
    description: "Очередь и SLA",
  },
  {
    label: "Обзор платформы",
    href: "/admin/dashboard",
    description: "Сводка по платформе",
  },
  {
    label: "Аналитика",
    href: "/admin/analytics",
    description: "Показатели платформы",
  },
  {
    label: "Результаты",
    href: "/admin/results",
  },
  {
    label: "Продуктовые тесты",
    href: "/admin/product-tests",
  },
  {
    label: "Пользователи",
    href: "/admin/users",
    description: "Роли и доступ",
  },
  {
    label: "Модерация проектов",
    href: "/admin/projects",
  },
  {
    label: "Модерация возможностей",
    href: "/admin/opportunities",
  },
  {
    label: "Модерация инвестиций",
    href: "/admin/investments",
  },
  {
    label: "Эксперты",
    href: "/admin/experts",
  },
  {
    label: "Проверки",
    href: "/admin/verifications",
  },
  {
    label: "Приглашения",
    href: "/admin/invites",
  },
  {
    label: "Улучшения",
    href: "/admin/improvements",
  },
  {
    label: "Архив запусков",
    href: "/admin/public-launch",
    description: "Stage / launch dashboards",
  },
  {
    label: "Growth",
    href: "/admin/growth",
  },
  {
    label: "Pilot / Beta архив",
    href: "/admin/pilot",
    description: "Closed pilot и beta отчёты",
  },
];
