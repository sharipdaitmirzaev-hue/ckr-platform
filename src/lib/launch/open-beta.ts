/**
 * Open Beta Wave 1 — дашборд, метрики, health check (этап 55).
 */

import {
  OPEN_BETA_FEEDBACK_CATEGORIES,
  OPEN_BETA_INVITE_SOURCE,
  OPEN_BETA_JOURNEY_STEPS,
  OPEN_BETA_ROLE_TARGETS,
  OPEN_BETA_SUCCESS_CRITERIA,
  OPEN_BETA_WAVE_ID,
  OPEN_BETA_WAVE_NAME,
  toOpenBetaJourneyStatus,
  type OpenBetaFeedbackCategory,
  type OpenBetaRoleKey,
} from "@/config/open-beta";
import {
  goalProgressPercent,
  launchGoalMetricLabels,
  type LaunchGoalMetricType,
} from "@/config/launch-goals";
import { platformVersion } from "@/config/version";
import { getImprovementsDashboard } from "@/lib/improvements/queries";
import { listLaunchGoals, type LaunchGoalView } from "@/lib/launch/goals";
import { listLaunchWaves } from "@/lib/launch/waves";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { BetaInviteRow, LaunchWaveRow } from "@/types/database";
import type { OpenBetaReport } from "@/types/lia";

export type OpenBetaUserCounts = {
  invited: number;
  registered: number;
  activated: number;
  active: number;
  completed: number;
  inactive: number;
};

export type OpenBetaRoleRow = {
  key: OpenBetaRoleKey;
  label: string;
  checks: string[];
  invited: number;
  registered: number;
  active: number;
  projects: number;
  signal: string;
};

export type OpenBetaMetrics = {
  newUsers: number;
  activeUsers: number;
  projectsCreated: number;
  projectsPublished: number;
  applications: number;
  interests: number;
  expertInteractions: number;
  deals: number;
  liaUsed: number;
  liaPct: number;
  feedbackCount: number;
};

export type FunnelStep = {
  key: string;
  label: string;
  count: number;
  conversionFromPrevPct: number | null;
  dropOffPct: number | null;
  dropOffCount: number | null;
};

export type OpenBetaHealthCheck = {
  status: "healthy" | "attention" | "critical";
  items: Array<{
    id: string;
    label: string;
    status: "ok" | "warn" | "fail";
    detail: string;
  }>;
};

export type OpenBetaDashboard = {
  wave: LaunchWaveRow | null;
  goals: LaunchGoalView[];
  users: OpenBetaUserCounts;
  roles: OpenBetaRoleRow[];
  metrics: OpenBetaMetrics;
  funnel: FunnelStep[];
  feedbackByCategory: Record<OpenBetaFeedbackCategory, number>;
  health: OpenBetaHealthCheck;
  report: OpenBetaReport;
  successCriteria: readonly string[];
  lia: { dialogues: number; scenarios: Array<{ scenario: string; count: number }> };
};

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

function roleKeyFromInviteRole(role: string): OpenBetaRoleKey | null {
  if (role === "entrepreneur") return "entrepreneurs";
  if (role === "expert") return "experts";
  if (role === "investor") return "investors";
  if (role === "company") return "organizations";
  return null;
}

function emptyMetrics(): OpenBetaMetrics {
  return {
    newUsers: 0,
    activeUsers: 0,
    projectsCreated: 0,
    projectsPublished: 0,
    applications: 0,
    interests: 0,
    expertInteractions: 0,
    deals: 0,
    liaUsed: 0,
    liaPct: 0,
    feedbackCount: 0,
  };
}

function emptyDashboard(): OpenBetaDashboard {
  const feedbackByCategory = Object.fromEntries(
    OPEN_BETA_FEEDBACK_CATEGORIES.map((c) => [c, 0]),
  ) as Record<OpenBetaFeedbackCategory, number>;

  const health: OpenBetaHealthCheck = {
    status: "attention",
    items: [
      {
        id: "env",
        label: "Environment",
        status: "fail",
        detail: "Supabase env не настроен.",
      },
    ],
  };

  const report = buildOpenBetaReport({
    users: {
      invited: 0,
      registered: 0,
      activated: 0,
      active: 0,
      completed: 0,
      inactive: 0,
    },
    metrics: emptyMetrics(),
    roles: [],
    lia: { dialogues: 0, scenarios: [] },
    health,
    problems: ["Нет данных — примените миграцию open_beta_wave."],
  });

  return {
    wave: null,
    goals: [],
    users: {
      invited: 0,
      registered: 0,
      activated: 0,
      active: 0,
      completed: 0,
      inactive: 0,
    },
    roles: Object.entries(OPEN_BETA_ROLE_TARGETS).map(([key, meta]) => ({
      key: key as OpenBetaRoleKey,
      label: meta.label,
      checks: meta.checks,
      invited: 0,
      registered: 0,
      active: 0,
      projects: 0,
      signal: "нет данных",
    })),
    metrics: emptyMetrics(),
    funnel: OPEN_BETA_JOURNEY_STEPS.map((s) => ({
      key: s.key,
      label: s.label,
      count: 0,
      conversionFromPrevPct: null,
      dropOffPct: null,
      dropOffCount: null,
    })),
    feedbackByCategory,
    health,
    report,
    successCriteria: OPEN_BETA_SUCCESS_CRITERIA,
    lia: { dialogues: 0, scenarios: [] },
  };
}

