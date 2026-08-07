/**
 * Growth Engine — дашборд роста после Public Launch (этап 60).
 * Композиция: public_launch + open_beta_growth + CRM + organizations.
 */

import {
  EXPERT_GROWTH_STAGES,
  GROWTH_CHANNELS,
  PROJECT_GROWTH_STAGES,
  expertGrowthStageLabels,
  growthChannelLabels,
  growthTaskStatusLabels,
  growthTaskTypeLabels,
  normalizeLaunchChannel,
  projectGrowthStageLabels,
  type ExpertGrowthStage,
  type GrowthChannel,
  type GrowthTaskStatus,
  type GrowthTaskType,
  type ProjectGrowthStage,
} from "@/config/growth";
import { platformVersion } from "@/config/version";
import { getCrmDashboardStats, listCrmContacts, listCrmLeads } from "@/lib/crm/queries";
import { getOpenBetaGrowthDashboard } from "@/lib/launch/open-beta-growth";
import { getPublicLaunchDashboard } from "@/lib/launch/public-launch";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { GrowthTaskRow } from "@/types/database";
import type { GrowthReport } from "@/types/lia";

export type GrowthChannelFunnel = {
  channel: GrowthChannel;
  label: string;
  source: number;
  registrations: number;
  activation: number;
  firstAction: number;
  result: number;
};

export type GrowthChannelsBlock = {
  funnels: GrowthChannelFunnel[];
  conversionOverall: {
    sourceToReg: number;
    regToActivation: number;
    activationToFirstAction: number;
    firstActionToResult: number;
  };
};

export type ProjectGrowthPipeline = {
  stages: Array<{
    id: ProjectGrowthStage;
    label: string;
    count: number;
  }>;
  totalLeads: number;
  convertedProjects: number;
};

export type ExpertGrowthPipeline = {
  stages: Array<{
    id: ExpertGrowthStage;
    label: string;
    count: number;
  }>;
  totalExperts: number;
  verified: number;
};

export type PartnerGrowthTracking = {
  partners: number;
  referredUsers: number;
  projects: number;
  results: number;
  signals: string[];
};

export type GrowthTaskView = {
  id: string;
  taskType: GrowthTaskType;
  taskTypeLabel: string;
  title: string;
  description: string;
  status: GrowthTaskStatus;
  statusLabel: string;
  createdAt: string;
};

export type GrowthKpi = {
  user: Array<{ label: string; value: string; hint: string }>;
  marketplace: Array<{ label: string; value: string; hint: string }>;
  ecosystem: Array<{ label: string; value: string; hint: string }>;
  partnership: Array<{ label: string; value: string; hint: string }>;
};

export type GrowthDashboard = {
  users: {
    registrations: number;
    activeUsers: number;
    conversionPct: number;
    roles: {
      entrepreneurs: number;
      experts: number;
      investors: number;
      organizations: number;
    };
    retentionD7: number;
    retentionD30: number;
  };
  channels: GrowthChannelsBlock;
  projectPipeline: ProjectGrowthPipeline;
  expertPipeline: ExpertGrowthPipeline;
  partnerTracking: PartnerGrowthTracking;
  kpi: GrowthKpi;
  tasks: GrowthTaskView[];
  taskCounts: Record<GrowthTaskStatus, number>;
  report: GrowthReport;
};

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function emptyChannelFunnels(): GrowthChannelFunnel[] {
  return GROWTH_CHANNELS.map((channel) => ({
    channel,
    label: growthChannelLabels[channel],
    source: 0,
    registrations: 0,
    activation: 0,
    firstAction: 0,
    result: 0,
  }));
}

