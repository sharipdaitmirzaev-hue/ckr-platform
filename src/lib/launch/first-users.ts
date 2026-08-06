/**
 * First Users Wave — дашборд и FirstUsersReport (этап 50).
 * Только анализ существующих сущностей: invites, analytics, feedback, issues, lia.
 */

import {
  FIRST_USERS_JOURNEY_STEPS,
  FIRST_USERS_ROLE_TARGETS,
  FIRST_USERS_SUCCESS_METRICS,
  FIRST_USERS_WAVE_ID,
  FIRST_USERS_WAVE_NAME,
  type FirstUsersJourneyStepKey,
  type FirstUsersRoleKey,
} from "@/config/first-users-wave";
import {
  goalProgressPercent,
  launchGoalMetricLabels,
  type LaunchGoalMetricType,
} from "@/config/launch-goals";
import { listLaunchGoals, type LaunchGoalView } from "@/lib/launch/goals";
import { listLaunchWaves } from "@/lib/launch/waves";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { BetaInviteRow, LaunchWaveRow } from "@/types/database";
import type { FirstUsersReport } from "@/types/lia";

export type FirstUsersCounts = {
  invited: number;
  registered: number;
  active: number;
  completed: number;
  disabled: number;
};

export type FirstUsersScenarioStats = {
  key: FirstUsersRoleKey;
  label: string;
  targetMin: number;
  targetMax: number;
  invited: number;
  registered: number;
  active: number;
  checks: string[];
};

export type FirstUsersProblem = {
  id: string;
  title: string;
  priority: string;
  status: string;
};

export type FirstUsersLiaActivity = {
  dialogues: number;
  scenarios: Array<{ scenario: string; count: number }>;
};

export type FirstUsersJourneyRow = {
  inviteId: string;
  email: string;
  role: string;
  source: string;
  inviteStatus: string;
  userId: string | null;
  completedSteps: FirstUsersJourneyStepKey[];
  stoppedAt: string;
  durationHours: number | null;
  questions: string[];
};

export type FirstUsersMetrics = {
  invited: number;
  registered: number;
  active: number;
  activationPct: number;
  firstAction: number;
  firstActionPct: number;
  liaUsed: number;
  liaPct: number;
  feedbackSent: number;
  entrepreneurs: number;
  experts: number;
  investors: number;
  organizations: number;
  projects: number;
  expertProfiles: number;
  interests: number;
};

export type FirstUsersDashboard = {
  wave: LaunchWaveRow | null;
  goals: LaunchGoalView[];
  users: FirstUsersCounts;
  scenarios: FirstUsersScenarioStats[];
  problems: FirstUsersProblem[];
  problemSummary: { total: number; byPriority: Record<string, number> };
  lia: FirstUsersLiaActivity;
  journeys: FirstUsersJourneyRow[];
  metrics: FirstUsersMetrics;
  successMetrics: readonly string[];
  report: FirstUsersReport;
};

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function hoursBetween(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.round(((b - a) / 36e5) * 10) / 10;
}

function emptyMetrics(): FirstUsersMetrics {
  return {
    invited: 0,
    registered: 0,
    active: 0,
    activationPct: 0,
    firstAction: 0,
    firstActionPct: 0,
    liaUsed: 0,
    liaPct: 0,
    feedbackSent: 0,
    entrepreneurs: 0,
    experts: 0,
    investors: 0,
    organizations: 0,
    projects: 0,
    expertProfiles: 0,
    interests: 0,
  };
}

function emptyDashboard(): FirstUsersDashboard {
  return {
    wave: null,
    goals: [],
    users: { invited: 0, registered: 0, active: 0, completed: 0, disabled: 0 },
    scenarios: Object.entries(FIRST_USERS_ROLE_TARGETS).map(([key, meta]) => ({
      key: key as FirstUsersRoleKey,
      label: meta.label,
      targetMin: meta.min,
      targetMax: meta.max,
      invited: 0,
      registered: 0,
      active: 0,
      checks: meta.checks,
    })),
    problems: [],
    problemSummary: { total: 0, byPriority: {} },
    lia: { dialogues: 0, scenarios: [] },
    journeys: [],
    metrics: emptyMetrics(),
    successMetrics: FIRST_USERS_SUCCESS_METRICS,
    report: {
      summary: "Нет данных First Users Wave. Примените миграцию 480000.",
      activation: [],
      user_behavior: [],
      problems: [],
      success_cases: [],
      recommendations: ["Примените миграцию first_users_wave."],
    },
  };
}

