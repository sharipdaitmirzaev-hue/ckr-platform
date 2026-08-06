/**
 * Beta Expansion Wave — дашборд, сравнение с First Users, решение (этап 53).
 */

import {
  BETA_EXPANSION_ACTIVATION_TARGETS,
  BETA_EXPANSION_DECISIONS,
  BETA_EXPANSION_ECOSYSTEM_TARGETS,
  BETA_EXPANSION_INVITE_SOURCE,
  BETA_EXPANSION_JOURNEY_STEPS,
  BETA_EXPANSION_ROLE_TARGETS,
  BETA_EXPANSION_WAVE_ID,
  BETA_EXPANSION_WAVE_NAME,
  betaExpansionDecisionHints,
  type BetaExpansionDecision,
  type BetaExpansionJourneyStepKey,
  type BetaExpansionRoleKey,
} from "@/config/beta-expansion";
import {
  launchGoalMetricLabels,
  type LaunchGoalMetricType,
} from "@/config/launch-goals";
import { getImprovementsDashboard } from "@/lib/improvements/queries";
import { getFirstUsersDashboard } from "@/lib/launch/first-users";
import {
  goalProgressPercent,
  listLaunchGoals,
  type LaunchGoalView,
} from "@/lib/launch/goals";
import { listLaunchWaves } from "@/lib/launch/waves";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { BetaInviteRow, LaunchWaveRow } from "@/types/database";
import type { BetaExpansionReport } from "@/types/lia";

export type BetaExpansionCounts = {
  invited: number;
  registered: number;
  active: number;
  completed: number;
};

export type BetaExpansionRoleRow = {
  key: BetaExpansionRoleKey;
  label: string;
  targetMin: number;
  targetMax: number;
  target: number;
  invited: number;
  registered: number;
  active: number;
  checks: string[];
};

export type BetaExpansionMetrics = {
  invited: number;
  registered: number;
  active: number;
  registrationPct: number;
  profileCompleted: number;
  profilePct: number;
  liaUsed: number;
  liaPct: number;
  firstObject: number;
  firstObjectPct: number;
  entrepreneurs: number;
  experts: number;
  investors: number;
  organizations: number;
  projects: number;
  expertInteractions: number;
  interests: number;
  applications: number;
  deals: number;
  feedbackSent: number;
};

export type WaveCompareSlice = {
  name: string;
  invited: number;
  registered: number;
  active: number;
  registrationPct: number;
  profilePct: number;
  liaPct: number;
  firstActionPct: number;
  projects: number;
};

export type FeedbackLoopCompare = {
  beforeFix: string[];
  afterFix: string[];
  openIssues: number;
  releasedImprovements: number;
  plannedImprovements: number;
};

export type BetaExpansionDecisionBlock = {
  decision: BetaExpansionDecision;
  label: string;
  hint: string;
  readiness: number;
  risks: string[];
  recommendations: string[];
};

export type BetaExpansionJourneyRow = {
  inviteId: string;
  email: string;
  role: string;
  inviteStatus: string;
  userId: string | null;
  completedSteps: BetaExpansionJourneyStepKey[];
  stoppedAt: string;
};

export type BetaExpansionDashboard = {
  wave: LaunchWaveRow | null;
  goals: LaunchGoalView[];
  users: BetaExpansionCounts;
  roles: BetaExpansionRoleRow[];
  metrics: BetaExpansionMetrics;
  ecosystem: {
    projects: number;
    expertInteractions: number;
    interests: number;
    applications: number;
    deals: number;
    connectionsHint: string;
  };
  journey: BetaExpansionJourneyRow[];
  compare: {
    firstUsers: WaveCompareSlice;
    betaExpansion: WaveCompareSlice;
  };
  feedbackLoop: FeedbackLoopCompare;
  decision: BetaExpansionDecisionBlock;
  report: BetaExpansionReport;
  lia: { dialogues: number; scenarios: Array<{ scenario: string; count: number }> };
};

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