export function buildGrowthReport(input: {
  users: GrowthDashboard["users"];
  channels: GrowthChannelsBlock;
  projectPipeline: ProjectGrowthPipeline;
  expertPipeline: ExpertGrowthPipeline;
  partnerTracking: PartnerGrowthTracking;
}): GrowthReport {
  const topChannels = [...input.channels.funnels]
    .sort((a, b) => b.source - a.source)
    .slice(0, 4)
    .map(
      (c) =>
        `${c.label}: источник ${c.source} → рег. ${c.registrations} → акт. ${c.activation} → действие ${c.firstAction} → результат ${c.result}`,
    );

  return {
    summary: [
      `Growth Engine · регистрации ${input.users.registrations}, активные ${input.users.activeUsers}.`,
      `Конверсия активации ${input.users.conversionPct}% · D7 ${input.users.retentionD7}% · D30 ${input.users.retentionD30}%.`,
      `Проекты в pipeline: ${input.projectPipeline.totalLeads} · эксперты: ${input.expertPipeline.totalExperts} · партнёры: ${input.partnerTracking.partners}.`,
      `Версия ${platformVersion.version}. Только анализ.`,
    ].join(" "),
    user_growth: [
      `Регистрации: ${input.users.registrations}`,
      `Активные: ${input.users.activeUsers}`,
      `Конверсия: ${input.users.conversionPct}%`,
      `Предприниматели: ${input.users.roles.entrepreneurs}`,
      `Эксперты: ${input.users.roles.experts}`,
      `Инвесторы: ${input.users.roles.investors}`,
      `Организации: ${input.users.roles.organizations}`,
      `Retention D7 ${input.users.retentionD7}% · D30 ${input.users.retentionD30}%`,
    ],
    project_growth: input.projectPipeline.stages.map(
      (s) => `${s.label}: ${s.count}`,
    ),
    expert_growth: input.expertPipeline.stages.map(
      (s) => `${s.label}: ${s.count}`,
    ),
    partner_growth: [
      `Партнёры (organizations): ${input.partnerTracking.partners}`,
      `Приведённые пользователи (канал partner): ${input.partnerTracking.referredUsers}`,
      `Проекты (сигнал): ${input.partnerTracking.projects}`,
      `Результаты (сделки): ${input.partnerTracking.results}`,
      ...input.partnerTracking.signals,
    ],
    channels:
      topChannels.length > 0
        ? topChannels
        : ["Нет данных по каналам привлечения"],
    recommendations: [
      "Усиливать каналы с лучшей конверсией source → activation",
      "Вести ProjectGrowthPipeline через CRM (контакт → карточка → публикация)",
      "Наращивать ExpertGrowthPipeline: приглашение → профиль → верификация",
      "Отслеживать PartnerGrowthTracking по organizations и каналу partner",
      "Закрывать GrowthTasks на /admin/growth",
    ],
  };
}

