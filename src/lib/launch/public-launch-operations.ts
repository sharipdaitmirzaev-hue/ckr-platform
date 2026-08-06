/**
 * Public Launch Operations — операционное управление после активации (этап 59).
 */

import {
  LAUNCH_HEALTH_AREAS,
  launchOpsTaskStatusLabels,
  launchOpsTaskTypeLabels,
  type LaunchHealthArea,
  type LaunchOpsTaskStatus,
  type LaunchOpsTaskType,
} from "@/config/launch-operations";
import { PUBLIC_LAUNCH_WAVE_ID } from "@/config/public-launch";
import { platformVersion } from "@/config/version";
import { getImprovementsDashboard } from "@/lib/improvements/queries";
import { getPublicLaunchDashboard } from "@/lib/launch/public-launch";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  LaunchOperationsTaskRow,
  PublicLaunchActivationRow,
} from "@/types/database";
import type { LiveLaunchReport } from "@/types/lia";

export type LaunchActivationRecord = {
  id: string;
  startDate: string;
  comment: string;
  responsible: string;
  responsibleId: string | null;
  activatedBy: string | null;
  createdAt: string;
};

export type LaunchDailyMetrics = {
  date: string;
  registrations: number;
  activeUsers: number;
  newProjects: number;
  newExperts: number;
  liaUsed: number;
  applications: number;
  deals: number;
};

export type LaunchHealthItem = {
  id: string;
  area: LaunchHealthArea;
  label: string;
  status: "ok" | "warn" | "fail";
  detail: string;
};

export type LaunchHealthMonitor = {
  status: "healthy" | "attention" | "critical";
  items: LaunchHealthItem[];
};

export type LaunchOperationsTaskView = {
  id: string;
  taskType: LaunchOpsTaskType;
  taskTypeLabel: string;
  title: string;
  description: string;
  status: LaunchOpsTaskStatus;
  statusLabel: string;
  createdAt: string;
};

export type RoleOpsSlice = {
  entrepreneurs: string[];
  experts: string[];
  investors: string[];
  organizations: string[];
};

export type PublicLaunchOperationsDashboard = {
  gateMode: string;
  canOperate: boolean;
  wave: {
    id: string | null;
    name: string;
    status: string | null;
    startDate: string | null;
    dayOfLaunch: number | null;
  };
  activation: LaunchActivationRecord | null;
  goals: Array<{ id: string; title: string; progress: number; current: number; target: number }>;
  users: {
    newRegistrations: number;
    activated: number;
    active: number;
  };
  scenarios: RoleOpsSlice;
  daily: LaunchDailyMetrics;
  health: LaunchHealthMonitor;
  tasks: LaunchOperationsTaskView[];
  taskCounts: { new: number; in_progress: number; completed: number };
  feedbackLoop: {
    feedbackPublicLaunch: number;
    openIssues: number;
    improvements: number;
    openCritical: number;
  };
  report: LiveLaunchReport;
};

function dayStartIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildHealth(input: {
  openCritical: number;
  openHigh: number;
  registrations: number;
  activeUsers: number;
  applications: number;
  deals: number;
  liaPct: number;
  retentionD7: number;
  gateActive: boolean;
}): LaunchHealthMonitor {
  const items: LaunchHealthItem[] = [];

  items.push({
    id: "product-errors",
    area: "Product",
    label: "Ошибки / Critical",
    status:
      input.openCritical > 0 ? "fail" : input.openHigh > 3 ? "warn" : "ok",
    detail:
      input.openCritical > 0
        ? `Critical: ${input.openCritical}`
        : input.openHigh > 3
          ? `High в работе: ${input.openHigh}`
          : "Critical = 0",
  });

  items.push({
    id: "product-ux",
    area: "Product",
    label: "Проблемы UX",
    status: input.openHigh > 0 ? "warn" : "ok",
    detail:
      input.openHigh > 0
        ? "Есть High — проверяйте feedback UX / public_launch"
        : "Критических UX-сигналов нет",
  });

  const activationRate =
    input.registrations > 0
      ? Math.round((input.activeUsers / input.registrations) * 100)
      : 0;
  items.push({
    id: "users-activation",
    area: "Users",
    label: "Падение активации",
    status:
      !input.gateActive
        ? "warn"
        : activationRate < 20 && input.registrations >= 10
          ? "fail"
          : activationRate < 40
            ? "warn"
            : "ok",
    detail: `Активация ~${activationRate}% (активные / регистрации)`,
  });

  items.push({
    id: "users-retention",
    area: "Users",
    label: "Резкие потери / retention",
    status:
      input.retentionD7 < 15
        ? "fail"
        : input.retentionD7 < 25
          ? "warn"
          : "ok",
    detail: `D7 retention ${input.retentionD7}%`,
  });

  items.push({
    id: "eco-activity",
    area: "Ecosystem",
    label: "Активность экосистемы",
    status:
      input.applications + input.deals >= 5
        ? "ok"
        : input.applications + input.deals >= 1
          ? "warn"
          : "fail",
    detail: `Заявки ${input.applications} · сделки ${input.deals}`,
  });

  items.push({
    id: "eco-interactions",
    area: "Ecosystem",
    label: "Взаимодействия",
    status: input.liaPct >= 25 ? "ok" : input.liaPct >= 10 ? "warn" : "fail",
    detail: `Лия ${input.liaPct}% · заявки ${input.applications}`,
  });

  items.push({
    id: "business-results",
    area: "Business",
    label: "Результаты",
    status: input.deals >= 3 ? "ok" : input.deals >= 1 ? "warn" : "warn",
    detail: `Сделки: ${input.deals}`,
  });

  // ensure all areas present
  for (const area of LAUNCH_HEALTH_AREAS) {
    if (!items.some((i) => i.area === area)) {
      items.push({
        id: `${area}-ok`,
        area,
        label: area,
        status: "ok",
        detail: "Без дополнительных сигналов",
      });
    }
  }

  const fails = items.filter((i) => i.status === "fail").length;
  const warns = items.filter((i) => i.status === "warn").length;
  const status =
    fails > 0 ? "critical" : warns > 2 ? "attention" : "healthy";

  return { status, items };
}

