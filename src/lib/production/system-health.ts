/**
 * System Health & Production Go-Live dashboard (этап 64).
 * Пробы окружения, сервисов, чеклистов, smoke, access, analytics, recovery.
 */

import {
  ACCESS_AUDIT_CHECKS,
  DEPLOYMENT_CHECKLIST_SECTIONS,
  PRODUCTION_ANALYTICS_EVENTS,
  PRODUCTION_GO_LIVE_CRITERIA,
  PRODUCTION_SERVICE_IDS,
  RECOVERY_CHECKLIST_ITEMS,
  SMOKE_TEST_FLOWS,
  productionLaunchDecisionHints,
  productionLaunchDecisionLabels,
  productionServiceLabels,
  type ChecklistItemStatus,
  type ProductionLaunchDecision,
  type ProductionServiceId,
  type ServiceHealthStatus,
  type SmokeFlowId,
} from "@/config/production-go-live";
import { platformVersion } from "@/config/version";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ProductionLaunchDecisionRow } from "@/types/database";
import type { LiaProductionReport } from "@/types/lia";

export type EnvironmentBlock = {
  productionStatus: "production" | "development" | "unknown";
  isProductionReady: boolean;
  version: string;
  channel: string;
  buildStatus: "ok" | "warn" | "unknown";
  lastDeployment: string | null;
  siteUrl: string | null;
  demoMode: boolean;
  demoFallback: boolean;
  allowDemoSeed: boolean;
  nodeEnv: string;
  signals: string[];
};

export type ServiceHealthItem = {
  id: ProductionServiceId;
  label: string;
  status: ServiceHealthStatus;
  detail: string;
};

export type ChecklistItemView = {
  id: string;
  label: string;
  detail: string;
  href?: string;
  status: ChecklistItemStatus;
  note: string;
};

export type ChecklistSectionView = {
  id: string;
  label: string;
  items: ChecklistItemView[];
  aggregate: ServiceHealthStatus;
};

export type SmokeStepView = {
  id: string;
  label: string;
  href: string;
  status: ChecklistItemStatus;
  note: string;
};

export type SmokeFlowView = {
  id: SmokeFlowId;
  label: string;
  steps: SmokeStepView[];
  aggregate: ServiceHealthStatus;
};

export type AccessAuditItem = {
  id: string;
  label: string;
  expectation: string;
  checks: string[];
  status: ChecklistItemStatus;
  note: string;
  rlsOk: boolean;
};

export type AnalyticsEventProbe = {
  id: string;
  label: string;
  count: number;
  flowing: boolean;
  aliases: string[];
};

export type RecoveryItemView = {
  id: string;
  label: string;
  detail: string;
  status: ChecklistItemStatus;
  note: string;
};

export type ProductionLaunchDecisionRecord = {
  id: string;
  decision: ProductionLaunchDecision;
  comment: string;
  responsible: string;
  responsibleId: string | null;
  date: string;
};

export type GoLiveSuggestion = {
  suggested: ProductionLaunchDecision;
  readiness: number;
  hint: string;
  indicators: string[];
  problems: string[];
};

export type SystemHealthDashboard = {
  environment: EnvironmentBlock;
  services: ServiceHealthItem[];
  servicesAggregate: ServiceHealthStatus;
  deploymentChecklist: ChecklistSectionView[];
  smokeTests: SmokeFlowView[];
  accessAudit: AccessAuditItem[];
  analytics: AnalyticsEventProbe[];
  analyticsFlowing: boolean;
  recovery: RecoveryItemView[];
  liaReport: LiaProductionReport;
  decision: GoLiveSuggestion;
  latestDecision: ProductionLaunchDecisionRecord | null;
  criteria: readonly string[];
};

