export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

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
    label: "Услуги",
    href: "/services",
    description: "Аудит, развитие проектов, партнёры и сопровождение",
  },
  {
    label: "Кейсы",
    href: "/cases",
    description: "ТИНДА и публичные результаты на платформе",
  },
  {
    label: "Лия",
    href: "/lia",
    description: "Интеллектуальный помощник ЦКР",
  },
  {
    label: "О ЦКР",
    href: "/about",
    description: "Миссия, принципы и роли",
  },
  {
    label: "Контакты",
    href: "/contacts",
    description: "Связаться с командой ЦКР",
  },
];

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
    href: "/admin/dashboard",
    description: "Рабочее место оператора ЦКР",
  },
];
