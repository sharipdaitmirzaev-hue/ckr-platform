import {
  LAUNCH_WAVE_IDS,
  type LaunchWaveParticipantStatus,
  type LaunchWaveStatus,
  type LaunchWaveType,
} from "@/config/launch-waves";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  LaunchWaveParticipantRow,
  LaunchWaveRow,
} from "@/types/database";
import type { LaunchStatusReport } from "@/types/lia";

export type LaunchWaveParticipantView = LaunchWaveParticipantRow & {
  full_name: string | null;
  email_hint: string | null;
};

export type LaunchReport = {
  summary: string;
  new_users: number;
  onboarding_completed: number;
  projects_created: number;
  lia_used: number;
  applications: number;
  deals: number;
  activation_rate: number;
  period_label: string;
};

export type TindaProductionCase = {
  status: "production_pilot_case";
  organization: string;
  projectTitle: string;
  waveName: string | null;
  waveStatus: LaunchWaveStatus | null;
  metrics: {
    projects: number;
    lia: number;
    deals: number;
    participants: number;
  };
  results: string[];
};

export type LaunchWaveDashboard = {
  waves: LaunchWaveRow[];
  currentWave: LaunchWaveRow | null;
  participants: LaunchWaveParticipantView[];
  participantCounts: Record<LaunchWaveParticipantStatus, number>;
  activation: {
    invited: number;
    joinedOrActive: number;
    rate: number;
  };
  activity: {
    events7d: number;
    activeUsers7d: number;
  };
  problems: Array<{ id: string; title: string; severity: string; source: string }>;
  results: {
    projects: number;
    applications: number;
    deals: number;
    completedParticipants: number;
  };
  report: LaunchReport;
  tinda: TindaProductionCase;
  statusReport: LaunchStatusReport;
};

function emptyParticipantCounts(): Record<
  LaunchWaveParticipantStatus,
  number
> {
  return {
    invited: 0,
    joined: 0,
    active: 0,
    completed: 0,
    left: 0,
  };
}

function emptyReport(): LaunchReport {
  return {
    summary: "Нет данных волны.",
    new_users: 0,
    onboarding_completed: 0,
    projects_created: 0,
    lia_used: 0,
    applications: 0,
    deals: 0,
    activation_rate: 0,
    period_label: "—",
  };
}

function emptyDashboard(): LaunchWaveDashboard {
  return {
    waves: [],
    currentWave: null,
    participants: [],
    participantCounts: emptyParticipantCounts(),
    activation: { invited: 0, joinedOrActive: 0, rate: 0 },
    activity: { events7d: 0, activeUsers7d: 0 },
    problems: [],
    results: {
      projects: 0,
      applications: 0,
      deals: 0,
      completedParticipants: 0,
    },
    report: emptyReport(),
    tinda: {
      status: "production_pilot_case",
      organization: "ООО ТИНДА",
      projectTitle: "Развитие оптовой платформы ТИНДА",
      waveName: null,
      waveStatus: null,
      metrics: { projects: 0, lia: 0, deals: 0, participants: 0 },
      results: [],
    },
    statusReport: {
      summary: "Нет данных для LaunchStatusReport.",
      activity: [],
      blockers: [],
      recommendations: [],
    },
  };
}

export async function listLaunchWaves(): Promise<LaunchWaveRow[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("launch_waves")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) return [];
    return (data ?? []) as LaunchWaveRow[];
  } catch {
    return [];
  }
}

export async function getActiveLaunchWave(): Promise<LaunchWaveRow | null> {
  const waves = await listLaunchWaves();
  return waves.find((w) => w.status === "active") ?? null;
}

