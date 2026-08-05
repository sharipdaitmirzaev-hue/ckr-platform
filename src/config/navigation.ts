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
    label: "Решения",
    href: "/solutions",
    description: "Комплексные предложения для реализации проектов",
  },
  {
    label: "Тарифы",
    href: "/pricing",
    description: "Подписки ЦКР: доступ к возможностям и сопровождению",
  },
  {
    label: "Услуги",
    href: "/services",
    description: "Профессиональные услуги ЦКР для реализации проектов",
  },
  {
    label: "Лия",
    href: "/lia",
    description: "ИИ-навигатор: идея → ресурсы → решение",
  },
  {
    label: "О платформе",
    href: "/about",
    description: "Миссия и подход ЦКР",
  },
  {
    label: "Функции",
    href: "/features",
    description: "Лия, проекты, инвестиции, сделки и сопровождение",
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