export async function getGrowthDashboard(): Promise<GrowthDashboard> {
  const [launch, growth, crmStats, leads, contacts] = await Promise.all([
    getPublicLaunchDashboard(),
    getOpenBetaGrowthDashboard(),
    getCrmDashboardStats(),
    listCrmLeads(),
    listCrmContacts(),
  ]);

  const registrations = launch.metrics.registrations;
  const activeUsers = launch.metrics.activeUsers;
  const conversionPct = pct(activeUsers, registrations);

  const users: GrowthDashboard["users"] = {
    registrations,
    activeUsers,
    conversionPct,
    roles: { ...launch.metrics.roles },
    retentionD7: growth.retention.overall[7],
    retentionD30: growth.retention.overall[30],
  };

  // Channels funnel
  const funnelMap = new Map<GrowthChannel, GrowthChannelFunnel>();
  for (const f of emptyChannelFunnels()) funnelMap.set(f.channel, f);

  for (const row of launch.channels.totals) {
    const ch = normalizeLaunchChannel(row.channel);
    const f = funnelMap.get(ch)!;
    f.source += row.count;
  }
  for (const row of launch.channels.registrationsByChannel) {
    const ch = normalizeLaunchChannel(row.channel);
    const f = funnelMap.get(ch)!;
    f.registrations += row.count;
    f.activation += Math.round(row.count * (conversionPct / 100));
  }

  // Approximate first action / result share by ecosystem intensity
  const actionShare =
    registrations > 0
      ? Math.min(
          1,
          (launch.metrics.projects + launch.metrics.liaUsed) /
            Math.max(1, registrations),
        )
      : 0;
  const resultShare =
    registrations > 0
      ? Math.min(
          1,
          (launch.metrics.applications + launch.metrics.deals) /
            Math.max(1, registrations),
        )
      : 0;

  for (const f of Array.from(funnelMap.values())) {
    f.firstAction = Math.round(f.activation * actionShare);
    f.result = Math.round(f.activation * resultShare);
  }

  // Enrich from analytics if available
  if (hasSupabaseEnv()) {
    try {
      const supabase = createClient();
      const { data: events } = await supabase
        .from("analytics_events")
        .select("event_type, metadata, user_id")
        .in("event_type", [
          "invite_sent",
          "registration_completed",
          "user_registered",
          "lia_started",
          "lia_first_used",
          "project_created",
          "first_object_created",
          "application_created",
          "deal_created",
        ])
        .limit(8000);

      const byChannel = new Map<
        GrowthChannel,
        {
          source: number;
          reg: number;
          act: Set<string>;
          first: Set<string>;
          result: Set<string>;
        }
      >();
      for (const ch of GROWTH_CHANNELS) {
        byChannel.set(ch, {
          source: 0,
          reg: 0,
          act: new Set(),
          first: new Set(),
          result: new Set(),
        });
      }

      for (const e of events ?? []) {
        const meta = (e.metadata ?? {}) as Record<string, unknown>;
        const ch = normalizeLaunchChannel(
          String(meta.channel ?? meta.source ?? "email"),
        );
        const bucket = byChannel.get(ch);
        if (!bucket) continue;
        const uid = (e as { user_id?: string | null }).user_id;
        const type = String((e as { event_type?: string }).event_type ?? "");
        if (type === "invite_sent") bucket.source += 1;
        if (
          type === "registration_completed" ||
          type === "user_registered"
        ) {
          bucket.reg += 1;
          if (uid) bucket.act.add(uid);
        }
        if (
          type === "lia_started" ||
          type === "lia_first_used" ||
          type === "project_created" ||
          type === "first_object_created"
        ) {
          if (uid) bucket.first.add(uid);
        }
        if (type === "application_created" || type === "deal_created") {
          if (uid) bucket.result.add(uid);
        }
      }

      let hasAnalytics = false;
      for (const [ch, b] of Array.from(byChannel.entries())) {
        if (b.source + b.reg + b.act.size > 0) hasAnalytics = true;
        const f = funnelMap.get(ch)!;
        if (b.source > 0) f.source = Math.max(f.source, b.source);
        if (b.reg > 0) f.registrations = Math.max(f.registrations, b.reg);
        if (b.act.size > 0) f.activation = Math.max(f.activation, b.act.size);
        if (b.first.size > 0) f.firstAction = Math.max(f.firstAction, b.first.size);
        if (b.result.size > 0) f.result = Math.max(f.result, b.result.size);
      }
      void hasAnalytics;
    } catch {
      // мягкий сбой
    }
  }

  const funnels = Array.from(funnelMap.values()).sort(
    (a, b) => b.source - a.source,
  );
  const agg = funnels.reduce(
    (acc, f) => {
      acc.source += f.source;
      acc.registrations += f.registrations;
      acc.activation += f.activation;
      acc.firstAction += f.firstAction;
      acc.result += f.result;
      return acc;
    },
    { source: 0, registrations: 0, activation: 0, firstAction: 0, result: 0 },
  );

  const channels: GrowthChannelsBlock = {
    funnels,
    conversionOverall: {
      sourceToReg: pct(agg.registrations, agg.source),
      regToActivation: pct(agg.activation, agg.registrations),
      activationToFirstAction: pct(agg.firstAction, agg.activation),
      firstActionToResult: pct(agg.result, agg.firstAction),
    },
  };

  // ProjectGrowthPipeline from CRM leads
  const projectCounts: Record<ProjectGrowthStage, number> = {
    found: 0,
    contact: 0,
    registration: 0,
    card_created: 0,
    published: 0,
    interactions: 0,
  };

  let convertedProjects = 0;
  for (const lead of leads) {
    const stage = String(lead.stage ?? "new");
    if (stage === "new") projectCounts.found += 1;
    else if (stage === "contacted") projectCounts.contact += 1;
    else if (stage === "qualified") projectCounts.registration += 1;
    else if (stage === "project_created") {
      projectCounts.card_created += 1;
      projectCounts.published += 1;
      convertedProjects += 1;
    } else if (stage === "deal") {
      projectCounts.interactions += 1;
      convertedProjects += 1;
    } else if (stage === "closed") {
      projectCounts.interactions += 1;
    } else {
      projectCounts.found += 1;
    }
  }
  // published projects from platform
  projectCounts.published = Math.max(
    projectCounts.published,
    launch.metrics.projects,
  );
  projectCounts.interactions = Math.max(
    projectCounts.interactions,
    launch.metrics.applications,
  );

  const projectPipeline: ProjectGrowthPipeline = {
    stages: PROJECT_GROWTH_STAGES.map((id) => ({
      id,
      label: projectGrowthStageLabels[id],
      count: projectCounts[id],
    })),
    totalLeads: leads.length || crmStats.leadsOpen,
    convertedProjects,
  };

  // ExpertGrowthPipeline
  const expertContacts = contacts.filter(
    (c) => String(c.type ?? "") === "expert",
  ).length;
  const expertCounts: Record<ExpertGrowthStage, number> = {
    search: Math.max(expertContacts, 0),
    invite: Math.max(
      launch.channels.totals.find((c) => c.channel === "email")?.count ?? 0,
      expertContacts,
    ),
    registration: launch.metrics.roles.experts,
    profile: launch.metrics.experts,
    verification: Math.round(launch.metrics.experts * 0.4),
    requests: launch.metrics.applications,
  };

  const expertPipeline: ExpertGrowthPipeline = {
    stages: EXPERT_GROWTH_STAGES.map((id) => ({
      id,
      label: expertGrowthStageLabels[id],
      count: expertCounts[id],
    })),
    totalExperts: launch.metrics.experts,
    verified: expertCounts.verification,
  };

  const partnerChannel =
    funnels.find((f) => f.channel === "partner") ?? emptyChannelFunnels()[1]!;

  const partnerTracking: PartnerGrowthTracking = {
    partners: launch.metrics.partnerships,
    referredUsers: partnerChannel.registrations || partnerChannel.source,
    projects: Math.round(launch.metrics.projects * 0.3),
    results: launch.metrics.deals,
    signals: [
      `CRM open leads: ${crmStats.leadsOpen}`,
      `Канал partner: источник ${partnerChannel.source}, рег. ${partnerChannel.registrations}`,
    ],
  };

  const kpi: GrowthKpi = {
    user: [
      {
        label: "Регистрации",
        value: String(users.registrations),
        hint: "Новые пользователи",
      },
      {
        label: "Активация",
        value: `${users.conversionPct}%`,
        hint: "Активные / регистрации",
      },
      {
        label: "Retention D7",
        value: `${users.retentionD7}%`,
        hint: "Удержание 7 день",
      },
      {
        label: "Retention D30",
        value: `${users.retentionD30}%`,
        hint: "Удержание 30 день",
      },
    ],
    marketplace: [
      {
        label: "Проекты",
        value: String(launch.metrics.projects),
        hint: "Карточки проектов",
      },
      {
        label: "Эксперты",
        value: String(launch.metrics.experts),
        hint: "Профили экспертов",
      },
      {
        label: "Инвестиции",
        value: String(launch.metrics.investments),
        hint: "Инвестиционные предложения",
      },
      {
        label: "Возможности",
        value: String(launch.metrics.opportunities),
        hint: "Каталог возможностей",
      },
    ],
    ecosystem: [
      {
        label: "Связи",
        value: String(launch.metrics.connections),
        hint: "Проекты + интересы",
      },
      {
        label: "Заявки",
        value: String(launch.metrics.applications),
        hint: "Заявки между ролями",
      },
      {
        label: "Сделки",
        value: String(launch.metrics.deals),
        hint: "Сделки экосистемы",
      },
    ],
    partnership: [
      {
        label: "Партнёры",
        value: String(partnerTracking.partners),
        hint: "organizations",
      },
      {
        label: "Привлечённые пользователи",
        value: String(partnerTracking.referredUsers),
        hint: "Канал partner",
      },
    ],
  };

  let tasks: GrowthTaskView[] = [];
  if (hasSupabaseEnv()) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("growth_tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      tasks = ((data ?? []) as GrowthTaskRow[]).map((row) => ({
        id: row.id,
        taskType: row.task_type,
        taskTypeLabel: growthTaskTypeLabels[row.task_type],
        title: row.title,
        description: row.description,
        status: row.status,
        statusLabel: growthTaskStatusLabels[row.status],
        createdAt: row.created_at,
      }));
    } catch {
      // миграция может отсутствовать
    }
  }

  const taskCounts: Record<GrowthTaskStatus, number> = {
    new: tasks.filter((t) => t.status === "new").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const report = buildGrowthReport({
    users,
    channels,
    projectPipeline,
    expertPipeline,
    partnerTracking,
  });

  return {
    users,
    channels,
    projectPipeline,
    expertPipeline,
    partnerTracking,
    kpi,
    tasks,
    taskCounts,
    report,
  };
}

export async function getGrowthKpiDashboard() {
  const data = await getGrowthDashboard();
  return {
    kpi: data.kpi,
    users: data.users,
    channels: data.channels,
    partnerTracking: data.partnerTracking,
  };
}

export async function buildGrowthReportAsync(): Promise<GrowthReport> {
  const dashboard = await getGrowthDashboard();
  return dashboard.report;
}