export function openBetaMetricValueForGoal(
  title: string,
  users: OpenBetaUserCounts,
  metrics: OpenBetaMetrics,
): number | null {
  const t = title.toLowerCase();
  if (t.includes("приглаш")) return users.invited;
  if (t.includes("зарегистрир")) return users.registered;
  if (t.includes("активир")) return users.activated;
  if (t.includes("активн")) return users.active;
  if (t.includes("проект")) return metrics.projectsCreated;
  if (t.includes("заявк")) return metrics.applications;
  if (t.includes("интерес")) return metrics.interests;
  if (t.includes("лию") || t.includes("лия")) return metrics.liaPct;
  if (t.includes("feedback")) return metrics.feedbackCount;
  return null;
}

export function buildOpenBetaReport(input: {
  users: OpenBetaUserCounts;
  metrics: OpenBetaMetrics;
  roles: OpenBetaRoleRow[];
  lia: OpenBetaDashboard["lia"];
  health: OpenBetaHealthCheck;
  problems: string[];
}): OpenBetaReport {
  const { users, metrics, roles, lia, health, problems } = input;
  const recommendations: string[] = [];

  if (users.registered < 10) {
    recommendations.push("Дослать приглашения Open Beta Wave 1.");
  }
  if (metrics.liaPct < 35) {
    recommendations.push("Провести участников через стартовый сценарий Лии.");
  }
  if (metrics.applications + metrics.interests < 5) {
    recommendations.push("Усилить связи: интересы инвесторов и заявки.");
  }
  if (health.status !== "healthy") {
    recommendations.push("Закрыть пункты OpenBetaHealthCheck со статусом warn/fail.");
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Когорта стабильна — фиксируйте success cases и готовьте недельный review.",
    );
  }

  return {
    summary: [
      `${OPEN_BETA_WAVE_NAME}: срез открытого запуска.`,
      `Приглашено ${users.invited}, зарегистрировано ${users.registered}, активно ${users.active}.`,
      `Health: ${health.status}. Версия ${platformVersion.version}.`,
    ].join(" "),
    users: [
      `Приглашено: ${users.invited}`,
      `Зарегистрировано: ${users.registered}`,
      `Активировано: ${users.activated}`,
      `Активно: ${users.active}`,
      `Завершили: ${users.completed}`,
      `Неактивны: ${users.inactive}`,
      ...roles.map(
        (r) => `${r.label}: reg ${r.registered} · active ${r.active}`,
      ),
    ],
    activation: [
      `Новые пользователи: ${metrics.newUsers}`,
      `Активные: ${metrics.activeUsers}`,
      `Первое действие / объекты: проекты ${metrics.projectsCreated}, опубликовано ${metrics.projectsPublished}`,
      `Конверсия invite→reg: ${pct(users.registered, users.invited)}%`,
    ],
    lia_usage: [
      `Диалогов: ${lia.dialogues}`,
      `Использовали Лию: ${metrics.liaUsed} (${metrics.liaPct}%)`,
      ...(lia.scenarios.length > 0
        ? lia.scenarios.slice(0, 6).map((s) => `${s.scenario}: ${s.count}`)
        : ["Размеченных сценариев пока нет"]),
    ],
    ecosystem_activity: [
      `Проекты: ${metrics.projectsCreated} (опубликовано ${metrics.projectsPublished})`,
      `Заявки: ${metrics.applications}`,
      `Интересы: ${metrics.interests}`,
      `Экспертные взаимодействия: ${metrics.expertInteractions}`,
      `Сделки: ${metrics.deals}`,
      `Feedback: ${metrics.feedbackCount}`,
    ],
    problems:
      problems.length > 0 ? problems : ["Критических проблем по срезу нет"],
    recommendations,
  };
}

