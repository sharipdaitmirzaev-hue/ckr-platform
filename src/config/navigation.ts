export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

/**
 * Catalog / deep public sections — still available by URL and footer.
 * Not shown as heavy primary nav on public chrome (Stage 4I).
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

/** Stage 4I — light public header (no marketplace clutter). */
export const publicNav: NavItem[] = [
  { label: "О ЦКР", href: "/about", description: "Миссия и подход ЦКР" },
  { label: "Контакты", href: "/contacts", description: "Связь с ЦКР" },
];

/** Stage 4H — BASIC cabinet (default for new users). */
export const dashboardNavBasic: NavItem[] = [
  { label: "Главная", href: "/dashboard" },
  { label: "Мои обращения", href: "/dashboard/ckr-requests" },
  { label: "Расскажите идею", href: "/idea" },
  { label: "Профиль", href: "/dashboard/settings" },
];

/** STANDARD — after CKR review / when needs or company exist. */
export const dashboardNavStandard: NavItem[] = [
  ...dashboardNavBasic,
  { label: "Моя компания", href: "/partner" },
  { label: "Что вам нужно", href: "/dashboard/needs" },
  { label: "Возможности для вас", href: "/dashboard/for-you" },
  { label: "Уведомления", href: "/dashboard/notifications" },
];

/** ADVANCED — full platform tools (existing catalog kept). */
export const dashboardNavAdvanced: NavItem[] = [
  { label: "Главная", href: "/dashboard" },
  { label: "Мои обращения", href: "/dashboard/ckr-requests" },
  { label: "Расскажите идею", href: "/idea" },
  { label: "Моя компания", href: "/partner" },
  { label: "Мои проекты", href: "/dashboard/projects" },
  { label: "Что вам нужно", href: "/dashboard/needs" },
  { label: "Возможности для вас", href: "/dashboard/for-you" },
  { label: "Мои возможности", href: "/dashboard/opportunities" },
  { label: "Мои инвестиции", href: "/dashboard/investments" },
  { label: "Профиль эксперта", href: "/dashboard/expert" },
  { label: "Заявки marketplace", href: "/dashboard/applications" },
  { label: "Уведомления", href: "/dashboard/notifications" },
  { label: "Сообщения", href: "/messages" },
  { label: "Документы", href: "/dashboard/documents" },
  { label: "Профиль", href: "/dashboard/settings" },
];

/** @deprecated alias — prefer resolveDashboardNav() */
export const dashboardNav = dashboardNavAdvanced;

export const authNav = {
  login: { label: "Войти", href: "/login" },
  register: { label: "Регистрация", href: "/register" },
  dashboard: { label: "Кабинет", href: "/dashboard" },
  idea: { label: "Расскажите нам вашу идею", href: "/idea" },
} as const;

export const adminNav: NavItem[] = [
  {
    label: "Кабинет владельца",
    href: "/admin/owner",
    description: "Сводка владельца платформы ЦКР",
  },
];