function aggregateFromStatuses(
  statuses: Array<ServiceHealthStatus | ChecklistItemStatus>,
): ServiceHealthStatus {
  const mapped = statuses.map((s) => {
    if (s === "error" || s === "fail") return "error" as const;
    if (s === "warning" || s === "warn" || s === "manual") return "warning" as const;
    return "healthy" as const;
  });
  if (mapped.includes("error")) return "error";
  if (mapped.includes("warning")) return "warning";
  return "healthy";
}

function buildEnvironment(): EnvironmentBlock {
  const nodeEnv = process.env.NODE_ENV ?? "unknown";
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const demoFallback = process.env.DEMO_CATALOG_FALLBACK === "true";
  const allowDemoSeed = process.env.ALLOW_DEMO_SEED_IN_PRODUCTION === "true";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || null;
  const isProdNode = nodeEnv === "production";
  const signals: string[] = [];

  if (!hasSupabaseEnv()) signals.push("Supabase env не задан");
  if (demoMode) signals.push("NEXT_PUBLIC_DEMO_MODE=true");
  if (demoFallback) signals.push("DEMO_CATALOG_FALLBACK=true");
  if (allowDemoSeed && isProdNode) {
    signals.push("ALLOW_DEMO_SEED_IN_PRODUCTION=true");
  }
  if (!siteUrl) signals.push("NEXT_PUBLIC_SITE_URL не задан");
  else if (siteUrl.includes("localhost")) {
    signals.push("SITE_URL указывает на localhost");
  }

  const isProductionReady =
    hasSupabaseEnv() &&
    !demoMode &&
    !demoFallback &&
    !(allowDemoSeed && isProdNode) &&
    Boolean(siteUrl) &&
    !siteUrl?.includes("localhost");

  return {
    productionStatus: isProdNode
      ? "production"
      : nodeEnv === "development"
        ? "development"
        : "unknown",
    isProductionReady,
    version: platformVersion.version,
    channel: platformVersion.channel,
    buildStatus: hasSupabaseEnv() ? "ok" : "warn",
    lastDeployment: platformVersion.releasedAt,
    siteUrl,
    demoMode,
    demoFallback,
    allowDemoSeed,
    nodeEnv,
    signals:
      signals.length > 0
        ? signals
        : ["Окружение выглядит готовым к production-проверке"],
  };
}

