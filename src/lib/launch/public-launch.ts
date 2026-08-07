/**
 * Public Launch Wave 1 — дашборд, 90 дней, KPI, отчёт (этап 58).
 * Реальный запуск только при PublicLaunchDecision = public_launch.
 */

import {
  LAUNCH_CHANNELS,
  PUBLIC_LAUNCH_90_DAYS,
  PUBLIC_LAUNCH_FEEDBACK_CATEGORIES,
  PUBLIC_LAUNCH_INVITE_SOURCE,
  PUBLIC_LAUNCH_WAVE_ID,
  PUBLIC_LAUNCH_WAVE_NAME,
  launchChannelLabels,
  normalizeLaunchChannel,
  publicLaunchFeedbackCategoryLabels,
  publicLaunchGateMessages,
  type LaunchChannel,
  type PublicLaunch90PhaseId,
  type PublicLaunchFeedbackCategory,
  type PublicLaunchGateMode,
} from "@/config/public-launch";
import {
  goalProgressPercent,
  launchGoalMetricLabels,
  type LaunchGoalMetricType,
} from "@/config/launch-goals";
import { platformVersion } from "@/config/version";
import { getImprovementsDashboard } from "@/lib/improvements/queries";
import { listLaunchGoals, type LaunchGoalView } from "@/lib/launch/goals";
import { getOpenBetaGrowthDashboard } from "@/lib/launch/open-beta-growth";
import { getPublicLaunchDecisionDashboard } from "@/lib/launch/public-launch-decision";
import { listLaunchWaves } from "@/lib/launch/waves";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { BetaInviteRow, LaunchWaveRow } from "@/types/database";
import type { PublicLaunchReport } from "@/types/lia";

export type PublicLaunch90Days = {
  dayOfLaunch: number | null;
  currentPhaseId: PublicLaunch90PhaseId | null;
  phases: Array<{
    id: PublicLaunch90PhaseId;
    range: string;
    label: string;
    goal: string;
    metrics: readonly string[];
    status: "upcoming" | "active" | "completed" | "idle";
  }>;
};

export type LaunchChannelsBlock = {
  totals: Array<{ channel: LaunchChannel; label: string; count: number }>;
  registrationsByChannel: Array<{
    channel: LaunchChannel;
    label: string;
    count: number;
  }>;
};

export type PublicLaunchMetrics = {
  registrations: number;
  activeUsers: number;
  roles: {
    entrepreneurs: number;
    experts: number;
    investors: number;
    organizations: number;
  };
  projects: number;
  experts: number;
  investments: number;
  opportunities: number;
  liaUsed: number;
  liaPct: number;
  connections: number;
  applications: number;
  deals: number;
  interests: number;
  retentionD7: number;
  retentionD30: number;
  partnerships: number;
  feedbackPublicLaunch: number;
  feedbackTotal: number;
  openCritical: number;
  openIssues: number;
  improvementsInProgress: number;
};

export type PublicLaunchKpi = {
  product: Array<{ label: string; value: string; hint: string }>;
  ecosystem: Array<{ label: string; value: string; hint: string }>;
  business: Array<{ label: string; value: string; hint: string }>;
};

export type PublicLaunchDashboard = {
  gate: {
    mode: PublicLaunchGateMode;
    canActivate: boolean;
    message: string;
    decision: string | null;
    decisionComment: string | null;
    responsible: string | null;
    decisionDate: string | null;
  };
  wave: LaunchWaveRow | null;
  goals: LaunchGoalView[];
  plan90: PublicLaunch90Days;
  channels: LaunchChannelsBlock;
  metrics: PublicLaunchMetrics;
  kpi: PublicLaunchKpi;
  feedbackByCategory: Record<PublicLaunchFeedbackCategory, number>;
  report: PublicLaunchReport;
};

function emptyMetrics(): PublicLaunchMetrics {
  return {
    registrations: 0,
    activeUsers: 0,
    roles: {
      entrepreneurs: 0,
      experts: 0,
      investors: 0,
      organizations: 0,
    },
    projects: 0,
    experts: 0,
    investments: 0,
    opportunities: 0,
    liaUsed: 0,
    liaPct: 0,
    connections: 0,
    applications: 0,
    deals: 0,
    interests: 0,
    retentionD7: 0,
    retentionD30: 0,
    partnerships: 0,
    feedbackPublicLaunch: 0,
    feedbackTotal: 0,
    openCritical: 0,
    openIssues: 0,
    improvementsInProgress: 0,
  };
}

