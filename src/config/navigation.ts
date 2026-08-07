export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

/** Компактная шапка — ключевые разделы. */
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
    label: "Лия",
    href: "/lia",
    description: "Интеллектуальный помощник ЦКР",
  },
  {
    label: "Услуги",
    href: "/services",
    description: "Аудит, развитие проектов, партнёры и сопровождение",
  },
];

/** Доп. пункты для мобильного меню и футера. */
export const secondaryNav: NavItem[] = [
  { label: "О ЦКР", href: "/about" },
  { label: "Кейсы", href: "/cases" },
  { label: "Доверие", href: "/trust" },
  { label: "Контакты", href: "/contacts" },
  { label: "Предпринимателям", href: "/entrepreneur" },
  { label: "Инвесторам", href: "/investor" },
  { label: "Экспертам", href: "/expert" },
  { label: "Организациям", href: "/organization" },
];

/** Полный список для мобильного меню. */
export const mobileNav: NavItem[] = [...mainNav, ...secondaryNav];

export const dashboardNav: NavItem[] = [
  { label: "Обзор", href: "/dashboard" },
  { label: "Организация", href: "/partner" },
  { label: "Мои проекты", href: "/dashboard/projects" },
  { label: "Мои возможности", href: "/dashboard/opportunities" },
  { label: "Мои инвестиции", href: "/dashboard/investments" },
  { label: "Профиль эксперта", href: "/dashboard/expert" },
  { label: "Заявки", href: "/dashboard/applications" },
  { label: "Уведомления", href: "/dashboard/notifications" },
  { label: "Сообщения", href: "/messages" },
  { label: "Активность", href: "/dashboard/activity" },
  { label: "Оплата", href: "/dashboard/billing" },
  { label: "Интересы", href: "/dashboard/interests" },
  { label: "Документы", href: "/dashboard/documents" },
  { label: "Настройки", href: "/dashboard/settings" },
];

export const authNav = {
  login: { label: "Войти", href: "/login" },
  register: { label: "Регистрация", href: "/register" },
  dashboard: { label: "Кабинет", href: "/dashboard" },
} as const;

export const adminNav: NavItem[] = [
  {
    label: "Админ-панель",
    href: "/admin",
  },
];