export function buildLiveLaunchReport(input: {
  dayOfLaunch: number | null;
  users: PublicLaunchOperationsDashboard["users"];
  daily: LaunchDailyMetrics;
  scenarios: RoleOpsSlice;
  health: LaunchHealthMonitor;
  feedbackLoop: PublicLaunchOperationsDashboard["feedbackLoop"];
  taskCounts: PublicLaunchOperationsDashboard["taskCounts"];
}): LiveLaunchReport {
  const issues = input.health.items
    .filter((i) => i.status !== "ok")
    .map((i) => `[${i.area}] ${i.label}: ${i.detail}`);

  const recommendations: string[] = [];
  if (input.health.status === "critical") {
    recommendations.push("Сначала закрыть Critical и fail-пункты LaunchHealthMonitor");
  }
  if (input.taskCounts.new + input.taskCounts.in_progress > 0) {
    recommendations.push(
      `Закрыть операционные задачи: new ${input.taskCounts.new}, in_progress ${input.taskCounts.in_progress}`,
    );
  }
  recommendations.push(
    "Ежедневно: регистрации · активация · связи · feedback public_launch",
  );
  recommendations.push(
    "Цепочка: User feedback → Launch issue → Product improvement (source public_launch)",
  );

  return {
    summary: [
      `Live Launch · день ${input.dayOfLaunch ?? "—"}.`,
      `Health: ${input.health.status}.`,
      `Сегодня: рег. ${input.daily.registrations}, активные ${input.daily.activeUsers}, проекты ${input.daily.newProjects}.`,
      `Версия ${platformVersion.version}. Только анализ.`,
    ].join(" "),
    users: [
      `Новые регистрации (волна): ${input.users.newRegistrations}`,
      `Активированные: ${input.users.activated}`,
      `Активные: ${input.users.active}`,
      `За сегодня регистраций: ${input.daily.registrations}`,
    ],
    activity: [
      `Проекты сегодня: ${input.daily.newProjects}`,
      `Эксперты сегодня: ${input.daily.newExperts}`,
      `Лия сегодня: ${input.daily.liaUsed}`,
      ...input.scenarios.entrepreneurs.map((s) => `Предприниматель: ${s}`),
      ...input.scenarios.experts.map((s) => `Эксперт: ${s}`),
      ...input.scenarios.investors.map((s) => `Инвестор: ${s}`),
      ...input.scenarios.organizations.map((s) => `Организация: ${s}`),
    ],
    ecosystem: [
      `Заявки сегодня: ${input.daily.applications}`,
      `Сделки сегодня: ${input.daily.deals}`,
      `Feedback public_launch: ${input.feedbackLoop.feedbackPublicLaunch}`,
      `Open issues: ${input.feedbackLoop.openIssues}`,
    ],
    issues:
      issues.length > 0
        ? issues
        : ["Критических operational issues не выявлено"],
    recommendations,
  };
}