async function probeServices(): Promise<ServiceHealthItem[]> {
  const items: ServiceHealthItem[] = [];

  if (!hasSupabaseEnv()) {
    return PRODUCTION_SERVICE_IDS.map((id) => ({
      id,
      label: productionServiceLabels[id],
      status: "error" as const,
      detail: "Supabase env отсутствует",
    }));
  }

  const supabase = createClient();

  // database
  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    items.push({
      id: "database",
      label: productionServiceLabels.database,
      status: error ? "error" : "healthy",
      detail: error ? error.message : "profiles доступны",
    });
  } catch (e) {
    items.push({
      id: "database",
      label: productionServiceLabels.database,
      status: "error",
      detail: e instanceof Error ? e.message : "DB probe failed",
    });
  }

  // authentication
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      items.push({
        id: "authentication",
        label: productionServiceLabels.authentication,
        status: "warning",
        detail: `Auth session: ${error.message}`,
      });
    } else {
      items.push({
        id: "authentication",
        label: productionServiceLabels.authentication,
        status: data.user ? "healthy" : "warning",
        detail: data.user
          ? "Сессия staff/admin активна"
          : "Auth доступен, но текущая сессия пуста (ожидаемо вне браузера)",
      });
    }
  } catch (e) {
    items.push({
      id: "authentication",
      label: productionServiceLabels.authentication,
      status: "error",
      detail: e instanceof Error ? e.message : "Auth probe failed",
    });
  }

  // storage (documents metadata + bucket presence via table)
  try {
    const { error } = await supabase.from("documents").select("id").limit(1);
    items.push({
      id: "storage",
      label: productionServiceLabels.storage,
      status: error ? "warning" : "healthy",
      detail: error
        ? `documents: ${error.message}`
        : "Таблица documents доступна (бакет documents — см. backup.md)",
    });
  } catch (e) {
    items.push({
      id: "storage",
      label: productionServiceLabels.storage,
      status: "error",
      detail: e instanceof Error ? e.message : "Storage probe failed",
    });
  }

  // analytics
  try {
    const { count, error } = await supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true });
    items.push({
      id: "analytics",
      label: productionServiceLabels.analytics,
      status: error ? "error" : (count ?? 0) > 0 ? "healthy" : "warning",
      detail: error
        ? error.message
        : `analytics_events: ${count ?? 0} записей`,
    });
  } catch (e) {
    items.push({
      id: "analytics",
      label: productionServiceLabels.analytics,
      status: "error",
      detail: e instanceof Error ? e.message : "Analytics probe failed",
    });
  }

  // notifications
  try {
    const { error } = await supabase
      .from("notifications")
      .select("id")
      .limit(1);
    items.push({
      id: "notifications",
      label: productionServiceLabels.notifications,
      status: error ? "warning" : "healthy",
      detail: error ? error.message : "notifications доступны",
    });
  } catch (e) {
    items.push({
      id: "notifications",
      label: productionServiceLabels.notifications,
      status: "error",
      detail: e instanceof Error ? e.message : "Notifications probe failed",
    });
  }

  // lia
  try {
    const liaProvider = process.env.LIA_PROVIDER ?? "mock";
    const { count, error } = await supabase
      .from("lia_sessions")
      .select("id", { count: "exact", head: true });
    const hasKey =
      liaProvider === "mock" || Boolean(process.env.LIA_API_KEY?.trim());
    let status: ServiceHealthStatus = "healthy";
    if (error) status = "warning";
    else if (!hasKey) status = "error";
    else if ((count ?? 0) === 0) status = "warning";
    items.push({
      id: "lia",
      label: productionServiceLabels.lia,
      status,
      detail: error
        ? error.message
        : `provider=${liaProvider}; sessions=${count ?? 0}${
            !hasKey ? "; нет LIA_API_KEY" : ""
          }`,
    });
  } catch (e) {
    items.push({
      id: "lia",
      label: productionServiceLabels.lia,
      status: "error",
      detail: e instanceof Error ? e.message : "Lia probe failed",
    });
  }

  return items;
}