function roleKeyFromInviteRole(role: string): BetaExpansionRoleKey | null {
  if (role === "entrepreneur") return "entrepreneurs";
  if (role === "expert") return "experts";
  if (role === "investor") return "investors";
  if (role === "company") return "organizations";
  return null;
}

function emptyDashboard(): BetaExpansionDashboard {
  const emptyMetrics: BetaExpansionMetrics = {
    invited: 0,
    registered: 0,
    active: 0,
    registrationPct: 0,
    profileCompleted: 0,
    profilePct: 0,
    liaUsed: 0,
    liaPct: 0,
    firstObject: 0,
    firstObjectPct: 0,
    entrepreneurs: 0,
    experts: 0,
    investors: 0,
    organizations: 0,
    projects: 0,
    expertInteractions: 0,
    interests: 0,
    applications: 0,
    deals: 0,
    feedbackSent: 0,
  };
  const emptySlice: WaveCompareSlice = {
    name: "—",
    invited: 0,
    registered: 0,
    active: 0,
    registrationPct: 0,
    profilePct: 0,
    liaPct: 0,
    firstActionPct: 0,
    projects: 0,
  };
  const decision = buildDecision(emptyMetrics, { openCritical: 0, openHigh: 0 });
  return {
    wave: null,
    goals: [],
    users: { invited: 0, registered: 0, active: 0, completed: 0 },
    roles: Object.entries(BETA_EXPANSION_ROLE_TARGETS).map(([key, meta]) => ({
      key: key as BetaExpansionRoleKey,
      label: meta.label,
      targetMin: meta.min,
      targetMax: meta.max,
      target: meta.target,
      invited: 0,
      registered: 0,
      active: 0,
      checks: meta.checks,
    })),
    metrics: emptyMetrics,
    ecosystem: {
      projects: 0,
      expertInteractions: 0,
      interests: 0,
      applications: 0,
      deals: 0,
      connectionsHint: "Нет данных — примените миграцию beta_expansion_wave.",
    },
    journey: [],
    compare: { firstUsers: emptySlice, betaExpansion: emptySlice },
    feedbackLoop: {
      beforeFix: ["Нет данных Product Fix / First Users"],
      afterFix: ["Нет данных после Product Fix"],
      openIssues: 0,
      releasedImprovements: 0,
      plannedImprovements: 0,
    },
    decision,
    report: buildBetaExpansionReport({
      metrics: emptyMetrics,
      roles: [],
      lia: { dialogues: 0, scenarios: [] },
      feedbackLoop: {
        beforeFix: [],
        afterFix: [],
        openIssues: 0,
        releasedImprovements: 0,
        plannedImprovements: 0,
      },
      decision,
      compareNote: "Нет данных.",
    }),
    lia: { dialogues: 0, scenarios: [] },
  };
}

export function betaExpansionMetricValueForGoal(
  title: string,
  metrics: BetaExpansionMetrics,
): number | null {
  const t = title.toLowerCase();
  if (t.includes("предпринимател")) return metrics.entrepreneurs;
  if (t.includes("экспертных взаимодейств")) return metrics.expertInteractions;
  if (t.includes("эксперт")) return metrics.experts;
  if (t.includes("инвестор") && t.includes("интерес")) return metrics.interests;
  if (t.includes("инвестор")) return metrics.investors;
  if (t.includes("организац")) return metrics.organizations;
  if (t.includes("регистрац")) return metrics.registrationPct;
  if (t.includes("профиль")) return metrics.profilePct;
  if (t.includes("лию") || t.includes("лия")) return metrics.liaPct;
  if (t.includes("первый объект") || t.includes("первого объект")) {
    return metrics.firstObjectPct;
  }
  if (t.includes("проект")) return metrics.projects;
  if (t.includes("заявк")) return metrics.applications;
  if (t.includes("сделк") || t.includes("партнёр")) return metrics.deals;
  return null;
}

