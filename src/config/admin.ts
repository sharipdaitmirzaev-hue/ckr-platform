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
    label: "Результаты",
    href: "/admin/results",
    description: "Итоги проектов и эффективность ЦКР",
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
    label: "Closed Pilot",
    href: "/admin/pilot",
    description: "Метрики, участники и проблемы пилота",
  },
  {
    label: "Beta Report",
    href: "/admin/beta-report",
    description: "Controlled beta: воронка и активность",
  },
  {
    label: "Beta Review",
    href: "/admin/beta-review",
    description: "Анализ beta и готовность к public launch",
  },
  {
    label: "Launch",
    href: "/admin/launch",
    description: "Closed Wave 1 — ТИНДА: цели и прогресс",
  },
  {
    label: "Улучшения",
    href: "/admin/improvements",
    description: "Цикл улучшений: feedback → issues → product",
  },
  {
    label: "CRM",
    href: "/admin/crm",
    description: "Контакты, лиды, задачи команды ЦКР",
  },
  {
    label: "Операционный центр",
    href: "/operator",
    description: "Очередь, задачи, SLA, insights",
  },
  {
    label: "Партнёры",
    href: "/partner",
    description: "Кабинет организаций партнёрской сети",
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