function buildDeploymentChecklist(input: {
  environment: EnvironmentBlock;
  services: ServiceHealthItem[];
  counts: {
    projects: number;
    experts: number;
    investments: number;
    deals: number;
    services: number;
    crmLeads: number;
    profiles: number;
  };
}): ChecklistSectionView[] {
  const svc = (id: ProductionServiceId) =>
    input.services.find((s) => s.id === id);

  return DEPLOYMENT_CHECKLIST_SECTIONS.map((section) => {
    const items: ChecklistItemView[] = section.items.map((item) => {
      let status: ChecklistItemStatus = "manual";
      let note = "Требует ручной проверки перед go-live";

      if (section.id === "infrastructure") {
        if (item.id === "hosting") {
          status = input.environment.nodeEnv === "production" ? "pass" : "manual";
          note =
            input.environment.nodeEnv === "production"
              ? "NODE_ENV=production"
              : "Подтвердите хостинг на production";
        } else if (item.id === "database") {
          const db = svc("database");
          status =
            db?.status === "healthy"
              ? "pass"
              : db?.status === "warning"
                ? "warn"
                : "fail";
          note = db?.detail ?? "нет данных";
        } else if (item.id === "env_vars") {
          status = input.environment.isProductionReady
            ? "pass"
            : input.environment.demoMode
              ? "fail"
              : "warn";
          note = input.environment.signals.join("; ");
        } else if (item.id === "domain") {
          status = input.environment.siteUrl
            ? input.environment.siteUrl.includes("localhost")
              ? "warn"
              : "pass"
            : "fail";
          note = input.environment.siteUrl ?? "SITE_URL не задан";
        } else if (item.id === "ssl") {
          status = input.environment.siteUrl?.startsWith("https://")
            ? "pass"
            : "manual";
          note = input.environment.siteUrl?.startsWith("https://")
            ? "SITE_URL на https"
            : "Проверьте SSL на домене вручную";
        }
      }

      if (section.id === "security") {
        if (item.id === "rls") {
          const db = svc("database");
          status = db?.status === "healthy" ? "pass" : "warn";
          note =
            "RLS включён миграциями; сверьте AccessAudit и security-audit.md";
        } else if (item.id === "permissions") {
          status = "manual";
          note = "Проверьте роли admin/staff/user/organization на реальных аккаунтах";
        } else if (item.id === "admin_access") {
          status = "manual";
          note = "Войдите админом и откройте /admin/system-health";
        } else if (item.id === "staff_access") {
          status = "manual";
          note = "Проверьте staff-префиксы: CRM, модерация, revenue";
        }
      }

      if (section.id === "product") {
        const map: Record<string, { n: number; ok: string }> = {
          registration: {
            n: input.counts.profiles,
            ok: `profiles: ${input.counts.profiles}`,
          },
          onboarding: {
            n: input.counts.profiles,
            ok: "onboarding доступен при наличии профилей",
          },
          projects: {
            n: input.counts.projects,
            ok: `projects: ${input.counts.projects}`,
          },
          experts: {
            n: input.counts.experts,
            ok: `experts: ${input.counts.experts}`,
          },
          investments: {
            n: input.counts.investments,
            ok: `investments: ${input.counts.investments}`,
          },
          deals: {
            n: input.counts.deals,
            ok: `deals: ${input.counts.deals}`,
          },
          lia: {
            n: svc("lia")?.status === "healthy" ? 1 : 0,
            ok: svc("lia")?.detail ?? "Lia",
          },
        };
        const m = map[item.id];
        if (m) {
          status = m.n > 0 ? "pass" : "warn";
          note = m.ok;
        }
      }

      if (section.id === "business") {
        if (item.id === "services") {
          status = input.counts.services > 0 ? "pass" : "warn";
          note = `services: ${input.counts.services}`;
        } else if (item.id === "revenue") {
          status = input.counts.deals > 0 ? "pass" : "warn";
          note = `deals (revenue pipeline): ${input.counts.deals}`;
        } else if (item.id === "crm") {
          status = input.counts.crmLeads > 0 ? "pass" : "warn";
          note = `crm leads/contacts signal: ${input.counts.crmLeads}`;
        }
      }

      return {
        id: item.id,
        label: item.label,
        detail: item.detail,
        href: "href" in item ? item.href : undefined,
        status,
        note,
      };
    });

    return {
      id: section.id,
      label: section.label,
      items,
      aggregate: aggregateFromStatuses(items.map((i) => i.status)),
    };
  });
}

