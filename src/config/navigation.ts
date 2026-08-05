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
    label: "Решения",
    href: "/solutions",
    description: "Комплексные предложения для реализации проектов",
  },
  {
    label: "О платформе",
    href: "/about",
    description: "Миссия и подход ЦКР",
  },
];

export const cabinetNav: NavItem[] = [
  { label: "Обзор", href: "/cabinet" },
  { label: "Мои проекты", href: "/cabinet/projects" },
  { label: "Заявки", href: "/cabinet/applications" },
  { label: "Избранное", href: "/cabinet/favorites" },
  { label: "Документы", href: "/cabinet/documents" },
  { label: "Настройки", href: "/cabinet/settings" },
];

export const authNav = {
  login: { label: "Войти", href: "/login" },
  register: { label: "Регистрация", href: "/register" },
  cabinet: { label: "Кабинет", href: "/cabinet" },
} as const;
