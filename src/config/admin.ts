export type AdminNavItem = {
  label: string;
  href: string;
  description?: string;
};

export const adminNavItems: AdminNavItem[] = [
  {
    label: "Обзор",
    href: "/admin/dashboard",
    description: "Сводка по платформе",
  },
  {
    label: "Аналитика",
    href: "/admin/analytics",
    description: "Показатели и события ЦКР",
  },
  {
    label: "Продуктовые тесты",
    href: "/admin/product-tests",
    description: "Сценарии и контроль качества",
  },
  {
    label: "Приглашения",
    href: "/admin/invites",
    description: "Closed beta: коды доступа",
  },
  {
    label: "Пользователи",
    href: "/admin/users",
    description: "Роли и блокировка",
  },
  {
    label: "Проекты",
    href: "/admin/projects",
    description: "Модерация проектов",
  },
  {
    label: "Возможности",
    href: "/admin/opportunities",
    description: "Модерация возможностей",
  },
  {
    label: "Инвестиции",
    href: "/admin/investments",
    description: "Модерация инвестиций",
  },
  {
    label: "Эксперты",
    href: "/admin/experts",
    description: "Проверка экспертов",
  },
  {
    label: "Проверки",
    href: "/admin/verifications",
    description: "Заявки на верификацию",
  },
];