function buildSmokeTests(input: {
  profilesByRole: Record<string, number>;
  projects: number;
  liaSessions: number;
  verifications: number;
  interests: number;
  organizations: number;
  partnerships: number;
}): SmokeFlowView[] {
  return SMOKE_TEST_FLOWS.map((flow) => {
    const steps: SmokeStepView[] = flow.steps.map((step) => {
      let status: ChecklistItemStatus = "manual";
      let note = "Пройдите сценарий на реальном аккаунте";

      if (flow.id === "entrepreneur") {
        if (step.id === "register") {
          const n = input.profilesByRole.entrepreneur ?? 0;
          status = n > 0 ? "pass" : "warn";
          note = `entrepreneur profiles: ${n}`;
        } else if (step.id === "profile") {
          status = (input.profilesByRole.entrepreneur ?? 0) > 0 ? "pass" : "warn";
          note = "Кабинет /dashboard";
        } else if (step.id === "lia") {
          status = input.liaSessions > 0 ? "pass" : "warn";
          note = `lia_sessions: ${input.liaSessions}`;
        } else if (step.id === "project") {
          status = input.projects > 0 ? "pass" : "warn";
          note = `projects: ${input.projects}`;
        }
      }

      if (flow.id === "expert") {
        if (step.id === "register" || step.id === "profile") {
          const n = input.profilesByRole.expert ?? 0;
          status = n > 0 ? "pass" : "warn";
          note = `expert profiles: ${n}`;
        } else if (step.id === "verification") {
          status = input.verifications > 0 ? "pass" : "manual";
          note =
            input.verifications > 0
              ? `verification requests: ${input.verifications}`
              : "Проверьте путь верификации эксперта вручную";
        }
      }

      if (flow.id === "investor") {
        if (step.id === "register") {
          const n = input.profilesByRole.investor ?? 0;
          status = n > 0 ? "pass" : "warn";
          note = `investor profiles: ${n}`;
        } else if (step.id === "view_project") {
          status = input.projects > 0 ? "pass" : "warn";
          note = `публичные проекты: ${input.projects}`;
        } else if (step.id === "interest") {
          status = input.interests > 0 ? "pass" : "manual";
          note =
            input.interests > 0
              ? `interests: ${input.interests}`
              : "Зафиксируйте интерес инвестора вручную";
        }
      }

      if (flow.id === "organization") {
        if (step.id === "register" || step.id === "profile") {
          status =
            input.organizations > 0 ||
            (input.profilesByRole.company ?? 0) > 0
              ? "pass"
              : "warn";
          note = `organizations: ${input.organizations}; company profiles: ${
            input.profilesByRole.company ?? 0
          }`;
        } else if (step.id === "partnership") {
          status = input.partnerships > 0 ? "pass" : "manual";
          note =
            input.partnerships > 0
              ? `partnerships: ${input.partnerships}`
              : "Проверьте партнёрский сценарий вручную";
        }
      }

      return {
        id: step.id,
        label: step.label,
        href: step.href,
        status,
        note,
      };
    });

    return {
      id: flow.id,
      label: flow.label,
      steps,
      aggregate: aggregateFromStatuses(steps.map((s) => s.status)),
    };
  });
}

function buildAccessAudit(input: {
  dbHealthy: boolean;
  profiles: number;
  organizations: number;
}): AccessAuditItem[] {
  return ACCESS_AUDIT_CHECKS.map((check) => {
    let status: ChecklistItemStatus = "manual";
    let note = check.expectation;
    const rlsOk = input.dbHealthy;

    if (check.id === "admin") {
      status = input.dbHealthy ? "pass" : "fail";
      note = "Middleware: /admin → admin; system-health staff-доступен";
    } else if (check.id === "staff") {
      status = "manual";
      note =
        "STAFF_ADMIN_PREFIXES включает CRM, revenue, system-health — проверьте operator-аккаунт";
    } else if (check.id === "user") {
      status = input.profiles > 0 && rlsOk ? "pass" : "warn";
      note = "RLS: пользователь видит только свои profiles/projects/documents";
    } else if (check.id === "organization") {
      status = input.organizations > 0 && rlsOk ? "pass" : "manual";
      note = "Организация — только свой партнёрский контур (/partner)";
    }

    return {
      id: check.id,
      label: check.label,
      expectation: check.expectation,
      checks: [...check.checks],
      status,
      note,
      rlsOk,
    };
  });
}

function buildRecovery(environment: EnvironmentBlock): RecoveryItemView[] {
  return RECOVERY_CHECKLIST_ITEMS.map((item) => {
    let status: ChecklistItemStatus = "manual";
    let note = item.detail;

    if (item.id === "backup_database") {
      status = environment.isProductionReady ? "manual" : "warn";
      note = "Подтвердите автобэкапы Supabase / внешний dump";
    } else if (item.id === "restore_database") {
      status = "manual";
      note = "Пройдите restore на staging по docs/backup.md";
    } else if (item.id === "storage") {
      status = "manual";
      note = "Проверьте бакет documents и sync/версионирование";
    } else if (item.id === "documents") {
      status = "manual";
      note = "После restore — доступ к файлам через таблицу documents";
    }

    return {
      id: item.id,
      label: item.label,
      detail: item.detail,
      status,
      note,
    };
  });
}