export function decideBetaExpansion(input: {
  registrationPct: number;
  profilePct: number;
  liaPct: number;
  firstObjectPct: number;
  projects: number;
  applications: number;
  interests: number;
  deals: number;
  openCritical: number;
  openHigh: number;
  registered: number;
}): BetaExpansionDecision {
  if (input.openCritical > 0 || input.registered < 8) {
    return "needs_improvement";
  }
  if (
    input.registrationPct >= BETA_EXPANSION_ACTIVATION_TARGETS.registrationPct &&
    input.profilePct >= BETA_EXPANSION_ACTIVATION_TARGETS.profilePct &&
    input.liaPct >= BETA_EXPANSION_ACTIVATION_TARGETS.liaPct &&
    input.firstObjectPct >= BETA_EXPANSION_ACTIVATION_TARGETS.firstObjectPct &&
    input.projects >= BETA_EXPANSION_ECOSYSTEM_TARGETS.projects &&
    input.applications >= BETA_EXPANSION_ECOSYSTEM_TARGETS.applications &&
    input.interests >= BETA_EXPANSION_ECOSYSTEM_TARGETS.interests &&
    input.openHigh <= 2 &&
    input.deals >= BETA_EXPANSION_ECOSYSTEM_TARGETS.deals
  ) {
    return "open_beta_ready";
  }
  if (
    input.registrationPct >= 60 &&
    input.profilePct >= 50 &&
    input.openCritical === 0
  ) {
    return "continue_beta";
  }
  return "needs_improvement";
}

function buildDecision(
  metrics: BetaExpansionMetrics,
  issues: { openCritical: number; openHigh: number },
): BetaExpansionDecisionBlock {
  const decision = decideBetaExpansion({
    registrationPct: metrics.registrationPct,
    profilePct: metrics.profilePct,
    liaPct: metrics.liaPct,
    firstObjectPct: metrics.firstObjectPct,
    projects: metrics.projects,
    applications: metrics.applications,
    interests: metrics.interests,
    deals: metrics.deals,
    openCritical: issues.openCritical,
    openHigh: issues.openHigh,
    registered: metrics.registered,
  });

  const risks: string[] = [];
  if (metrics.registrationPct < BETA_EXPANSION_ACTIVATION_TARGETS.registrationPct) {
    risks.push(
      `Регистрация ${metrics.registrationPct}% < ${BETA_EXPANSION_ACTIVATION_TARGETS.registrationPct}%`,
    );
  }
  if (metrics.liaPct < BETA_EXPANSION_ACTIVATION_TARGETS.liaPct) {
    risks.push(`Лия ${metrics.liaPct}% < ${BETA_EXPANSION_ACTIVATION_TARGETS.liaPct}%`);
  }
  if (metrics.firstObjectPct < BETA_EXPANSION_ACTIVATION_TARGETS.firstObjectPct) {
    risks.push(
      `Первый объект ${metrics.firstObjectPct}% < ${BETA_EXPANSION_ACTIVATION_TARGETS.firstObjectPct}%`,
    );
  }
  if (metrics.projects < BETA_EXPANSION_ECOSYSTEM_TARGETS.projects) {
    risks.push(
      `Проектов ${metrics.projects} < ${BETA_EXPANSION_ECOSYSTEM_TARGETS.projects}`,
    );
  }
  if (issues.openCritical > 0) {
    risks.push(`Открытых Critical: ${issues.openCritical}`);
  }
  if (issues.openHigh > 2) {
    risks.push(`Открытых High: ${issues.openHigh}`);
  }
  if (risks.length === 0) {
    risks.push("Критических рисков по текущему срезу нет");
  }

  const recommendations: string[] = [betaExpansionDecisionHints[decision]];
  if (decision === "needs_improvement") {
    recommendations.push(
      "Закрыть Critical/High в /admin/product-sprint и /admin/improvements",
    );
    recommendations.push("Дожать путь: Профиль → Лия → Первое действие");
  } else if (decision === "continue_beta") {
    recommendations.push("Донабрать роли до целевых диапазонов когорты");
    recommendations.push("Усилить экспертные взаимодействия и интересы инвесторов");
  } else {
    recommendations.push("Зафиксировать success cases и критерии open beta");
    recommendations.push("Не добавлять новые модули — масштабировать сценарии");
  }

  const readiness = Math.round(
    (pct(metrics.registrationPct, BETA_EXPANSION_ACTIVATION_TARGETS.registrationPct) +
      pct(metrics.profilePct, BETA_EXPANSION_ACTIVATION_TARGETS.profilePct) +
      pct(metrics.liaPct, BETA_EXPANSION_ACTIVATION_TARGETS.liaPct) +
      pct(metrics.firstObjectPct, BETA_EXPANSION_ACTIVATION_TARGETS.firstObjectPct) +
      pct(metrics.projects, BETA_EXPANSION_ECOSYSTEM_TARGETS.projects)) /
      5,
  );

  return {
    decision,
    label: {
      continue_beta: "Продолжить beta",
      open_beta_ready: "Готовы к open beta",
      needs_improvement: "Нужны улучшения",
    }[decision],
    hint: betaExpansionDecisionHints[decision],
    readiness: Math.min(100, readiness),
    risks,
    recommendations,
  };
}

