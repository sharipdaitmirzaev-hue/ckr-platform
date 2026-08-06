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
    label: "Wave Review",
    href: "/admin/wave-review",
    description: "Анализ результатов первой закрытой волны",
  },
  {
    label: "Launch Decision",
    href: "/admin/launch-decision",
    description: "Decision Gate: решение после Closed Wave 1",
  },
  {
    label: "Ecosystem Report",
    href: "/admin/ecosystem-report",
    description: "Wave 2: связи и сетевой эффект экосистемы",
  },
  {
    label: "Ecosystem Value",
    href: "/admin/ecosystem-value",
    description: "Ценность связей и качество совпадений",
  },
  {
    label: "First Users",
    href: "/admin/first-users",
    description: "First Users Wave: приглашения, сценарии, feedback",
  },
  {
    label: "First Users Review",
    href: "/admin/first-users-review",
    description: "Анализ первой когорты и решение по следующей волне",
  },
  {
    label: "Product Fix Sprint",
    href: "/admin/product-sprint",
    description: "Исправления Critical/High по First Users Review",
  },
  {
    label: "Beta Expansion",
    href: "/admin/beta-expansion",
    description: "Расширенная закрытая beta после Product Fix Sprint",
  },
  {
    label: "Open Beta Review",
    href: "/admin/open-beta-review",
    description: "Готовность ЦКР к открытому запуску",
  },
  {
    label: "Open Beta",
    href: "/admin/open-beta",
    description: "Контроль Open Beta Wave 1: доступ, метрики, health",
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
