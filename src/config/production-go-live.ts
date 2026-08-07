/**
 * Production Deployment & Go-Live — этап 64.
 * Операционные чеклисты и статусы перед полноценной эксплуатацией.
 * Новые бизнес-модули не добавляются.
 */

export type ServiceHealthStatus = "healthy" | "warning" | "error";

export type ChecklistItemStatus = "pass" | "warn" | "fail" | "manual";

export const PRODUCTION_SERVICE_IDS = [
  "database",
  "authentication",
  "storage",
  "analytics",
  "notifications",
  "lia",
] as const;

export type ProductionServiceId = (typeof PRODUCTION_SERVICE_IDS)[number];

export const productionServiceLabels: Record<ProductionServiceId, string> = {
  database: "Database",
  authentication: "Authentication",
  storage: "Storage",
  analytics: "Analytics",
  notifications: "Notifications",
  lia: "AI / Lia",
};

/** ProductionDeploymentChecklist — разделы. */
export const DEPLOYMENT_CHECKLIST_SECTIONS = [
  {
    id: "infrastructure",
    label: "Infrastructure",
    items: [
      {
        id: "hosting",
        label: "Hosting",
        detail: "Next.js на production-хостинге (Vercel / Node / Docker).",
        href: "/docs/deployment.md",
      },
      {
        id: "database",
        label: "Database",
        detail: "Supabase Postgres доступен, миграции применены.",
        href: "/admin/system-health",
      },
      {
        id: "env_vars",
        label: "Environment variables",
        detail: "Secrets по docs/deployment.md; demo mode выключен.",
        href: "/admin/system-health",
      },
      {
        id: "domain",
        label: "Domain",
        detail: "NEXT_PUBLIC_SITE_URL указывает на production-домен.",
        href: "/",
      },
      {
        id: "ssl",
        label: "SSL",
        detail: "HTTPS на каноническом домене (хостинг / CDN).",
        href: "/",
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    items: [
      {
        id: "rls",
        label: "RLS",
        detail: "RLS включён на бизнес-таблицах; см. security-audit.md.",
        href: "/admin/system-health",
      },
      {
        id: "permissions",
        label: "Permissions",
        detail: "Роли admin / staff / user / organization разграничены.",
        href: "/admin/system-health",
      },
      {
        id: "admin_access",
        label: "Admin access",
        detail: "Админ-аккаунт создан вручную, полный доступ проверен.",
        href: "/admin/dashboard",
      },
      {
        id: "staff_access",
        label: "Staff access",
        detail: "Оператор: CRM, модерация, операции — без полного admin.",
        href: "/admin/crm",
      },
    ],
  },
  {
    id: "product",
    label: "Product",
    items: [
      {
        id: "registration",
        label: "Registration",
        detail: "Регистрация и выбор роли работают.",
        href: "/register",
      },
      {
        id: "onboarding",
        label: "Onboarding",
        detail: "Первый шаг по роли доступен.",
        href: "/onboarding",
      },
      {
        id: "projects",
        label: "Projects",
        detail: "Создание и просмотр проектов.",
        href: "/projects",
      },
      {
        id: "experts",
        label: "Experts",
        detail: "Каталог и профили экспертов.",
        href: "/experts",
      },
      {
        id: "investments",
        label: "Investments",
        detail: "Инвестиционные предложения и интерес.",
        href: "/investments",
      },
      {
        id: "deals",
        label: "Deals",
        detail: "Сделки и workspace доступны staff/участникам.",
        href: "/admin/revenue",
      },
      {
        id: "lia",
        label: "Lia",
        detail: "Сценарии Лии доступны (только рекомендации).",
        href: "/lia",
      },
    ],
  },
  {
    id: "business",
    label: "Business",
    items: [
      {
        id: "services",
        label: "Services",
        detail: "Стартовый набор услуг ЦКР (цены по запросу).",
        href: "/admin/revenue",
      },
      {
        id: "revenue",
        label: "Revenue",
        detail: "Revenue pipeline и revenue_status на deals.",
        href: "/admin/revenue",
      },
      {
        id: "crm",
        label: "CRM",
        detail: "CRM контакты, лиды, задачи операторов.",
        href: "/admin/crm",
      },
    ],
  },
] as const;

export type DeploymentChecklistSectionId =
  (typeof DEPLOYMENT_CHECKLIST_SECTIONS)[number]["id"];

/** ProductionSmokeTest — сценарии ролей. */
export const SMOKE_TEST_FLOWS = [
  {
    id: "entrepreneur",
    label: "Предприниматель",
    steps: [
      { id: "register", label: "Регистрация", href: "/register" },
      { id: "profile", label: "Профиль", href: "/dashboard" },
      { id: "lia", label: "Лия", href: "/lia" },
      { id: "project", label: "Создание проекта", href: "/projects/new" },
    ],
  },
  {
    id: "expert",
    label: "Эксперт",
    steps: [
      { id: "register", label: "Регистрация", href: "/register" },
      { id: "profile", label: "Профиль", href: "/dashboard" },
      { id: "verification", label: "Верификация", href: "/experts" },
    ],
  },
  {
    id: "investor",
    label: "Инвестор",
    steps: [
      { id: "register", label: "Регистрация", href: "/register" },
      { id: "view_project", label: "Просмотр проекта", href: "/projects" },
      { id: "interest", label: "Интерес", href: "/investments" },
    ],
  },
  {
    id: "organization",
    label: "Организация",
    steps: [
      { id: "register", label: "Регистрация", href: "/register" },
      { id: "profile", label: "Профиль", href: "/partner" },
      { id: "partnership", label: "Партнёрство", href: "/admin/partnerships" },
    ],
  },
] as const;

export type SmokeFlowId = (typeof SMOKE_TEST_FLOWS)[number]["id"];

/** AccessAudit — роли и ожидания. */
export const ACCESS_AUDIT_CHECKS = [
  {
    id: "admin",
    label: "Admin",
    expectation: "Полный доступ к /admin и операциям платформы.",
    checks: ["admin dashboard", "system-health", "users", "CRM"],
  },
  {
    id: "staff",
    label: "Staff",
    expectation: "CRM, модерация, операции — без полного admin.",
    checks: ["CRM", "verifications", "revenue (staff)", "operator"],
  },
  {
    id: "user",
    label: "User",
    expectation: "Только свои данные (профиль, проекты, документы).",
    checks: ["RLS profiles", "RLS projects", "RLS documents"],
  },
  {
    id: "organization",
    label: "Organization",
    expectation: "Только свои проекты / партнёрский контур.",
    checks: ["partner cabinet", "organization projects", "partnerships"],
  },
] as const;

/** События analytics для production-проверки. */
export const PRODUCTION_ANALYTICS_EVENTS = [
  {
    id: "registration_completed",
    label: "registration_completed",
    aliases: ["registration_completed", "user_registered", "public_registration"],
  },
  {
    id: "project_created",
    label: "project_created",
    aliases: ["project_created", "first_project_created", "first_project"],
  },
  {
    id: "project_published",
    label: "project_published",
    aliases: ["project_published", "project_published_from_acquisition"],
  },
  {
    id: "lia_used",
    label: "lia_used",
    aliases: ["lia_used", "lia_started", "lia_first_used", "first_lia_use"],
  },
  {
    id: "application_sent",
    label: "application_sent",
    aliases: ["application_sent", "first_application_sent"],
  },
  {
    id: "deal_created",
    label: "deal_created",
    aliases: ["deal_created"],
  },
  {
    id: "revenue_events",
    label: "revenue events",
    aliases: [
      "deal_created",
      "deal_completed",
      "partner_result_created",
      "financial_metric_updated",
    ],
  },
] as const;

/** RecoveryChecklist. */
export const RECOVERY_CHECKLIST_ITEMS = [
  {
    id: "backup_database",
    label: "Backup database",
    detail: "Автобэкапы Supabase / pg_dump по docs/backup.md.",
  },
  {
    id: "restore_database",
    label: "Восстановление БД",
    detail: "Runbook restore проверен на staging (PITR или dump).",
  },
  {
    id: "storage",
    label: "Storage",
    detail: "Бакет documents и метаданные documents синхронизированы.",
  },
  {
    id: "documents",
    label: "Документы",
    detail: "Проверка доступа к загруженным файлам после restore.",
  },
] as const;

/** ProductionLaunchDecision. */
export const PRODUCTION_LAUNCH_DECISIONS = [
  "go_live",
  "hold",
  "rollback",
] as const;

export type ProductionLaunchDecision =
  (typeof PRODUCTION_LAUNCH_DECISIONS)[number];

export const PRODUCTION_LAUNCH_DECISION_CHOICES = PRODUCTION_LAUNCH_DECISIONS;

export const productionLaunchDecisionLabels: Record<
  ProductionLaunchDecision,
  string
> = {
  go_live: "Go-Live — запуск production",
  hold: "Hold — отложить запуск",
  rollback: "Rollback — откат",
};

export const productionLaunchDecisionHints: Record<
  ProductionLaunchDecision,
  string
> = {
  go_live:
    "Инфраструктура, безопасность, smoke и аналитика в порядке — можно открывать реальных пользователей.",
  hold: "Есть warning/блокеры: закрыть пункты checklist и smoke перед go-live.",
  rollback:
    "Критические ошибки сервисов или безопасности — откатить деплой / восстановить из backup.",
};

export function isProductionLaunchDecision(
  value: string,
): value is ProductionLaunchDecision {
  return (PRODUCTION_LAUNCH_DECISIONS as readonly string[]).includes(value);
}

export const PRODUCTION_GO_LIVE_CRITERIA = [
  "Services без error (database, auth, storage, analytics, notifications, Lia)",
  "Demo mode выключен в production",
  "Deployment checklist: Infrastructure + Security без fail",
  "Smoke-сценарии ролей не в fail",
  "AccessAudit / RLS без блокирующих сигналов",
  "Ключевые analytics-события поступают",
  "RecoveryChecklist согласован (backup + restore plan)",
] as const;