export function buildBetaExpansionReport(input: {
  metrics: BetaExpansionMetrics;
  roles: BetaExpansionRoleRow[];
  lia: BetaExpansionDashboard["lia"];
  feedbackLoop: FeedbackLoopCompare;
  decision: BetaExpansionDecisionBlock;
  compareNote: string;
}): BetaExpansionReport {
  const { metrics, roles, lia, feedbackLoop, decision, compareNote } = input;

  return {
    summary: [
      `${BETA_EXPANSION_WAVE_NAME}: срез расширенной beta.`,
      `Приглашено ${metrics.invited}, зарегистрировано ${metrics.registered}, активно ${metrics.active}.`,
      `Решение: ${decision.decision}.`,
    ].join(" "),
    activation: [
      `Регистрация: ${metrics.registrationPct}% (цель ${BETA_EXPANSION_ACTIVATION_TARGETS.registrationPct}%)`,
      `Профиль: ${metrics.profilePct}% (цель ${BETA_EXPANSION_ACTIVATION_TARGETS.profilePct}%)`,
      `Лия: ${metrics.liaPct}% (цель ${BETA_EXPANSION_ACTIVATION_TARGETS.liaPct}%)`,
      `Первый объект: ${metrics.firstObjectPct}% (цель ${BETA_EXPANSION_ACTIVATION_TARGETS.firstObjectPct}%)`,
      `Готовность: ${decision.readiness}%`,
    ],
    role_analysis:
      roles.length > 0
        ? roles.map(
            (r) =>
              `${r.label}: invite ${r.invited} / reg ${r.registered} / active ${r.active} (цель ${r.targetMin}–${r.targetMax})`,
          )
        : ["Роли: данных пока нет"],
    lia_usage: [
      `Диалогов: ${lia.dialogues}`,
      `Использовали Лию: ${metrics.liaUsed} (${metrics.liaPct}%)`,
      ...(lia.scenarios.length > 0
        ? lia.scenarios
            .slice(0, 6)
            .map((s) => `${s.scenario}: ${s.count}`)
        : ["Размеченных сценариев пока нет"]),
    ],
    ecosystem_growth: [
      `Проекты: ${metrics.projects} (цель ${BETA_EXPANSION_ECOSYSTEM_TARGETS.projects})`,
      `Экспертные взаимодействия: ${metrics.expertInteractions} (цель ${BETA_EXPANSION_ECOSYSTEM_TARGETS.expertInteractions})`,
      `Интересы инвесторов: ${metrics.interests} (цель ${BETA_EXPANSION_ECOSYSTEM_TARGETS.interests})`,
      `Заявки: ${metrics.applications} (цель ${BETA_EXPANSION_ECOSYSTEM_TARGETS.applications})`,
      `Сделки/партнёрства: ${metrics.deals} (цель ${BETA_EXPANSION_ECOSYSTEM_TARGETS.deals})`,
      compareNote,
    ],
    problems: [
      ...feedbackLoop.beforeFix.slice(0, 4).map((p) => `До Product Fix: ${p}`),
      ...feedbackLoop.afterFix.slice(0, 4).map((p) => `После Product Fix: ${p}`),
      `Открытых issues: ${feedbackLoop.openIssues}`,
      `Released improvements: ${feedbackLoop.releasedImprovements}`,
    ],
    recommendations: decision.recommendations,
  };
}