function roleKeyFromInviteRole(role: string): FirstUsersRoleKey | null {
  if (role === "entrepreneur") return "entrepreneurs";
  if (role === "expert") return "experts";
  if (role === "investor") return "investors";
  if (role === "company") return "organizations";
  return null;
}

export function firstUsersMetricValueForGoal(
  title: string,
  metrics: FirstUsersMetrics,
): number | null {
  const t = title.toLowerCase();
  if (t.includes("предпринимател")) return metrics.entrepreneurs;
  if (t.includes("эксперт")) return metrics.experts;
  if (t.includes("инвестор")) return metrics.investors;
  if (t.includes("организац")) return metrics.organizations;
  if (t.includes("активация")) return metrics.activationPct;
  if (t.includes("первого действия") || t.includes("первое действие")) {
    return metrics.firstActionPct;
  }
  if (t.includes("лию") || t.includes("лия")) return metrics.liaPct;
  if (t.includes("feedback")) return metrics.feedbackSent;
  return null;
}

export function buildFirstUsersReportFromDashboard(
  data: Omit<FirstUsersDashboard, "report">,
): FirstUsersReport {
  const { metrics, users, problems, lia, journeys, wave } = data;
  const recommendations: string[] = [];

  if (users.invited < 8) {
    recommendations.push(
      "Дослать приглашения до целевой когорты (5–10 предпринимателей + эксперты/инвесторы/орг.).",
    );
  }
  if (metrics.activationPct < 70) {
    recommendations.push(
      "Поднять активацию приглашений: напоминания, ясный CTA на /register.",
    );
  }
  if (metrics.firstActionPct < 50) {
    recommendations.push(
      "Усилить подсказку «Что хотите сделать?» и первый путь роли в кабинете.",
    );
  }
  if (metrics.liaPct < 40) {
    recommendations.push(
      "Провести участников через стартовый сценарий Лии (идея / поиск решения).",
    );
  }
  if (metrics.feedbackSent < 5) {
    recommendations.push(
      "Собрать structured feedback: что понравилось / непонятно / мешает.",
    );
  }
  if (problems.length > 0) {
    recommendations.push(
      "Разобрать открытые pilot_issues и продвинуть в product_improvements.",
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Когорта идёт по плану — зафиксируйте success cases и готовьте выводы волны.",
    );
  }

  const stuck = journeys.filter(
    (j) => j.stoppedAt !== "Создание объекта" && j.userId,
  );
  const success = journeys.filter((j) =>
    j.completedSteps.includes("object"),
  );

  return {
    summary: [
      `${wave?.name ?? FIRST_USERS_WAVE_NAME}: срез первого запуска.`,
      `Приглашено ${users.invited}, зарегистрировано ${users.registered}, активно ${users.active}.`,
      `Лия: ${lia.dialogues} диалогов. Feedback: ${metrics.feedbackSent}. Проблемы: ${problems.length}.`,
    ].join(" "),
    activation: [
      `Приглашено: ${users.invited}`,
      `Зарегистрировано: ${users.registered} (${metrics.activationPct}% от приглашённых)`,
      `Активно: ${users.active}`,
      `Завершили сценарий: ${users.completed}`,
      `Первое действие: ${metrics.firstAction} (${metrics.firstActionPct}%)`,
      `Лия: ${metrics.liaUsed} (${metrics.liaPct}%)`,
    ],
    user_behavior: [
      `Предприниматели (invite/reg): ${metrics.entrepreneurs}`,
      `Эксперты: ${metrics.experts} · профилей: ${metrics.expertProfiles}`,
      `Инвесторы: ${metrics.investors} · интересов: ${metrics.interests}`,
      `Организации: ${metrics.organizations}`,
      `Проектов создано: ${metrics.projects}`,
      stuck.length
        ? `Остановились на пути: ${stuck
            .slice(0, 5)
            .map((j) => `${j.email} → ${j.stoppedAt}`)
            .join("; ")}`
        : "Явных остановок по зарегистрированным нет",
    ],
    problems:
      problems.length > 0
        ? problems
            .slice(0, 8)
            .map((p) => `[${p.priority}] ${p.title} (${p.status})`)
        : ["Открытых pilot_issues по волне пока нет"],
    success_cases:
      success.length > 0
        ? success
            .slice(0, 5)
            .map(
              (j) =>
                `${j.email} (${j.role}): дошёл до создания объекта` +
                (j.durationHours != null
                  ? `, ~${j.durationHours} ч`
                  : ""),
            )
        : [
            "Пока нет завершённых путей до создания объекта — ждём активность когорты",
          ],
    recommendations,
  };
}