export async function getPublicLaunchOperationsDashboard(): Promise<PublicLaunchOperationsDashboard> {
  const launch = await getPublicLaunchDashboard();
  const improvements = await getImprovementsDashboard();

  const dayOfLaunch = launch.plan90.dayOfLaunch;
  const canOperate = launch.gate.mode === "active";

  let activation: LaunchActivationRecord | null = null;
  let tasks: LaunchOperationsTaskView[] = [];
  const daily: LaunchDailyMetrics = {
    date: todayDate(),
    registrations: 0,
    activeUsers: launch.metrics.activeUsers,
    newProjects: 0,
    newExperts: 0,
    liaUsed: 0,
    applications: 0,
    deals: 0,
  };

  const since = dayStartIso();

  if (hasSupabaseEnv()) {
    try {
      const supabase = createClient();
      const [
        activationRes,
        tasksRes,
        eventsRes,
        projectsToday,
        expertsToday,
        appsToday,
        dealsToday,
        liaToday,
        regsToday,
      ] = await Promise.all([
        supabase
          .from("public_launch_activations")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("launch_operations_tasks")
          .select("*")
          .eq("wave_id", PUBLIC_LAUNCH_WAVE_ID)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("analytics_events")
          .select("event_type, created_at, user_id")
          .gte("created_at", since)
          .limit(5000),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
        supabase
          .from("expert_profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
        supabase
          .from("deals")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
        supabase
          .from("lia_sessions")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .in("event_type", [
            "registration_completed",
            "user_registered",
            "public_registration",
          ])
          .gte("created_at", since),
      ]);

      const act = activationRes.data as PublicLaunchActivationRow | null;
      if (act) {
        let responsibleName = "Команда ЦКР";
        if (act.responsible_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", act.responsible_id)
            .maybeSingle();
          responsibleName =
            (profile as { full_name?: string } | null)?.full_name ||
            responsibleName;
        }
        activation = {
          id: act.id,
          startDate: act.start_date,
          comment: act.comment,
          responsible: responsibleName,
          responsibleId: act.responsible_id,
          activatedBy: act.activated_by,
          createdAt: act.created_at,
        };
      }

      tasks = ((tasksRes.data ?? []) as LaunchOperationsTaskRow[]).map(
        (row) => ({
          id: row.id,
          taskType: row.task_type,
          taskTypeLabel: launchOpsTaskTypeLabels[row.task_type],
          title: row.title,
          description: row.description,
          status: row.status,
          statusLabel: launchOpsTaskStatusLabels[row.status],
          createdAt: row.created_at,
        }),
      );

      daily.newProjects = projectsToday.count ?? 0;
      daily.newExperts = expertsToday.count ?? 0;
      daily.applications = appsToday.count ?? 0;
      daily.deals = dealsToday.count ?? 0;
      daily.liaUsed = liaToday.count ?? 0;
      daily.registrations = regsToday.count ?? 0;

      // refine active users today from events
      const activeSet = new Set<string>();
      for (const e of eventsRes.data ?? []) {
        const uid = (e as { user_id?: string | null }).user_id;
        if (uid) activeSet.add(uid);
      }
      if (activeSet.size > 0) daily.activeUsers = activeSet.size;
    } catch {
      // миграция может отсутствовать
    }
  }

  const openHigh =
    improvements.problems.filter(
      (p) =>
        p.severity === "high" &&
        (p.status === "open" || p.status === "in_progress"),
    ).length +
    improvements.improvements.filter(
      (i) =>
        i.priority === "high" &&
        (i.status === "planned" || i.status === "in_progress"),
    ).length;

  const health = buildHealth({
    openCritical: launch.metrics.openCritical,
    openHigh,
    registrations: launch.metrics.registrations,
    activeUsers: launch.metrics.activeUsers,
    applications: launch.metrics.applications,
    deals: launch.metrics.deals,
    liaPct: launch.metrics.liaPct,
    retentionD7: launch.metrics.retentionD7,
    gateActive: canOperate,
  });

  const scenarios: RoleOpsSlice = {
    entrepreneurs: [
      `Проекты: ${launch.metrics.projects}`,
      `Лия: ${launch.metrics.liaUsed} (${launch.metrics.liaPct}%)`,
      `Заявки: ${launch.metrics.applications}`,
    ],
    experts: [
      `Профили: ${launch.metrics.experts}`,
      `Взаимодействия (заявки): ${launch.metrics.applications}`,
    ],
    investors: [
      `Интересы: ${launch.metrics.interests}`,
      `Заявки: ${launch.metrics.applications}`,
    ],
    organizations: [
      `Проекты/сигнал: ${launch.metrics.projects}`,
      `Партнёрства: ${launch.metrics.partnerships}`,
    ],
  };

  const taskCounts = {
    new: tasks.filter((t) => t.status === "new").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const feedbackLoop = {
    feedbackPublicLaunch: launch.metrics.feedbackPublicLaunch,
    openIssues: launch.metrics.openIssues,
    improvements: launch.metrics.improvementsInProgress,
    openCritical: launch.metrics.openCritical,
  };

  const users = {
    newRegistrations: launch.metrics.registrations,
    activated: Math.min(launch.metrics.activeUsers, launch.metrics.registrations),
    active: launch.metrics.activeUsers,
  };

  const report = buildLiveLaunchReport({
    dayOfLaunch,
    users,
    daily,
    scenarios,
    health,
    feedbackLoop,
    taskCounts,
  });

  return {
    gateMode: launch.gate.mode,
    canOperate,
    wave: {
      id: launch.wave?.id ?? null,
      name: launch.wave?.name ?? "Public Launch Wave 1",
      status: launch.wave?.status ?? null,
      startDate: launch.wave?.start_date ?? activation?.startDate ?? null,
      dayOfLaunch,
    },
    activation,
    goals: launch.goals.map((g) => ({
      id: g.id,
      title: g.title,
      progress: g.progress,
      current: Number(g.current_value),
      target: Number(g.target_value),
    })),
    users,
    scenarios,
    daily,
    health,
    tasks,
    taskCounts,
    feedbackLoop,
    report,
  };
}

export async function buildLiveLaunchReportAsync(): Promise<LiveLaunchReport> {
  const dashboard = await getPublicLaunchOperationsDashboard();
  return dashboard.report;
}