function emptyChannels(): LaunchChannelsBlock {
  return {
    totals: LAUNCH_CHANNELS.map((channel) => ({
      channel,
      label: launchChannelLabels[channel],
      count: 0,
    })),
    registrationsByChannel: LAUNCH_CHANNELS.map((channel) => ({
      channel,
      label: launchChannelLabels[channel],
      count: 0,
    })),
  };
}

function emptyFeedback(): Record<PublicLaunchFeedbackCategory, number> {
  return {
    public_launch: 0,
    UX: 0,
    Lia: 0,
    Project: 0,
    Expert: 0,
    Investment: 0,
    Other: 0,
  };
}

function resolveGate(input: {
  decision: string | null;
  waveStatus: string | null;
}): PublicLaunchGateMode {
  if (!input.decision) return "no_decision";
  if (input.decision === "continue_beta") return "continue_beta";
  if (input.decision === "improve_product") return "improve_product";
  if (input.decision === "public_launch") {
    if (input.waveStatus === "active") return "active";
    return "ready";
  }
  return "no_decision";
}

function buildPlan90(startDate: string | null): PublicLaunch90Days {
  if (!startDate) {
    return {
      dayOfLaunch: null,
      currentPhaseId: null,
      phases: PUBLIC_LAUNCH_90_DAYS.map((p) => ({
        id: p.id,
        range: p.range,
        label: p.label,
        goal: p.goal,
        metrics: p.metrics,
        status: "idle" as const,
      })),
    };
  }

  const start = new Date(startDate);
  const now = new Date();
  const dayOfLaunch = Math.max(
    1,
    Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1,
  );

  let currentPhaseId: PublicLaunch90PhaseId | null = null;
  if (dayOfLaunch <= 30) currentPhaseId = "days_1_30";
  else if (dayOfLaunch <= 60) currentPhaseId = "days_31_60";
  else if (dayOfLaunch <= 90) currentPhaseId = "days_61_90";
  else currentPhaseId = "days_61_90";

  const phases = PUBLIC_LAUNCH_90_DAYS.map((p) => {
    let status: "upcoming" | "active" | "completed" | "idle" = "upcoming";
    if (p.id === currentPhaseId) status = "active";
    else if (
      (p.id === "days_1_30" && dayOfLaunch > 30) ||
      (p.id === "days_31_60" && dayOfLaunch > 60)
    ) {
      status = "completed";
    }
    return {
      id: p.id,
      range: p.range,
      label: p.label,
      goal: p.goal,
      metrics: p.metrics,
      status,
    };
  });

  return { dayOfLaunch, currentPhaseId, phases };
}

function buildKpi(metrics: PublicLaunchMetrics): PublicLaunchKpi {
  return {
    product: [
      {
        label: "Регистрации",
        value: String(metrics.registrations),
        hint: "Новые пользователи public / invite",
      },
      {
        label: "Активация",
        value: String(metrics.activeUsers),
        hint: "Активные пользователи волны",
      },
      {
        label: "Retention D7",
        value: `${metrics.retentionD7}%`,
        hint: "Удержание на 7 день",
      },
      {
        label: "Retention D30",
        value: `${metrics.retentionD30}%`,
        hint: "Удержание на 30 день",
      },
    ],
    ecosystem: [
      {
        label: "Проекты",
        value: String(metrics.projects),
        hint: "Созданные проекты",
      },
      {
        label: "Эксперты",
        value: String(metrics.experts),
        hint: "Активные / зарегистрированные эксперты",
      },
      {
        label: "Связи",
        value: String(metrics.connections),
        hint: "Проекты + интересы как сигнал связей",
      },
      {
        label: "Заявки",
        value: String(metrics.applications),
        hint: "Заявки между ролями",
      },
    ],
    business: [
      {
        label: "Партнёрства",
        value: String(metrics.partnerships),
        hint: "Организации / партнёрский сигнал",
      },
      {
        label: "Сделки",
        value: String(metrics.deals),
        hint: "Сделки экосистемы",
      },
      {
        label: "Коммерческие результаты",
        value: String(metrics.deals + metrics.partnerships),
        hint: "Сделки + партнёрства",
      },
      {
        label: "Feedback public_launch",
        value: String(metrics.feedbackPublicLaunch),
        hint: "Отзывы категории public_launch",
      },
    ],
  };
}