function buildHealthCheck(input: {
  openCritical: number;
  openHigh: number;
  activeUsers: number;
  registered: number;
  hasEnv: boolean;
}): OpenBetaHealthCheck {
  const items: OpenBetaHealthCheck["items"] = [
    {
      id: "errors",
      label: "Ошибки / Critical",
      status: input.openCritical === 0 ? "ok" : "fail",
      detail:
        input.openCritical === 0
          ? "Открытых Critical нет"
          : `Critical: ${input.openCritical}`,
    },
    {
      id: "critical_problems",
      label: "Критичные проблемы",
      status:
        input.openCritical === 0 && input.openHigh <= 3 ? "ok" : "warn",
      detail: `Critical ${input.openCritical} · High ${input.openHigh}`,
    },
    {
      id: "activity",
      label: "Активность",
      status:
        input.activeUsers > 0
          ? "ok"
          : input.registered > 0
            ? "warn"
            : "fail",
      detail: `Активных ${input.activeUsers} из ${input.registered} зарегистрированных`,
    },
    {
      id: "load",
      label: "Нагрузка",
      status: "ok",
      detail: "Контролируемый invite-only доступ — нагрузка ограничена когортой",
    },
    {
      id: "env",
      label: "Environment",
      status: input.hasEnv ? "ok" : "fail",
      detail: input.hasEnv
        ? `Supabase env · ${platformVersion.version}`
        : "Env не настроен",
    },
  ];

  const status: OpenBetaHealthCheck["status"] = items.some(
    (i) => i.status === "fail",
  )
    ? "critical"
    : items.some((i) => i.status === "warn")
      ? "attention"
      : "healthy";

  return { status, items };
}