export function buildLiaProductionReport(input: {
  services: ServiceHealthItem[];
  liaSessions: number;
  liaMessages: number;
  liaErrors: number;
  environment: EnvironmentBlock;
}): LiaProductionReport {
  const lia = input.services.find((s) => s.id === "lia");
  const availability =
    lia?.status === "healthy"
      ? "Lia доступна (provider настроен, sessions читаются)."
      : lia?.status === "warning"
        ? `Lia с предупреждением: ${lia.detail}`
        : `Lia недоступна или с ошибкой: ${lia?.detail ?? "нет данных"}`;

  const usage = [
    `Сессии: ${input.liaSessions}`,
    `Сообщения (sample): ${input.liaMessages}`,
    `Provider: ${process.env.LIA_PROVIDER ?? "mock"}`,
    `Канал: ${input.environment.channel}`,
  ];

  const errors: string[] = [];
  if (lia?.status === "error") errors.push(lia.detail);
  if (input.liaErrors > 0) {
    errors.push(`Сигналы ошибок lia/system_logs: ${input.liaErrors}`);
  }
  if (input.environment.demoMode) {
    errors.push("Demo mode включён — не для production Lia traffic");
  }
  if (errors.length === 0) {
    errors.push("Критических ошибок Lia в пробе не обнаружено");
  }

  const recommendations: string[] = [];
  if (lia?.status !== "healthy") {
    recommendations.push("Проверить LIA_PROVIDER / LIA_API_KEY и /lia сценарии");
  }
  if (input.liaSessions === 0) {
    recommendations.push("Пройти smoke: предприниматель → Лия → проект");
  }
  recommendations.push(
    "Контролировать rate limit и disclaimer; Лия только рекомендует",
  );
  recommendations.push(
    "При росте latency — проверить provider и внешний поиск (LIA_WEB_SEARCH_*)",
  );

  return {
    summary: [
      `LiaProductionReport · ${platformVersion.version}.`,
      availability,
      "Только анализ — без изменения конфигурации.",
    ].join(" "),
    availability,
    usage,
    errors,
    recommendations,
  };
}

function suggestDecision(input: {
  servicesAggregate: ServiceHealthStatus;
  environment: EnvironmentBlock;
  checklist: ChecklistSectionView[];
  smoke: SmokeFlowView[];
  access: AccessAuditItem[];
  analyticsFlowing: boolean;
}): GoLiveSuggestion {
  const problems: string[] = [];
  const indicators: string[] = [];

  if (input.servicesAggregate === "error") {
    problems.push("Один или несколько сервисов в статусе error");
  } else {
    indicators.push(`Services: ${input.servicesAggregate}`);
  }

  if (!input.environment.isProductionReady) {
    problems.push(...input.environment.signals.filter((s) => !s.includes("выглядит")));
  } else {
    indicators.push("Env checklist: demo mode off, SITE_URL задан");
  }

  const failItems = input.checklist
    .flatMap((s) => s.items)
    .filter((i) => i.status === "fail");
  if (failItems.length > 0) {
    problems.push(
      `Deployment checklist fail: ${failItems.map((i) => i.label).join(", ")}`,
    );
  } else {
    indicators.push("Deployment checklist без fail");
  }

  const smokeFail = input.smoke.filter((f) => f.aggregate === "error");
  if (smokeFail.length > 0) {
    problems.push(`Smoke fail: ${smokeFail.map((f) => f.label).join(", ")}`);
  } else {
    indicators.push("Smoke-сценарии без error");
  }

  const accessFail = input.access.filter((a) => a.status === "fail");
  if (accessFail.length > 0) {
    problems.push("AccessAudit: блокирующие пункты");
  } else {
    indicators.push("AccessAudit без fail");
  }

  if (!input.analyticsFlowing) {
    problems.push("Ключевые analytics-события не поступают");
  } else {
    indicators.push("Analytics events поступают");
  }

  const scoreParts = [
    input.servicesAggregate === "healthy" ? 25 : input.servicesAggregate === "warning" ? 12 : 0,
    input.environment.isProductionReady ? 20 : 5,
    failItems.length === 0 ? 15 : 0,
    smokeFail.length === 0 ? 15 : 0,
    accessFail.length === 0 ? 10 : 0,
    input.analyticsFlowing ? 15 : 0,
  ];
  const readiness = scoreParts.reduce((a, b) => a + b, 0);

  let suggested: ProductionLaunchDecision = "hold";
  if (input.servicesAggregate === "error" || failItems.length >= 2) {
    suggested = "rollback";
  } else if (
    readiness >= 80 &&
    input.servicesAggregate !== "error" &&
    failItems.length === 0 &&
    input.environment.isProductionReady
  ) {
    suggested = "go_live";
  } else {
    suggested = "hold";
  }

  return {
    suggested,
    readiness,
    hint: productionLaunchDecisionHints[suggested],
    indicators:
      indicators.length > 0 ? indicators : ["Недостаточно сигналов"],
    problems: problems.length > 0 ? problems : ["Блокирующих проблем не выявлено"],
  };
}