export async function getLaunchWaveDashboard(): Promise<LaunchWaveDashboard> {
  if (!hasSupabaseEnv()) return emptyDashboard();

  try {
    const supabase = createClient();
    const waves = await listLaunchWaves();
    const currentWave =
      waves.find((w) => w.status === "active") ??
      waves.find((w) => w.id === LAUNCH_WAVE_IDS.closed) ??
      null;

    const waveId = currentWave?.id ?? null;
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const waveStart =
      currentWave?.start_date != null
        ? `${currentWave.start_date}T00:00:00.000Z`
        : since7d;

    const [
      participantsRes,
      eventsRes,
      issuesRes,
      improvementsRes,
      projectsRes,
      appsRes,
      dealsRes,
    ] = await Promise.all([
      waveId
        ? supabase
            .from("launch_wave_participants")
            .select("*")
            .eq("wave_id", waveId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as LaunchWaveParticipantRow[] }),
      supabase
        .from("analytics_events")
        .select("event_type, user_id, created_at")
        .gte("created_at", waveStart)
        .limit(5000),
      supabase
        .from("pilot_issues")
        .select("id, title, severity, status")
        .in("status", ["open", "in_progress"])
        .in("severity", ["critical", "high"])
        .limit(20),
      supabase
        .from("product_improvements")
        .select("id, title, priority, status")
        .in("status", ["planned", "in_progress"])
        .in("priority", ["critical", "high"])
        .limit(20),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .gte("created_at", waveStart),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .gte("created_at", waveStart),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .gte("created_at", waveStart),
    ]);

    const participantRows = (participantsRes.data ??
      []) as LaunchWaveParticipantRow[];
    const userIds = participantRows
      .map((p) => p.user_id)
      .filter((id): id is string => Boolean(id));

    const profiles = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      for (const row of profileRows ?? []) {
        profiles.set(row.id as string, (row.full_name as string) ?? "");
      }
    }

    const participants: LaunchWaveParticipantView[] = participantRows.map(
      (p) => ({
        ...p,
        full_name: p.user_id ? profiles.get(p.user_id) ?? null : null,
        email_hint: null,
      }),
    );

    const participantCounts = emptyParticipantCounts();
    for (const p of participants) {
      participantCounts[p.status as LaunchWaveParticipantStatus] += 1;
    }

    const invited = participants.length;
    const joinedOrActive = participants.filter((p) =>
      ["joined", "active", "completed"].includes(p.status),
    ).length;
    const activationRate =
      invited > 0 ? Math.round((joinedOrActive / invited) * 100) : 0;

    const events = (eventsRes.data ?? []) as Array<{
      event_type: string;
      user_id: string | null;
      created_at: string;
    }>;

    const events7d = events.filter((e) => e.created_at >= since7d);
    const activeUsers7d = new Set(
      events7d.map((e) => e.user_id).filter(Boolean),
    ).size;

    const countEvent = (...types: string[]) =>
      events.filter((e) => types.includes(e.event_type)).length;

    const newUsers = countEvent(
      "public_registration",
      "user_registered",
      "registration_completed",
    );
    const onboardingCompleted = countEvent(
      "onboarding_completed",
      "role_selected",
      "profile_completed",
    );
    const projectsCreated = countEvent(
      "first_project",
      "first_project_created",
      "project_created",
    );
    const liaUsed = countEvent("first_lia_use", "lia_used");
    const applications = countEvent(
      "application_sent",
      "first_application_sent",
      "first_expert_request",
    );
    const deals = countEvent("deal_created", "deal_completed");

    const report: LaunchReport = {
      summary:
        currentWave == null
          ? "Активная волна не задана — создайте или активируйте волну."
          : `LaunchReport по «${currentWave.name}»: активация ${activationRate}%, событий с ${currentWave.start_date ?? "старта"} — ${events.length}.`,
      new_users: newUsers,
      onboarding_completed: onboardingCompleted,
      projects_created: Math.max(projectsCreated, projectsRes.count ?? 0),
      lia_used: liaUsed,
      applications: Math.max(applications, appsRes.count ?? 0),
      deals: Math.max(deals, dealsRes.count ?? 0),
      activation_rate: activationRate,
      period_label: currentWave?.start_date
        ? `с ${currentWave.start_date}`
        : "7 дней / с старта волны",
    };

    const problems = [
      ...((issuesRes.data ?? []) as Array<{
        id: string;
        title: string;
        severity: string;
      }>).map((i) => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        source: "pilot_issues",
      })),
      ...((improvementsRes.data ?? []) as Array<{
        id: string;
        title: string;
        priority: string;
      }>).map((i) => ({
        id: i.id,
        title: i.title,
        severity: i.priority,
        source: "product_improvements",
      })),
    ].slice(0, 15);

    const closedWave = waves.find((w) => w.id === LAUNCH_WAVE_IDS.closed);
    const tindaParticipant = participants.find((p) =>
      (p.notes ?? "").toLowerCase().includes("тинда"),
    );

    const tinda: TindaProductionCase = {
      status: "production_pilot_case",
      organization: "ООО ТИНДА",
      projectTitle: "Развитие оптовой платформы ТИНДА",
      waveName: closedWave?.name ?? currentWave?.name ?? null,
      waveStatus:
        (closedWave?.status as LaunchWaveStatus | undefined) ??
        (currentWave?.status as LaunchWaveStatus | null) ??
        null,
      metrics: {
        projects: report.projects_created,
        lia: report.lia_used,
        deals: report.deals,
        participants: tindaParticipant ? 1 : participantCounts.active,
      },
      results: [
        "Организация и проект развития в единой модели ЦКР",
        "Workspace: этапы подготовки → продаж → партнёров",
        "Пилотная сделка и CRM-сегменты",
        "Кейс волны 1 (closed) — production pilot case",
      ],
    };

    const statusReport = buildLaunchStatusReport({
      currentWave,
      activationRate,
      events7d: events7d.length,
      activeUsers7d,
      problems,
      report,
      participantCounts,
    });

    return {
      waves,
      currentWave,
      participants,
      participantCounts,
      activation: {
        invited,
        joinedOrActive,
        rate: activationRate,
      },
      activity: {
        events7d: events7d.length,
        activeUsers7d,
      },
      problems,
      results: {
        projects: report.projects_created,
        applications: report.applications,
        deals: report.deals,
        completedParticipants: participantCounts.completed,
      },
      report,
      tinda,
      statusReport,
    };
  } catch {
    return emptyDashboard();
  }
}