export function buildPublicLaunchReport(input: {
  gateMode: PublicLaunchGateMode;
  wave: LaunchWaveRow | null;
  metrics: PublicLaunchMetrics;
  plan90: PublicLaunch90Days;
  channels: LaunchChannelsBlock;
}): PublicLaunchReport {
  const { gateMode, wave, metrics, plan90, channels } = input;
  const topChannels = channels.totals
    .filter((c) => c.count > 0)
    .slice(0, 4)
    .map((c) => `${c.label}: ${c.count}`);

  const risks: string[] = [];
  if (gateMode === "no_decision") {
    risks.push("Decision Gate не зафиксирован — запуск не активирован");
  }
  if (gateMode === "continue_beta") {
    risks.push("Решение continue_beta — публичный запуск не стартует");
  }
  if (gateMode === "improve_product") {
    risks.push("Решение improve_product — запуск остановлен до улучшений");
  }
  if (metrics.openCritical > 0) {
    risks.push(`Открытые Critical: ${metrics.openCritical}`);
  }
  if (metrics.retentionD7 < 25 && gateMode === "active") {
    risks.push(`D7 retention ${metrics.retentionD7}% ниже ориентира 25%`);
  }
  if (metrics.applications + metrics.deals < 3 && gateMode === "active") {
    risks.push("Мало связей (заявки / сделки) на старте public");
  }
  if (risks.length === 0) {
    risks.push("Критических рисков запуска не выявлено");
  }

  const recommendations: string[] = [];
  if (gateMode === "ready") {
    recommendations.push("Подтвердите активацию Public Launch Wave 1");
  } else if (gateMode === "continue_beta") {
    recommendations.push("Продолжайте Open Beta на /admin/open-beta");
  } else if (gateMode === "improve_product") {
    recommendations.push("Закройте Critical/High на /admin/improvements");
  } else if (gateMode === "no_decision") {
    recommendations.push("Пройдите /admin/public-launch-decision");
  } else {
    recommendations.push("Держите feedback loop: users → feedback → issues → improvements");
    recommendations.push("Контролируйте KPI на /admin/public-launch-kpi");
  }

  return {
    summary: [
      `Public Launch · режим ${gateMode}.`,
      wave
        ? `Волна «${wave.name}» · статус ${wave.status}.`
        : "Волна ещё не создана (примените миграцию).",
      plan90.dayOfLaunch
        ? `День запуска: ${plan90.dayOfLaunch} · фаза ${plan90.currentPhaseId}.`
        : "Отсчёт 90 дней начнётся после активации.",
      `Версия ${platformVersion.version}.`,
    ].join(" "),
    users: [
      `Регистрации: ${metrics.registrations}`,
      `Активные: ${metrics.activeUsers}`,
      `Роли — предприниматели: ${metrics.roles.entrepreneurs}, эксперты: ${metrics.roles.experts}, инвесторы: ${metrics.roles.investors}, организации: ${metrics.roles.organizations}`,
      `D7 ${metrics.retentionD7}% · D30 ${metrics.retentionD30}%`,
      ...(topChannels.length ? topChannels.map((c) => `Канал ${c}`) : ["Каналы: нет данных"]),
    ],
    activation: [
      `Лия: ${metrics.liaUsed} (${metrics.liaPct}%)`,
      `Проекты: ${metrics.projects}`,
      `Инвестиции (каталог): ${metrics.investments}`,
      `Возможности: ${metrics.opportunities}`,
    ],
    ecosystem: [
      `Связи: ${metrics.connections}`,
      `Заявки: ${metrics.applications}`,
      `Интересы: ${metrics.interests}`,
      `Сделки: ${metrics.deals}`,
      `Эксперты: ${metrics.experts}`,
    ],
    business_results: [
      `Партнёрства: ${metrics.partnerships}`,
      `Сделки: ${metrics.deals}`,
      `Feedback public_launch: ${metrics.feedbackPublicLaunch} / всего ${metrics.feedbackTotal}`,
      `Improvements in progress: ${metrics.improvementsInProgress}`,
    ],
    risks,
    recommendations,
  };
}