export async function getBetaExpansionDashboard(): Promise<BetaExpansionDashboard> {
  const base = emptyDashboard();
  if (!hasSupabaseEnv()) return base;

  try {
    const [waves, firstUsers, improvements] = await Promise.all([
      listLaunchWaves(),
      getFirstUsersDashboard(),
      getImprovementsDashboard(),
    ]);

    const wave =
      waves.find((w) => w.id === BETA_EXPANSION_WAVE_ID) ??
      waves.find((w) => w.name === BETA_EXPANSION_WAVE_NAME) ??
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
    const [
      invitesRes,
      eventsRes,
      sessionsRes,
      messagesRes,
      projectsRes,
      expertsRes,
      interestsRes,
      appsRes,
      dealsRes,
      orgsRes,
      issuesRes,
      feedbackRes,
    ] = await Promise.all([
      supabase
        .from("beta_invites")
        .select("*")
        .eq("source", BETA_EXPANSION_INVITE_SOURCE)
        .order("created_at", { ascending: false })
        .limit(800),
      supabase
        .from("analytics_events")
        .select("user_id, event_type, created_at, metadata")
        .in("event_type", [
          "invite_sent",
          "invite_accepted",
          "registration_completed",
          "user_registered",
          "first_login",
          "role_selected",
          "profile_completed",
          "onboarding_completed",
          "first_object_created",
          "first_action",
          "lia_first_used",
          "lia_started",
          "first_lia_use",
          "lia_used",
          "project_created",
          "expert_profile_created",
          "investment_interest_created",
          "activation_after_fix",
          "application_created",
          "deal_created",
          "first_application",
          "first_deal",
          "feedback_sent",
          "product_fix_completed",
        ])
        .limit(12000),
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
        .from("expert_profiles")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("investor_interests")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id", { count: "exact", head: true }),
      supabase
        .from("organizations")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("pilot_issues")
        .select("id, title, severity, status, created_at")
        .in("status", ["open", "in_progress", "new", "triaged"])
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("feedback")
        .select("id, type, message, created_at")
        .order("created_at", { ascending: false })
        .limit(120),
    ]);

    let invites = (invitesRes.data ?? []) as BetaInviteRow[];
    if (invites.length === 0) {
      // Пока нет source=beta_expansion_wave — не подмешиваем First Users invites
      invites = [];
    }

    const events = (eventsRes.data ?? []) as Array<{
      user_id: string | null;
      event_type: string;
      created_at: string;
      metadata: Record<string, unknown> | null;
    }>;

    const eventsByUser = new Map<
      string,
      Array<{ event_type: string; created_at: string }>
    >();
    for (const e of events) {
      if (!e.user_id) continue;
      const list = eventsByUser.get(e.user_id) ?? [];
      list.push({ event_type: e.event_type, created_at: e.created_at });
      eventsByUser.set(e.user_id, list);
    }

    const users: BetaExpansionCounts = {
      invited: invites.filter((i) =>
        [
          "invited",
          "created",
          "sent",
          "activated",
          "active",
          "completed",
          "used",
        ].includes(i.status),
      ).length,
      registered: invites.filter((i) =>
        ["activated", "active", "completed", "used"].includes(i.status),
      ).length,
      active: invites.filter((i) =>
        ["active", "activated", "used"].includes(i.status),
      ).length,
      completed: invites.filter((i) => i.status === "completed").length,
    };

    const roleMap = new Map<BetaExpansionRoleKey, BetaExpansionRoleRow>();
    for (const [key, meta] of Object.entries(BETA_EXPANSION_ROLE_TARGETS)) {
      roleMap.set(key as BetaExpansionRoleKey, {
        key: key as BetaExpansionRoleKey,
        label: meta.label,
        targetMin: meta.min,
        targetMax: meta.max,
        target: meta.target,
        invited: 0,
        registered: 0,
        active: 0,
        checks: meta.checks,
      });
    }
    for (const invite of invites) {
      const key = roleKeyFromInviteRole(invite.role);
      if (!key) continue;
      const row = roleMap.get(key);
      if (!row) continue;
      row.invited += 1;
      if (["activated", "active", "completed", "used"].includes(invite.status)) {
        row.registered += 1;
      }
      if (["active", "activated", "used"].includes(invite.status)) {
        row.active += 1;
      }
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

    const journey: BetaExpansionJourneyRow[] = invites.map((invite) => {
      const userId = invite.used_by;
      const userEvents = userId ? eventsByUser.get(userId) ?? [] : [];
      const eventTypes = new Set(userEvents.map((e) => e.event_type));
      const completedSteps: BetaExpansionJourneyStepKey[] = [];
      for (const step of BETA_EXPANSION_JOURNEY_STEPS) {
        if (step.events.some((ev) => eventTypes.has(ev))) {
          completedSteps.push(step.key);
        } else if (
          step.key === "registration" &&
          ["activated", "active", "completed", "used"].includes(invite.status)
        ) {
          completedSteps.push(step.key);
        }
      }
      const next = BETA_EXPANSION_JOURNEY_STEPS.find(
        (s) => !completedSteps.includes(s.key),
      );
      return {
        inviteId: invite.id,
        email: invite.email,
        role: invite.role,
        inviteStatus: invite.status,
        userId,
        completedSteps,
        stoppedAt: next?.label ?? "Результат",
      };
    });

    const registeredUsers = new Set(
      invites.map((i) => i.used_by).filter((id): id is string => Boolean(id)),
    );
    let profileCompleted = 0;
    let liaUsed = 0;
    let firstObject = 0;
    for (const userId of Array.from(registeredUsers)) {
      const types = new Set(
        (eventsByUser.get(userId) ?? []).map((e) => e.event_type),
      );
      if (
        types.has("profile_completed") ||
        types.has("onboarding_completed")
      ) {
        profileCompleted += 1;
      }
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
        types.has("investment_interest_created") ||
        types.has("activation_after_fix")
      ) {
        firstObject += 1;
      }
    }

    const applications = appsRes.count ?? 0;
    const expertProfiles = expertsRes.count ?? 0;
    const expertInteractions = Math.max(
      applications,
      Math.min(applications + expertProfiles, applications * 2),
    );

    const metrics: BetaExpansionMetrics = {
      invited: users.invited,
      registered: users.registered,
      active: users.active,
      registrationPct: pct(users.registered, users.invited),
      profileCompleted,
      profilePct: pct(profileCompleted, Math.max(users.registered, 1)),
      liaUsed,
      liaPct: pct(liaUsed, Math.max(users.registered, 1)),
      firstObject,
      firstObjectPct: pct(firstObject, Math.max(users.registered, 1)),
      entrepreneurs: roleMap.get("entrepreneurs")?.registered ?? 0,
      experts: roleMap.get("experts")?.registered ?? 0,
      investors: roleMap.get("investors")?.registered ?? 0,
      organizations: Math.max(
        roleMap.get("organizations")?.registered ?? 0,
        orgsRes.count ?? 0,
      ),
      projects: projectsRes.count ?? 0,
      expertInteractions,
      interests: interestsRes.count ?? 0,
      applications,
      deals: dealsRes.count ?? 0,
      feedbackSent: (feedbackRes.data ?? []).length,
    };

    const openIssues = (issuesRes.data ?? []) as Array<{
      id: string;
      title: string;
      severity: string | null;
      status: string;
    }>;
    const openCritical = openIssues.filter(
      (i) => (i.severity ?? "").toLowerCase() === "critical",
    ).length;
    const openHigh = openIssues.filter(
      (i) => (i.severity ?? "").toLowerCase() === "high",
    ).length;

    const released = improvements.improvements.filter(
      (i) => i.status === "released",
    );
    const planned = improvements.improvements.filter(
      (i) => i.status === "planned" || i.status === "in_progress",
    );

    const feedbackLoop: FeedbackLoopCompare = {
      beforeFix:
        released.length > 0
          ? released
              .slice(0, 6)
              .map((i) => `[${i.priority}] ${i.title} → released`)
          : [
              "До Product Fix: Critical/High из First Users Review (см. /admin/product-sprint)",
            ],
      afterFix:
        planned.length + openIssues.length > 0
          ? [
              ...planned
                .slice(0, 4)
                .map((i) => `[${i.priority}] ${i.title} (${i.status})`),
              ...openIssues
                .slice(0, 4)
                .map(
                  (i) =>
                    `[${i.severity ?? "medium"}] ${i.title} (pilot_issue)`,
                ),
            ]
          : ["После Product Fix: открытых Critical/High пока нет"],
      openIssues: openIssues.length,
      releasedImprovements: released.length,
      plannedImprovements: planned.length,
    };

    const decision = buildDecision(metrics, { openCritical, openHigh });

    const firstUsersSlice: WaveCompareSlice = {
      name: firstUsers.wave?.name ?? "First Users Wave",
      invited: firstUsers.metrics.invited,
      registered: firstUsers.metrics.registered,
      active: firstUsers.metrics.active,
      registrationPct: firstUsers.metrics.activationPct,
      profilePct: firstUsers.metrics.activationPct,
      liaPct: firstUsers.metrics.liaPct,
      firstActionPct: firstUsers.metrics.firstActionPct,
      projects: firstUsers.metrics.projects,
    };

    const betaSlice: WaveCompareSlice = {
      name: wave?.name ?? BETA_EXPANSION_WAVE_NAME,
      invited: metrics.invited,
      registered: metrics.registered,
      active: metrics.active,
      registrationPct: metrics.registrationPct,
      profilePct: metrics.profilePct,
      liaPct: metrics.liaPct,
      firstActionPct: metrics.firstObjectPct,
      projects: metrics.projects,
    };

    const compareNote = [
      `Сравнение волн: ${firstUsersSlice.name} reg ${firstUsersSlice.registrationPct}% / lia ${firstUsersSlice.liaPct}% / action ${firstUsersSlice.firstActionPct}%`,
      `vs ${betaSlice.name} reg ${betaSlice.registrationPct}% / lia ${betaSlice.liaPct}% / action ${betaSlice.firstActionPct}%`,
    ].join(" · ");

    const roles = Array.from(roleMap.values());
    const report = buildBetaExpansionReport({
      metrics,
      roles,
      lia,
      feedbackLoop,
      decision,
      compareNote,
    });

    return {
      wave,
      goals,
      users,
      roles,
      metrics,
      ecosystem: {
        projects: metrics.projects,
        expertInteractions: metrics.expertInteractions,
        interests: metrics.interests,
        applications: metrics.applications,
        deals: metrics.deals,
        connectionsHint: compareNote,
      },
      journey,
      compare: { firstUsers: firstUsersSlice, betaExpansion: betaSlice },
      feedbackLoop,
      decision,
      report,
      lia,
    };
  } catch {
    return emptyDashboard();
  }
}

export async function buildBetaExpansionReportAsync(): Promise<BetaExpansionReport> {
  const dashboard = await getBetaExpansionDashboard();
  return dashboard.report;
}

export { BETA_EXPANSION_DECISIONS };
