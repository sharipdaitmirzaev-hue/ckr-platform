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
    label: "Лия",
    href: "/lia",
    description: "ИИ-навигатор: идея → ресурсы → решение",
  },
  {
    label: "О ЦКР",
    href: "/about",
    description: "Миссия и подход ЦКР",
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
    label: "Кабинет владельца",
    href: "/admin/owner",
    description: "Сводка владельца платформы ЦКР",
  },
];