export async function getPublicLaunchDashboard(): Promise<PublicLaunchDashboard> {
  const [decisionDash, growth, improvements] = await Promise.all([
    getPublicLaunchDecisionDashboard(),
    getOpenBetaGrowthDashboard(),
    getImprovementsDashboard(),
  ]);

  const latest = decisionDash.latestDecision;
  let wave: LaunchWaveRow | null = null;
  let goals: LaunchGoalView[] = [];
  const metrics = emptyMetrics();
  const channels = emptyChannels();
  const feedbackByCategory = emptyFeedback();

  metrics.retentionD7 = growth.retention.overall[7];
  metrics.retentionD30 = growth.retention.overall[30];
  metrics.openCritical =
    improvements.problems.filter(
      (p) =>
        p.severity === "critical" &&
        !["done", "closed", "resolved"].includes(p.status),
    ).length +
    improvements.improvements.filter(
      (i) =>
        i.priority === "critical" &&
        (i.status === "planned" || i.status === "in_progress"),
    ).length;
  metrics.openIssues = improvements.counts.problemsOpen;
  metrics.improvementsInProgress = improvements.improvements.filter(
    (i) => i.status === "in_progress" || i.status === "planned",
  ).length;

  if (hasSupabaseEnv()) {
    try {
      const waves = await listLaunchWaves();
      wave =
        waves.find((w) => w.id === PUBLIC_LAUNCH_WAVE_ID) ??
        waves.find((w) => w.name === PUBLIC_LAUNCH_WAVE_NAME) ??
        null;

      if (wave) {
        const goalRows = await listLaunchGoals(wave.id);
        goals = goalRows.map((g) => ({
          ...g,
          progress: goalProgressPercent(
            Number(g.current_value),
            Number(g.target_value),
          ),
          metricLabel:
            launchGoalMetricLabels[g.metric_type as LaunchGoalMetricType] ??
            g.metric_type,
        }));
      }

      const supabase = createClient();
      const [
        invitesRes,
        projectsRes,
        expertsRes,
        investmentsRes,
        opportunitiesRes,
        appsRes,
        dealsRes,
        interestsRes,
        orgsRes,
        sessionsRes,
        feedbackRes,
        profilesRes,
      ] = await Promise.all([
        supabase
          .from("beta_invites")
          .select("*")
          .eq("source", PUBLIC_LAUNCH_INVITE_SOURCE)
          .limit(2000),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase
          .from("expert_profiles")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("investment_offers")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("opportunities")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }),
        supabase
          .from("investor_interests")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("organizations")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("lia_sessions")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("feedback")
          .select("id, category, type")
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("user_roles")
          .select("user_id, role")
          .limit(5000),
      ]);

      const invites = (invitesRes.data ?? []) as BetaInviteRow[];
      const channelCounts = new Map<LaunchChannel, number>();
      const regChannelCounts = new Map<LaunchChannel, number>();
      for (const ch of LAUNCH_CHANNELS) {
        channelCounts.set(ch, 0);
        regChannelCounts.set(ch, 0);
      }

      let registered = 0;
      let activeUsers = 0;
      for (const invite of invites) {
        const ch = normalizeLaunchChannel(invite.channel || "email");
        channelCounts.set(ch, (channelCounts.get(ch) ?? 0) + 1);
        if (
          ["registered", "activated", "active", "completed"].includes(
            invite.status,
          )
        ) {
          registered += 1;
          regChannelCounts.set(ch, (regChannelCounts.get(ch) ?? 0) + 1);
        }
        if (["activated", "active", "completed"].includes(invite.status)) {
          activeUsers += 1;
        }
      }

      // Fallback: если нет invites public_launch — показать open beta growth regs как контекст
      if (invites.length === 0) {
        registered = growth.growth.newRegistrations;
        activeUsers = growth.growth.activeUsers;
        for (const row of growth.growth.channels) {
          const ch = normalizeLaunchChannel(row.channel);
          channelCounts.set(ch, (channelCounts.get(ch) ?? 0) + row.count);
        }
      }

      channels.totals = LAUNCH_CHANNELS.map((channel) => ({
        channel,
        label: launchChannelLabels[channel],
        count: channelCounts.get(channel) ?? 0,
      })).sort((a, b) => b.count - a.count);

      channels.registrationsByChannel = LAUNCH_CHANNELS.map((channel) => ({
        channel,
        label: launchChannelLabels[channel],
        count: regChannelCounts.get(channel) ?? 0,
      })).sort((a, b) => b.count - a.count);

      metrics.registrations = registered;
      metrics.activeUsers = activeUsers;
      metrics.projects = projectsRes.count ?? 0;
      metrics.experts = expertsRes.count ?? 0;
      metrics.investments = investmentsRes.count ?? 0;
      metrics.opportunities = opportunitiesRes.count ?? 0;
      metrics.applications = appsRes.count ?? 0;
      metrics.deals = dealsRes.count ?? 0;
      metrics.interests = interestsRes.count ?? 0;
      metrics.partnerships = orgsRes.count ?? 0;
      metrics.connections = metrics.projects + metrics.interests;
      metrics.liaUsed = sessionsRes.count ?? 0;
      metrics.liaPct =
        registered > 0
          ? Math.round((Math.min(metrics.liaUsed, registered) / registered) * 1000) /
            10
          : 0;

      const roleCounts = {
        entrepreneurs: 0,
        experts: 0,
        investors: 0,
        organizations: 0,
      };
      for (const row of profilesRes.data ?? []) {
        const role = String((row as { role?: string }).role ?? "");
        if (role === "entrepreneur") roleCounts.entrepreneurs += 1;
        else if (role === "expert") roleCounts.experts += 1;
        else if (role === "investor") roleCounts.investors += 1;
        else if (role === "company") roleCounts.organizations += 1;
      }
      metrics.roles = roleCounts;

      for (const fb of feedbackRes.data ?? []) {
        const cat = String(
          (fb as { category?: string | null }).category ?? "Other",
        );
        const key = (
          PUBLIC_LAUNCH_FEEDBACK_CATEGORIES as readonly string[]
        ).includes(cat)
          ? (cat as PublicLaunchFeedbackCategory)
          : "Other";
        feedbackByCategory[key] += 1;
      }
      metrics.feedbackTotal = (feedbackRes.data ?? []).length;
      metrics.feedbackPublicLaunch = feedbackByCategory.public_launch;
    } catch {
      // мягкий сбой без env/migration
    }
  }

  const gateMode = resolveGate({
    decision: latest?.decision ?? null,
    waveStatus: wave?.status ?? null,
  });

  const plan90 = buildPlan90(
    wave?.status === "active" || wave?.status === "completed"
      ? wave.start_date
      : null,
  );
  const kpi = buildKpi(metrics);
  const report = buildPublicLaunchReport({
    gateMode,
    wave,
    metrics,
    plan90,
    channels,
  });

  return {
    gate: {
      mode: gateMode,
      canActivate: gateMode === "ready",
      message: publicLaunchGateMessages[gateMode],
      decision: latest?.decision ?? null,
      decisionComment: latest?.comment ?? null,
      responsible: latest?.responsible ?? null,
      decisionDate: latest?.date ?? null,
    },
    wave,
    goals,
    plan90,
    channels,
    metrics,
    kpi,
    feedbackByCategory,
    report,
  };
}

export async function getPublicLaunchKpiDashboard() {
  const data = await getPublicLaunchDashboard();
  return {
    gate: data.gate,
    wave: data.wave,
    kpi: data.kpi,
    metrics: data.metrics,
    plan90: data.plan90,
  };
}

export async function buildPublicLaunchReportAsync(): Promise<PublicLaunchReport> {
  const dashboard = await getPublicLaunchDashboard();
  return dashboard.report;
}

export { publicLaunchFeedbackCategoryLabels };