export function buildLaunchStatusReport(input: {
  currentWave: LaunchWaveRow | null;
  activationRate: number;
  events7d: number;
  activeUsers7d: number;
  problems: Array<{ title: string; severity: string }>;
  report: LaunchReport;
  participantCounts: Record<LaunchWaveParticipantStatus, number>;
}): LaunchStatusReport {
  const waveLabel = input.currentWave?.name ?? "нет активной волны";
  const activity: string[] = [
    `Текущая волна: ${waveLabel}`,
    `Активация участников: ${input.activationRate}%`,
    `Активных пользователей за 7 дней: ${input.activeUsers7d}`,
    `Событий за 7 дней: ${input.events7d}`,
    `Онбординг завершён (события): ${input.report.onboarding_completed}`,
    `Проекты / Лия / заявки / сделки: ${input.report.projects_created} / ${input.report.lia_used} / ${input.report.applications} / ${input.report.deals}`,
  ];

  const blockers: string[] = [];
  if (!input.currentWave) {
    blockers.push("Нет активной волны — запуск не управляется.");
  }
  if (input.activationRate < 40 && input.participantCounts.invited > 0) {
    blockers.push(
      `Низкая активация (${input.activationRate}%) — усиливайте онбординг и первый шаг.`,
    );
  }
  if (input.report.lia_used === 0 && input.report.new_users > 0) {
    blockers.push("Новые пользователи не доходят до Лии.");
  }
  if (input.report.projects_created === 0 && input.report.onboarding_completed > 0) {
    blockers.push("После онбординга нет создания проектов.");
  }
  for (const p of input.problems.slice(0, 5)) {
    blockers.push(`[${p.severity}] ${p.title}`);
  }
  if (blockers.length === 0) {
    blockers.push("Критических блокеров по текущим данным не видно.");
  }

  const recommendations: string[] = [
    "Держите одну active-волну; следующие — planned до критериев перехода.",
    "Закрывайте critical/high на /admin/launch и /admin/improvements перед следующей волной.",
    "Следите за LaunchReport: onboarding → проект → Лия → заявка/сделка.",
  ];
  if (input.currentWave?.wave_type === "closed") {
    recommendations.push(
      "Волна closed: наращивайте когорту invites и фиксируйте кейс ТИНДА как production pilot.",
    );
  }
  if (input.currentWave?.wave_type === "public") {
    recommendations.push(
      "Волна public: мониторьте public_registration и SLA поддержки ежедневно.",
    );
  }

  return {
    summary: `Запуск «${waveLabel}»: активация ${input.activationRate}%, активность 7д — ${input.activeUsers7d} пользователей. Только анализ, без изменения доступов.`,
    activity,
    blockers,
    recommendations,
  };
}

export type CreateWaveInput = {
  name: string;
  description: string;
  status: LaunchWaveStatus;
  waveType: LaunchWaveType;
  startDate: string | null;
  endDate: string | null;
};