export async function getFirstUsersDashboard(): Promise<FirstUsersDashboard> {
  const base = emptyDashboard();
  if (!hasSupabaseEnv()) return base;

  try {
    const waves = await listLaunchWaves();
    const wave =
      waves.find((w) => w.id === FIRST_USERS_WAVE_ID) ??
      waves.find((w) => w.name === FIRST_USERS_WAVE_NAME) ??
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
      feedbackRes,
      issuesRes,
      sessionsRes,
      messagesRes,
      projectsRes,
      expertsRes,
      interestsRes,
      orgsRes,
    ] = await Promise.all([
      supabase
        .from("beta_invites")
        .select("*")
        .eq("source", "first_users_wave")
        .order("created_at", { ascending: false })
        .limit(500),
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
          "lia_first_used",
          "lia_started",
          "first_lia_use",
          "project_created",
          "expert_profile_created",
          "first_project_created",
          "first_project",
          "investment_interest_created",
          "first_interest_created",
          "feedback_sent",
        ])
        .limit(8000),
      supabase
        .from("feedback")
        .select("id, user_id, type, message, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("pilot_issues")
        .select("id, title, priority, status")
        .in("status", ["open", "in_progress", "new", "triaged"])
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("lia_sessions")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("lia_messages")
        .select("id, metadata")
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase
        .from("expert_profiles")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("investor_interests")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("organizations")
        .select("id", { count: "exact", head: true }),
    ]);

    let invites = (invitesRes.data ?? []) as BetaInviteRow[];
    // До миграции / пока нет source=first_users_wave — показываем недавние invites
    if (invites.length === 0) {
      const fallback = await supabase
        .from("beta_invites")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      invites = (fallback.data ?? []) as BetaInviteRow[];
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
    const feedbackUsers = new Set<string>();
    for (const e of events) {
      if (!e.user_id) continue;
      const list = eventsByUser.get(e.user_id) ?? [];
      list.push({ event_type: e.event_type, created_at: e.created_at });
      eventsByUser.set(e.user_id, list);
      if (e.event_type === "feedback_sent") feedbackUsers.add(e.user_id);
    }

    const feedbackRows = (feedbackRes.data ?? []) as Array<{
      id: string;
      user_id: string | null;
      type: string;
      message: string;
      created_at: string;
    }>;
    for (const f of feedbackRows) {
      if (f.user_id) feedbackUsers.add(f.user_id);
    }

    const users: FirstUsersCounts = {
      invited: invites.filter((i) =>
        ["invited", "created", "sent", "activated", "active", "completed", "used"].includes(
          i.status,
        ),
      ).length,
      registered: invites.filter((i) =>
        ["activated", "active", "completed", "used"].includes(i.status),
      ).length,
      active: invites.filter((i) =>
        ["active", "activated", "used"].includes(i.status),
      ).length,
      completed: invites.filter((i) => i.status === "completed").length,
      disabled: invites.filter((i) =>
        ["disabled", "expired"].includes(i.status),
      ).length,
    };

    const scenarioMap = new Map<FirstUsersRoleKey, FirstUsersScenarioStats>();
    for (const [key, meta] of Object.entries(FIRST_USERS_ROLE_TARGETS)) {
      scenarioMap.set(key as FirstUsersRoleKey, {
        key: key as FirstUsersRoleKey,
        label: meta.label,
        targetMin: meta.min,
        targetMax: meta.max,
        invited: 0,
        registered: 0,
        active: 0,
        checks: meta.checks,
      });
    }
    for (const invite of invites) {
      const key = roleKeyFromInviteRole(invite.role);
      if (!key) continue;
      const row = scenarioMap.get(key);
      if (!row) continue;
      row.invited += 1;
      if (["activated", "active", "completed", "used"].includes(invite.status)) {
        row.registered += 1;
      }
      if (["active", "activated", "used"].includes(invite.status)) {
        row.active += 1;
      }
    }

    const problems: FirstUsersProblem[] = (
      (issuesRes.data ?? []) as Array<{
        id: string;
        title: string;
        priority: string;
        status: string;
      }>
    ).map((item) => ({
      id: item.id,
      title: item.title,
      priority: item.priority ?? "medium",
      status: item.status,
    }));

    const byPriority: Record<string, number> = {};
    for (const p of problems) {
      byPriority[p.priority] = (byPriority[p.priority] ?? 0) + 1;
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
    const lia: FirstUsersLiaActivity = {
      dialogues: sessionsRes.count ?? 0,
      scenarios: Array.from(scenarioCounts.entries())
        .map(([scenario, count]) => ({ scenario, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
    };

    const questionHints = feedbackRows
      .filter(
        (f) =>
          f.type === "question" ||
          /непонят|как\s|что\s+такое|мешает|блок/i.test(f.message),
      )
      .slice(0, 40);

    const journeys: FirstUsersJourneyRow[] = invites.map((invite) => {
      const userId = invite.used_by;
      const userEvents = userId ? eventsByUser.get(userId) ?? [] : [];
      const eventTypes = new Set(userEvents.map((e) => e.event_type));
      const completedSteps: FirstUsersJourneyStepKey[] = [];
      for (const step of FIRST_USERS_JOURNEY_STEPS) {
        if (step.events.some((ev) => eventTypes.has(ev))) {
          completedSteps.push(step.key);
        } else if (
          step.key === "registration" &&
          ["activated", "active", "completed", "used"].includes(invite.status)
        ) {
          completedSteps.push(step.key);
        }
      }
      const next = FIRST_USERS_JOURNEY_STEPS.find(
        (s) => !completedSteps.includes(s.key),
      );
      const lastEventAt =
        userEvents.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]?.created_at ?? invite.used_at;
      const questions = questionHints
        .filter((q) => q.user_id === userId)
        .map((q) => q.message.slice(0, 120));

      return {
        inviteId: invite.id,
        email: invite.email,
        role: invite.role,
        source: invite.source ?? "manual",
        inviteStatus: invite.status,
        userId,
        completedSteps,
        stoppedAt: next?.label ?? "Создание объекта",
        durationHours: hoursBetween(
          invite.used_at ?? invite.created_at,
          lastEventAt,
        ),
        questions,
      };
    });

    const registeredUsers = new Set(
      invites
        .map((i) => i.used_by)
        .filter((id): id is string => Boolean(id)),
    );
    let firstAction = 0;
    let liaUsed = 0;
    for (const userId of registeredUsers) {
      const types = new Set(
        (eventsByUser.get(userId) ?? []).map((e) => e.event_type),
      );
      if (
        types.has("first_object_created") ||
        types.has("project_created") ||
        types.has("expert_profile_created") ||
        types.has("first_project_created") ||
        types.has("first_project") ||
        types.has("investment_interest_created")
      ) {
        firstAction += 1;
      }
      if (
        types.has("lia_first_used") ||
        types.has("lia_started") ||
        types.has("first_lia_use")
      ) {
        liaUsed += 1;
      }
    }

    const entrepreneurs =
      scenarioMap.get("entrepreneurs")?.registered ?? 0;
    const experts = scenarioMap.get("experts")?.registered ?? 0;
    const investors = scenarioMap.get("investors")?.registered ?? 0;
    const organizations = Math.max(
      scenarioMap.get("organizations")?.registered ?? 0,
      orgsRes.count ?? 0,
    );

    const metrics: FirstUsersMetrics = {
      invited: users.invited,
      registered: users.registered,
      active: users.active,
      activationPct: pct(users.registered, users.invited),
      firstAction,
      firstActionPct: pct(firstAction, Math.max(users.registered, 1)),
      liaUsed,
      liaPct: pct(liaUsed, Math.max(users.registered, 1)),
      feedbackSent: Math.max(
        feedbackUsers.size,
        events.filter((e) => e.event_type === "feedback_sent").length,
        feedbackRows.length,
      ),
      entrepreneurs,
      experts,
      investors,
      organizations,
      projects: projectsRes.count ?? 0,
      expertProfiles: expertsRes.count ?? 0,
      interests: interestsRes.count ?? 0,
    };

    const partial = {
      wave,
      goals,
      users,
      scenarios: Array.from(scenarioMap.values()),
      problems,
      problemSummary: { total: problems.length, byPriority },
      lia,
      journeys,
      metrics,
      successMetrics: FIRST_USERS_SUCCESS_METRICS,
    };

    return {
      ...partial,
      report: buildFirstUsersReportFromDashboard(partial),
    };
  } catch {
    return emptyDashboard();
  }
}

export async function buildFirstUsersReport(): Promise<FirstUsersReport> {
  const dashboard = await getFirstUsersDashboard();
  return dashboard.report;
}