export async function getOpenBetaDashboard(): Promise<OpenBetaDashboard> {
  const base = emptyDashboard();
  if (!hasSupabaseEnv()) return base;

  try {
    const waves = await listLaunchWaves();
    const wave =
      waves.find((w) => w.id === OPEN_BETA_WAVE_ID) ??
      waves.find((w) => w.name === OPEN_BETA_WAVE_NAME) ??
      null;

    const goalRows = wave ? await listLaunchGoals(wave.id) : [];
    const goals: LaunchGoalView[] = goalRows.map((g) => ({
      ...g,
      progress: goalProgressPercent(
        Number(g.current_value),
        Number(g.target_value),
      ),
      metricLabel:
        launchGoalMetricLabels[g.metric_type as LaunchGoalMetricType] ??
        g.metric_type,
    }));

    const supabase = createClient();
    const improvements = await getImprovementsDashboard();

    const [
      invitesRes,
      eventsRes,
      sessionsRes,
      messagesRes,
      projectsRes,
      publishedRes,
      appsRes,
      interestsRes,
      dealsRes,
      feedbackRes,
    ] = await Promise.all([
      supabase
        .from("beta_invites")
        .select("*")
        .eq("source", OPEN_BETA_INVITE_SOURCE)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("analytics_events")
        .select("user_id, event_type, created_at")
        .in("event_type", [
          "invite_sent",
          "invite_accepted",
          "public_page_view",
          "registration_completed",
          "user_registered",
          "role_selected",
          "profile_completed",
          "onboarding_completed",
          "lia_first_used",
          "lia_started",
          "first_lia_use",
          "lia_used",
          "first_object_created",
          "first_action",
          "project_created",
          "expert_profile_created",
          "investment_interest_created",
          "activation_after_fix",
          "application_created",
          "deal_created",
          "first_application",
          "first_deal",
          "feedback_sent",
        ])
        .limit(15000),
      supabase
        .from("lia_sessions")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("lia_messages")
        .select("id, metadata")
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(800),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("investor_interests")
        .select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id", { count: "exact", head: true }),
      supabase
        .from("feedback")
        .select("id, category, type, message, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const invites = (invitesRes.data ?? []) as BetaInviteRow[];

    const journeyOf = (status: string) => toOpenBetaJourneyStatus(status);
    const users: OpenBetaUserCounts = {
      invited: invites.filter((i) =>
        ["invited", "registered", "activated", "active", "completed"].includes(
          journeyOf(i.status),
        ),
      ).length,
      registered: invites.filter((i) =>
        ["registered", "activated", "active", "completed"].includes(
          journeyOf(i.status),
        ),
      ).length,
      activated: invites.filter((i) =>
        ["activated", "active", "completed"].includes(journeyOf(i.status)),
      ).length,
      active: invites.filter((i) =>
        ["active", "activated"].includes(journeyOf(i.status)),
      ).length,
      completed: invites.filter((i) => journeyOf(i.status) === "completed")
        .length,
      inactive: invites.filter((i) => journeyOf(i.status) === "inactive")
        .length,
    };

    // Fallback: used_by implies at least registered
    if (users.registered === 0) {
      users.registered = invites.filter((i) => Boolean(i.used_by)).length;
    }

    const events = (eventsRes.data ?? []) as Array<{
      user_id: string | null;
      event_type: string;
      created_at: string;
    }>;
    const eventsByUser = new Map<string, Set<string>>();
    for (const e of events) {
      if (!e.user_id) continue;
      const set = eventsByUser.get(e.user_id) ?? new Set<string>();
      set.add(e.event_type);
      eventsByUser.set(e.user_id, set);
    }

    const registeredUsers = new Set(
      invites.map((i) => i.used_by).filter((id): id is string => Boolean(id)),
    );

    let liaUsed = 0;
    let firstAction = 0;
    for (const userId of Array.from(registeredUsers)) {
      const types = eventsByUser.get(userId) ?? new Set<string>();
      if (
        types.has("lia_first_used") ||
        types.has("lia_started") ||
        types.has("first_lia_use") ||
        types.has("lia_used")
      ) {
        liaUsed += 1;
      }
      if (
        types.has("first_object_created") ||
        types.has("project_created") ||
        types.has("expert_profile_created") ||
        types.has("investment_interest_created")
      ) {
        firstAction += 1;
      }
    }

    const roleMap = new Map<OpenBetaRoleKey, OpenBetaRoleRow>();
    for (const [key, meta] of Object.entries(OPEN_BETA_ROLE_TARGETS)) {
      roleMap.set(key as OpenBetaRoleKey, {
        key: key as OpenBetaRoleKey,
        label: meta.label,
        checks: meta.checks,
        invited: 0,
        registered: 0,
        active: 0,
        projects: 0,
        signal: "",
      });
    }
    for (const invite of invites) {
      const key = roleKeyFromInviteRole(invite.role);
      if (!key) continue;
      const row = roleMap.get(key);
      if (!row) continue;
      row.invited += 1;
      const js = journeyOf(invite.status);
      if (["registered", "activated", "active", "completed"].includes(js)) {
        row.registered += 1;
      }
      if (["active", "activated"].includes(js)) row.active += 1;
    }

    const projectsCreated = projectsRes.count ?? 0;
    const projectsPublished = publishedRes.count ?? 0;
    const applications = appsRes.count ?? 0;
    const interests = interestsRes.count ?? 0;
    const deals = dealsRes.count ?? 0;

    // Approximate role projects from totals for entrepreneurs/orgs
    const entrepreneurs = roleMap.get("entrepreneurs");
    if (entrepreneurs) {
      entrepreneurs.projects = projectsCreated;
      entrepreneurs.signal = `${entrepreneurs.registered} reg · проекты ${projectsCreated}`;
    }
    const experts = roleMap.get("experts");
    if (experts) {
      experts.signal = `${experts.registered} reg · заявки/запросы ${applications}`;
    }
    const investors = roleMap.get("investors");
    if (investors) {
      investors.signal = `${investors.registered} reg · интересы ${interests}`;
    }
    const orgs = roleMap.get("organizations");
    if (orgs) {
      orgs.projects = Math.min(projectsCreated, orgs.registered);
      orgs.signal = `${orgs.registered} reg · партнёрства/сделки ${deals}`;
    }

    const feedbackRows = (feedbackRes.data ?? []) as Array<{
      id: string;
      category: string | null;
      type: string;
      message: string;
    }>;
    const feedbackByCategory = Object.fromEntries(
      OPEN_BETA_FEEDBACK_CATEGORIES.map((c) => [c, 0]),
    ) as Record<OpenBetaFeedbackCategory, number>;
    for (const fb of feedbackRows) {
      const cat = fb.category as OpenBetaFeedbackCategory | null;
      if (cat && OPEN_BETA_FEEDBACK_CATEGORIES.includes(cat)) {
        feedbackByCategory[cat] += 1;
      } else if (fb.type === "ux") feedbackByCategory.UX += 1;
      else if (fb.type === "lia_quality") feedbackByCategory.Lia += 1;
      else feedbackByCategory.Other += 1;
    }

    const scenarioCounts = new Map<string, number>();
    for (const msg of (messagesRes.data ?? []) as Array<{
      metadata: Record<string, unknown> | null;
    }>) {
      const scenario =
        typeof msg.metadata?.scenario === "string"
          ? msg.metadata.scenario
          : "unknown";
      scenarioCounts.set(scenario, (scenarioCounts.get(scenario) ?? 0) + 1);
    }
    const lia = {
      dialogues: sessionsRes.count ?? 0,
      scenarios: Array.from(scenarioCounts.entries())
        .map(([scenario, count]) => ({ scenario, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
    };

    const metrics: OpenBetaMetrics = {
      newUsers: users.registered,
      activeUsers: users.active,
      projectsCreated,
      projectsPublished,
      applications,
      interests,
      expertInteractions: Math.max(applications, 0),
      deals,
      liaUsed,
      liaPct: pct(liaUsed, Math.max(users.registered, 1)),
      feedbackCount: feedbackRows.length,
    };

    // Funnel with drop-offs
    const stepCounts: Record<string, number> = {
      entry: users.invited,
      registration: users.registered,
      role: 0,
      profile: 0,
      lia: liaUsed,
      first_action: firstAction,
      result: Math.min(applications + deals, users.registered),
    };
    for (const userId of Array.from(registeredUsers)) {
      const types = eventsByUser.get(userId) ?? new Set<string>();
      if (types.has("role_selected")) stepCounts.role += 1;
      if (
        types.has("profile_completed") ||
        types.has("onboarding_completed")
      ) {
        stepCounts.profile += 1;
      }
    }
    if (stepCounts.role === 0) stepCounts.role = users.registered;
    if (stepCounts.profile === 0) {
      stepCounts.profile = users.activated;
    }

    const funnel: FunnelStep[] = OPEN_BETA_JOURNEY_STEPS.map((step, index) => {
      const count = stepCounts[step.key] ?? 0;
      const prev =
        index === 0
          ? null
          : (stepCounts[OPEN_BETA_JOURNEY_STEPS[index - 1].key] ?? 0);
      const conversionFromPrevPct =
        prev == null ? null : pct(count, Math.max(prev, 1));
      const dropOffCount =
        prev == null ? null : Math.max(0, prev - count);
      const dropOffPct =
        prev == null || prev <= 0
          ? null
          : pct(dropOffCount ?? 0, prev);
      return {
        key: step.key,
        label: step.label,
        count,
        conversionFromPrevPct,
        dropOffPct,
        dropOffCount,
      };
    });

    const openCritical = improvements.problems.filter(
      (p) =>
        p.severity === "critical" &&
        !["done", "closed", "resolved"].includes(p.status),
    ).length;
    const openHigh = improvements.problems.filter(
      (p) =>
        p.severity === "high" &&
        !["done", "closed", "resolved"].includes(p.status),
    ).length;
    const plannedCritical = improvements.improvements.filter(
      (i) =>
        i.priority === "critical" &&
        (i.status === "planned" || i.status === "in_progress"),
    ).length;

    const health = buildHealthCheck({
      openCritical: openCritical + plannedCritical,
      openHigh,
      activeUsers: users.active,
      registered: users.registered,
      hasEnv: true,
    });

    const problems: string[] = [];
    if (openCritical + plannedCritical > 0) {
      problems.push(`Critical issues: ${openCritical + plannedCritical}`);
    }
    const maxDrop = funnel
      .filter((f) => f.dropOffPct != null)
      .sort((a, b) => (b.dropOffPct ?? 0) - (a.dropOffPct ?? 0))[0];
    if (maxDrop && (maxDrop.dropOffPct ?? 0) >= 40) {
      problems.push(
        `Главная потеря: ${maxDrop.label} (−${maxDrop.dropOffPct}% / ${maxDrop.dropOffCount})`,
      );
    }
    for (const fb of feedbackRows.slice(0, 3)) {
      problems.push(
        `Feedback [${fb.category || fb.type}]: ${fb.message.slice(0, 80)}`,
      );
    }

    const roles = Array.from(roleMap.values());
    const report = buildOpenBetaReport({
      users,
      metrics,
      roles,
      lia,
      health,
      problems,
    });

    return {
      wave,
      goals,
      users,
      roles,
      metrics,
      funnel,
      feedbackByCategory,
      health,
      report,
      successCriteria: OPEN_BETA_SUCCESS_CRITERIA,
      lia,
    };
  } catch {
    return emptyDashboard();
  }
}

export async function buildOpenBetaReportAsync(): Promise<OpenBetaReport> {
  const dashboard = await getOpenBetaDashboard();
  return dashboard.report;
}