async function countExact(
  supabase: ReturnType<typeof createClient>,
  table: string,
  filter?: { column: string; value: string },
): Promise<number> {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) q = q.eq(filter.column, filter.value);
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

export async function getSystemHealthDashboard(): Promise<SystemHealthDashboard> {
  const environment = buildEnvironment();
  const criteria = PRODUCTION_GO_LIVE_CRITERIA;

  if (!hasSupabaseEnv()) {
    const services = await probeServices();
    const servicesAggregate = aggregateFromStatuses(services.map((s) => s.status));
    const deploymentChecklist = buildDeploymentChecklist({
      environment,
      services,
      counts: {
        projects: 0,
        experts: 0,
        investments: 0,
        deals: 0,
        services: 0,
        crmLeads: 0,
        profiles: 0,
      },
    });
    const smokeTests = buildSmokeTests({
      profilesByRole: {},
      projects: 0,
      liaSessions: 0,
      verifications: 0,
      interests: 0,
      organizations: 0,
      partnerships: 0,
    });
    const accessAudit = buildAccessAudit({
      dbHealthy: false,
      profiles: 0,
      organizations: 0,
    });
    const analytics: AnalyticsEventProbe[] = PRODUCTION_ANALYTICS_EVENTS.map(
      (e) => ({
        id: e.id,
        label: e.label,
        count: 0,
        flowing: false,
        aliases: [...e.aliases],
      }),
    );
    const recovery = buildRecovery(environment);
    const liaReport = buildLiaProductionReport({
      services,
      liaSessions: 0,
      liaMessages: 0,
      liaErrors: 0,
      environment,
    });
    const decision = suggestDecision({
      servicesAggregate,
      environment,
      checklist: deploymentChecklist,
      smoke: smokeTests,
      access: accessAudit,
      analyticsFlowing: false,
    });

    return {
      environment,
      services,
      servicesAggregate,
      deploymentChecklist,
      smokeTests,
      accessAudit,
      analytics,
      analyticsFlowing: false,
      recovery,
      liaReport,
      decision,
      latestDecision: null,
      criteria,
    };
  }

  const supabase = createClient();
  const services = await probeServices();
  const servicesAggregate = aggregateFromStatuses(services.map((s) => s.status));

  const [
    projects,
    experts,
    investments,
    deals,
    servicesCount,
    crmLeads,
    profiles,
    organizations,
    partnerships,
    liaSessions,
    liaMessages,
    verifications,
    interests,
    entrepreneur,
    expert,
    investor,
    company,
    eventsRes,
    decisionRes,
    logsRes,
  ] = await Promise.all([
    countExact(supabase, "projects"),
    countExact(supabase, "expert_profiles"),
    countExact(supabase, "investment_offers"),
    countExact(supabase, "deals"),
    countExact(supabase, "services"),
    countExact(supabase, "crm_contacts"),
    countExact(supabase, "profiles"),
    countExact(supabase, "organizations"),
    countExact(supabase, "partnerships"),
    countExact(supabase, "lia_sessions"),
    countExact(supabase, "lia_messages"),
    countExact(supabase, "verification_requests"),
    countExact(supabase, "investor_interests"),
    countExact(supabase, "profiles", {
      column: "role",
      value: "entrepreneur",
    }),
    countExact(supabase, "profiles", { column: "role", value: "expert" }),
    countExact(supabase, "profiles", { column: "role", value: "investor" }),
    countExact(supabase, "profiles", { column: "role", value: "company" }),
    supabase
      .from("analytics_events")
      .select("event_type")
      .limit(5000),
    supabase
      .from("production_launch_decisions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("system_logs")
      .select("id", { count: "exact", head: true })
      .ilike("source", "%lia%")
      .eq("level", "error"),
  ]);

  const crmSignal = crmLeads;

  const eventCounts = new Map<string, number>();
  for (const row of eventsRes.data ?? []) {
    const t = String((row as { event_type?: string }).event_type ?? "");
    if (!t) continue;
    eventCounts.set(t, (eventCounts.get(t) ?? 0) + 1);
  }

  const analytics: AnalyticsEventProbe[] = PRODUCTION_ANALYTICS_EVENTS.map(
    (e) => {
      let count = 0;
      for (const alias of e.aliases) {
        count += eventCounts.get(alias) ?? 0;
      }
      return {
        id: e.id,
        label: e.label,
        count,
        flowing: count > 0,
        aliases: [...e.aliases],
      };
    },
  );
  const analyticsFlowing = analytics.filter((a) => a.flowing).length >= 4;

  const deploymentChecklist = buildDeploymentChecklist({
    environment,
    services,
    counts: {
      projects,
      experts,
      investments,
      deals,
      services: servicesCount,
      crmLeads: crmSignal,
      profiles,
    },
  });

  const smokeTests = buildSmokeTests({
    profilesByRole: {
      entrepreneur,
      expert,
      investor,
      company,
    },
    projects,
    liaSessions,
    verifications,
    interests,
    organizations,
    partnerships,
  });

  const accessAudit = buildAccessAudit({
    dbHealthy: services.find((s) => s.id === "database")?.status === "healthy",
    profiles,
    organizations,
  });

  const recovery = buildRecovery(environment);

  const liaReport = buildLiaProductionReport({
    services,
    liaSessions,
    liaMessages,
    liaErrors: logsRes.count ?? 0,
    environment,
  });

  const decision = suggestDecision({
    servicesAggregate,
    environment,
    checklist: deploymentChecklist,
    smoke: smokeTests,
    access: accessAudit,
    analyticsFlowing,
  });

  let latestDecision: ProductionLaunchDecisionRecord | null = null;
  if (
    decisionRes.data &&
    !decisionRes.error &&
    (decisionRes.data as ProductionLaunchDecisionRow).id
  ) {
    const row = decisionRes.data as ProductionLaunchDecisionRow;
    latestDecision = {
      id: row.id,
      decision: row.decision,
      comment: row.notes,
      responsible: row.responsible_name,
      responsibleId: row.created_by,
      date: row.created_at,
    };
  }

  return {
    environment,
    services,
    servicesAggregate,
    deploymentChecklist,
    smokeTests,
    accessAudit,
    analytics,
    analyticsFlowing,
    recovery,
    liaReport,
    decision,
    latestDecision,
    criteria,
  };
}

export async function buildLiaProductionReportAsync(): Promise<LiaProductionReport> {
  const dash = await getSystemHealthDashboard();
  return dash.liaReport;
}

export { productionLaunchDecisionLabels };
