/**
 * Open Beta Growth — рост, удержание, ценность действий (этап 56).
 * Только аналитика поверх open_beta + analytics_events + feedback.
 */

import {
  GROWTH_ROLE_LABELS,
  GROWTH_SCALE_CRITERIA,
  OPEN_BETA_GROWTH_DECISIONS,
  RETENTION_DAYS,
  VALUABLE_ACTION_CHAINS,
  openBetaGrowthDecisionHints,
  openBetaGrowthDecisionLabels,
  type GrowthRoleKey,
  type OpenBetaGrowthDecision,
  type RetentionDay,
} from "@/config/open-beta-growth";
import { OPEN_BETA_INVITE_SOURCE } from "@/config/open-beta";
import { platformVersion } from "@/config/version";
import { getImprovementsDashboard } from "@/lib/improvements/queries";
import { getOpenBetaDashboard } from "@/lib/launch/open-beta";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { BetaInviteRow } from "@/types/database";
import type {
  RetentionReport,
  RoleGrowthReport,
  UserValueFeedbackReport,
} from "@/types/lia";

export type RetentionMetrics = {
  overall: Record<RetentionDay, number>;
  byRole: Record<GrowthRoleKey, Record<RetentionDay, number>>;
  cohortSize: number;
  returningUsers: number;
};

export type ValuableActionInsight = {
  id: string;
  label: string;
  returningCoveragePct: number;
  oneTimeCoveragePct: number;
  liftPct: number;
  note: string;
};

export type GrowthEcosystemMetrics = {
  newConnections: number;
  activeInteractions: number;
  applications: number;
  deals: number;
  interests: number;
};

export type OpenBetaGrowthDecisionBlock = {
  decision: OpenBetaGrowthDecision;
  label: string;
  hint: string;
  readiness: number;
  indicators: string[];
  problems: string[];
  recommendations: string[];
};

export type OpenBetaGrowthDashboard = {
  growth: {
    newRegistrations: number;
    activeUsers: number;
    activeRoles: Record<GrowthRoleKey, number>;
    sources: Array<{ source: string; count: number }>;
    channels: Array<{ channel: string; count: number }>;
  };
  retention: RetentionMetrics;
  valuableActions: ValuableActionInsight[];
  roleGrowth: RoleGrowthReport;
  ecosystem: GrowthEcosystemMetrics;
  feedbackValue: UserValueFeedbackReport;
  decision: OpenBetaGrowthDecisionBlock;
  retentionReport: RetentionReport;
  scaleCriteria: readonly string[];
};

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function emptyRetentionByDay(): Record<RetentionDay, number> {
  return { 1: 0, 7: 0, 14: 0, 30: 0 };
}

function roleKeyFromInviteRole(role: string): GrowthRoleKey | null {
  if (role === "entrepreneur") return "entrepreneurs";
  if (role === "expert") return "experts";
  if (role === "investor") return "investors";
  if (role === "company") return "organizations";
  return null;
}

function dayIndex(first: Date, at: Date): number {
  const ms = at.getTime() - first.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function computeRetention(
  firstSeen: Map<string, Date>,
  eventDays: Map<string, Set<number>>,
  roleByUser: Map<string, GrowthRoleKey>,
): RetentionMetrics {
  const cohort = Array.from(firstSeen.keys());
  const overall = emptyRetentionByDay();
  const byRole: RetentionMetrics["byRole"] = {
    entrepreneurs: emptyRetentionByDay(),
    experts: emptyRetentionByDay(),
    investors: emptyRetentionByDay(),
    organizations: emptyRetentionByDay(),
  };
  const roleCohort: Record<GrowthRoleKey, number> = {
    entrepreneurs: 0,
    experts: 0,
    investors: 0,
    organizations: 0,
  };

  for (const userId of cohort) {
    const role = roleByUser.get(userId);
    if (role) roleCohort[role] += 1;
  }

  let returningUsers = 0;
  for (const userId of cohort) {
    const days = eventDays.get(userId) ?? new Set<number>();
    const returned = Array.from(days).some((d) => d >= 1);
    if (returned) returningUsers += 1;

    const role = roleByUser.get(userId);
    for (const day of RETENTION_DAYS) {
      const hit = days.has(day);
      if (hit) {
        // accumulate counts first, convert to % later
        overall[day] += 1;
        if (role) byRole[role][day] += 1;
      }
    }
  }

  const cohortSize = cohort.length;
  for (const day of RETENTION_DAYS) {
    overall[day] = pct(overall[day], cohortSize);
    for (const role of Object.keys(byRole) as GrowthRoleKey[]) {
      byRole[role][day] = pct(byRole[role][day], roleCohort[role]);
    }
  }

  return { overall, byRole, cohortSize, returningUsers };
}

export function decideOpenBetaGrowth(input: {
  d7: number;
  d30: number;
  returningPct: number;
  liaAmongReturningPct: number;
  applications: number;
  interests: number;
  deals: number;
  openCritical: number;
  registered: number;
}): OpenBetaGrowthDecision {
  if (input.openCritical > 0 || input.d7 < 15 || input.registered < 8) {
    return "improve_retention";
  }
  if (
    input.d7 >= 25 &&
    input.d30 >= 15 &&
    input.liaAmongReturningPct >= 40 &&
    input.applications + input.interests + input.deals >= 8 &&
    input.openCritical === 0
  ) {
    return "scale_public";
  }
  if (input.d7 >= 15 && input.returningPct >= 20) {
    return "continue_growth";
  }
  return "improve_retention";
}

export function buildRetentionReport(input: {
  retention: RetentionMetrics;
  valuableActions: ValuableActionInsight[];
  funnelDrops: string[];
  decision: OpenBetaGrowthDecisionBlock;
}): RetentionReport {
  const { retention, valuableActions, funnelDrops, decision } = input;
  const topActions = [...valuableActions]
    .sort((a, b) => b.liftPct - a.liftPct)
    .slice(0, 4);

  return {
    summary: [
      `Удержание Open Beta · когорта ${retention.cohortSize}, вернулись ${retention.returningUsers}.`,
      `D1 ${retention.overall[1]}% · D7 ${retention.overall[7]}% · D14 ${retention.overall[14]}% · D30 ${retention.overall[30]}%.`,
      `Решение: ${decision.decision}.`,
    ].join(" "),
    returning_users: [
      `Вернувшихся: ${retention.returningUsers} (${pct(retention.returningUsers, retention.cohortSize)}% когорты)`,
      `D1: ${retention.overall[1]}%`,
      `D7: ${retention.overall[7]}%`,
      `D14: ${retention.overall[14]}%`,
      `D30: ${retention.overall[30]}%`,
      ...((Object.keys(GROWTH_ROLE_LABELS) as GrowthRoleKey[]).map(
        (role) =>
          `${GROWTH_ROLE_LABELS[role]} D7: ${retention.byRole[role][7]}% · D30: ${retention.byRole[role][30]}%`,
      )),
    ],
    valuable_actions:
      topActions.length > 0
        ? topActions.map(
            (a) =>
              `${a.label}: lift ${a.liftPct}% (returning ${a.returningCoveragePct}% vs one-time ${a.oneTimeCoveragePct}%)`,
          )
        : ["Недостаточно данных для корреляции действий и возврата"],
    drop_off_points:
      funnelDrops.length > 0
        ? funnelDrops
        : ["Явных точек оттока по воронке не выявлено"],
    recommendations: decision.recommendations,
  };
}

export async function getOpenBetaGrowthDashboard(): Promise<OpenBetaGrowthDashboard> {
  const openBeta = await getOpenBetaDashboard();
  const improvements = await getImprovementsDashboard();

  const emptyRoleRetention = (): Record<RetentionDay, number> =>
    emptyRetentionByDay();

  if (!hasSupabaseEnv()) {
    const retention: RetentionMetrics = {
      overall: emptyRetentionByDay(),
      byRole: {
        entrepreneurs: emptyRoleRetention(),
        experts: emptyRoleRetention(),
        investors: emptyRoleRetention(),
        organizations: emptyRoleRetention(),
      },
      cohortSize: 0,
      returningUsers: 0,
    };
    const decision: OpenBetaGrowthDecisionBlock = {
      decision: "improve_retention",
      label: openBetaGrowthDecisionLabels.improve_retention,
      hint: openBetaGrowthDecisionHints.improve_retention,
      readiness: 0,
      indicators: ["Нет данных Supabase"],
      problems: ["Примените миграции и накопите analytics_events"],
      recommendations: [
        "Запустить Open Beta Wave и собрать активность когорты",
      ],
    };
    const roleGrowth: RoleGrowthReport = {
      summary: "Нет данных роста ролей.",
      entrepreneurs: ["Нет данных"],
      experts: ["Нет данных"],
      investors: ["Нет данных"],
      organizations: ["Нет данных"],
    };
    const feedbackValue: UserValueFeedbackReport = {
      summary: "Нет feedback от активных пользователей.",
      active_users: ["0"],
      feedback_themes: ["Нет данных"],
      improvements: ["Нет данных"],
      recommendations: ["Собрать отзывы вернувшихся пользователей"],
    };
    return {
      growth: {
        newRegistrations: 0,
        activeUsers: 0,
        activeRoles: {
          entrepreneurs: 0,
          experts: 0,
          investors: 0,
          organizations: 0,
        },
        sources: [],
        channels: [],
      },
      retention,
      valuableActions: [],
      roleGrowth,
      ecosystem: {
        newConnections: 0,
        activeInteractions: 0,
        applications: 0,
        deals: 0,
        interests: 0,
      },
      feedbackValue,
      decision,
      retentionReport: buildRetentionReport({
        retention,
        valuableActions: [],
        funnelDrops: [],
        decision,
      }),
      scaleCriteria: GROWTH_SCALE_CRITERIA,
    };
  }

  try {
    const supabase = createClient();
    const [invitesRes, eventsRes, feedbackRes, sessionsRes] = await Promise.all(
      [
        supabase
          .from("beta_invites")
          .select("*")
          .eq("source", OPEN_BETA_INVITE_SOURCE)
          .limit(1000),
        supabase
          .from("analytics_events")
          .select("user_id, event_type, created_at, metadata")
          .not("user_id", "is", null)
          .order("created_at", { ascending: true })
          .limit(20000),
        supabase
          .from("feedback")
          .select("id, user_id, type, category, message, priority, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("lia_sessions")
          .select("user_id, created_at")
          .limit(2000),
      ],
    );

    const invites = (invitesRes.data ?? []) as BetaInviteRow[];
    const events = (eventsRes.data ?? []) as Array<{
      user_id: string | null;
      event_type: string;
      created_at: string;
      metadata: Record<string, unknown> | null;
    }>;

    const roleByUser = new Map<string, GrowthRoleKey>();
    const sourceCounts = new Map<string, number>();
    const channelCounts = new Map<string, number>();
    for (const invite of invites) {
      sourceCounts.set(
        invite.source || "manual",
        (sourceCounts.get(invite.source || "manual") ?? 0) + 1,
      );
      channelCounts.set(
        invite.channel || "email",
        (channelCounts.get(invite.channel || "email") ?? 0) + 1,
      );
      if (invite.used_by) {
        const role = roleKeyFromInviteRole(invite.role);
        if (role) roleByUser.set(invite.used_by, role);
      }
    }

    const firstSeen = new Map<string, Date>();
    const eventDays = new Map<string, Set<number>>();
    const eventTypesByUser = new Map<string, Set<string>>();

    for (const e of events) {
      if (!e.user_id) continue;
      const at = new Date(e.created_at);
      if (!firstSeen.has(e.user_id)) firstSeen.set(e.user_id, at);
      const first = firstSeen.get(e.user_id)!;
      const day = dayIndex(first, at);
      if (day >= 0 && day <= 45) {
        const set = eventDays.get(e.user_id) ?? new Set<number>();
        set.add(day);
        eventDays.set(e.user_id, set);
      }
      const types = eventTypesByUser.get(e.user_id) ?? new Set<string>();
      types.add(e.event_type);
      eventTypesByUser.set(e.user_id, types);
    }

    // Prefer open beta registered users as cohort when available
    const cohortUsers = new Set<string>();
    for (const invite of invites) {
      if (invite.used_by) cohortUsers.add(invite.used_by);
    }
    if (cohortUsers.size === 0) {
      for (const id of Array.from(firstSeen.keys())) cohortUsers.add(id);
    }

    // Restrict maps to cohort
    const cohortFirst = new Map<string, Date>();
    const cohortDays = new Map<string, Set<number>>();
    for (const userId of Array.from(cohortUsers)) {
      const first = firstSeen.get(userId);
      if (!first) continue;
      cohortFirst.set(userId, first);
      cohortDays.set(userId, eventDays.get(userId) ?? new Set());
    }

    const retention = computeRetention(cohortFirst, cohortDays, roleByUser);

    const returningIds: string[] = [];
    const oneTimeIds: string[] = [];
    for (const userId of Array.from(cohortFirst.keys())) {
      const days = cohortDays.get(userId) ?? new Set();
      if (Array.from(days).some((d) => d >= 1)) returningIds.push(userId);
      else oneTimeIds.push(userId);
    }

    const coverage = (userIds: string[], eventNames: readonly string[]) => {
      if (userIds.length === 0) return 0;
      let hit = 0;
      for (const id of userIds) {
        const types = eventTypesByUser.get(id) ?? new Set();
        if (eventNames.some((n) => types.has(n))) hit += 1;
      }
      return pct(hit, userIds.length);
    };

    const valuableActions: ValuableActionInsight[] = VALUABLE_ACTION_CHAINS.map(
      (chain) => {
        const returningCoveragePct = coverage(returningIds, chain.steps);
        const oneTimeCoveragePct = coverage(oneTimeIds, chain.steps);
        const liftPct =
          Math.round((returningCoveragePct - oneTimeCoveragePct) * 10) / 10;
        return {
          id: chain.id,
          label: chain.label,
          returningCoveragePct,
          oneTimeCoveragePct,
          liftPct,
          note:
            liftPct > 0
              ? "Чаще у вернувшихся — кандидат на усиление в онбординге"
              : "Связь со возвратом слабая на текущих данных",
        };
      },
    );

    let liaAmongReturning = 0;
    for (const id of returningIds) {
      const types = eventTypesByUser.get(id) ?? new Set();
      if (
        types.has("lia_started") ||
        types.has("lia_first_used") ||
        types.has("first_lia_use") ||
        types.has("lia_used")
      ) {
        liaAmongReturning += 1;
      }
    }
    const liaAmongReturningPct = pct(liaAmongReturning, returningIds.length);

    const activeRoles: Record<GrowthRoleKey, number> = {
      entrepreneurs: 0,
      experts: 0,
      investors: 0,
      organizations: 0,
    };
    for (const role of openBeta.roles) {
      activeRoles[role.key as GrowthRoleKey] = role.active;
    }

    const ecosystem: GrowthEcosystemMetrics = {
      newConnections:
        openBeta.metrics.projectsCreated + openBeta.metrics.interests,
      activeInteractions: openBeta.metrics.expertInteractions,
      applications: openBeta.metrics.applications,
      deals: openBeta.metrics.deals,
      interests: openBeta.metrics.interests,
    };

    const roleGrowth: RoleGrowthReport = {
      summary: [
        `Рост ролей Open Beta: активных ${openBeta.users.active}, проектов ${openBeta.metrics.projectsCreated}.`,
        `Вернувшихся в когорте: ${retention.returningUsers}.`,
      ].join(" "),
      entrepreneurs: [
        `Создали проекты (экосистема): ${openBeta.metrics.projectsCreated}`,
        `Зарегистрировано: ${openBeta.roles.find((r) => r.key === "entrepreneurs")?.registered ?? 0}`,
        `D7 retention: ${retention.byRole.entrepreneurs[7]}%`,
        `Взаимодействия (заявки): ${openBeta.metrics.applications}`,
      ],
      experts: [
        `Активных: ${activeRoles.experts}`,
        `Запросы / заявки: ${openBeta.metrics.expertInteractions}`,
        `D7 retention: ${retention.byRole.experts[7]}%`,
        `Диалоги Лии (платформа): ${openBeta.lia.dialogues}`,
      ],
      investors: [
        `Интересы: ${openBeta.metrics.interests}`,
        `Заявки: ${openBeta.metrics.applications}`,
        `D7 retention: ${retention.byRole.investors[7]}%`,
        `Просмотры/вход учтены в public_page_view когорты`,
      ],
      organizations: [
        `Зарегистрировано: ${openBeta.roles.find((r) => r.key === "organizations")?.registered ?? 0}`,
        `Проекты/партнёрства (сделки): ${openBeta.metrics.deals}`,
        `D7 retention: ${retention.byRole.organizations[7]}%`,
        `Активных: ${activeRoles.organizations}`,
      ],
    };

    const feedbackRows = (feedbackRes.data ?? []) as Array<{
      id: string;
      user_id: string | null;
      type: string;
      category: string | null;
      message: string;
      priority: string;
    }>;
    const returningSet = new Set(returningIds);
    const activeFeedback = feedbackRows.filter(
      (f) => f.user_id && returningSet.has(f.user_id),
    );
    const themes = new Map<string, number>();
    for (const fb of activeFeedback.length ? activeFeedback : feedbackRows) {
      const key = fb.category || fb.type || "Other";
      themes.set(key, (themes.get(key) ?? 0) + 1);
    }
    const planned = improvements.improvements
      .filter((i) => i.status === "planned" || i.status === "in_progress")
      .slice(0, 5)
      .map((i) => `[${i.priority}] ${i.title}`);
    const released = improvements.improvements
      .filter((i) => i.status === "released")
      .slice(0, 4)
      .map((i) => `released: ${i.title}`);

    const feedbackValue: UserValueFeedbackReport = {
      summary: [
        `Активные/вернувшиеся оставили отзывов: ${activeFeedback.length} (всего ${feedbackRows.length}).`,
        `Связка: активные → feedback → improvements.`,
      ].join(" "),
      active_users: [
        `Вернувшихся: ${retention.returningUsers}`,
        `Активных (Open Beta): ${openBeta.users.active}`,
        `Lia sessions rows: ${(sessionsRes.data ?? []).length}`,
      ],
      feedback_themes:
        Array.from(themes.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([k, v]) => `${k}: ${v}`) || ["Нет тем feedback"],
      improvements:
        planned.length + released.length > 0
          ? [...released, ...planned]
          : ["Нет связанных improvements"],
      recommendations: [
        "Собирать feedback у вернувшихся на D7",
        "Приоритизировать темы с наибольшим объёмом в product_improvements",
      ],
    };

    const openCritical =
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

    const returningPct = pct(retention.returningUsers, retention.cohortSize);
    const decisionValue = decideOpenBetaGrowth({
      d7: retention.overall[7],
      d30: retention.overall[30],
      returningPct,
      liaAmongReturningPct,
      applications: ecosystem.applications,
      interests: ecosystem.interests,
      deals: ecosystem.deals,
      openCritical,
      registered: openBeta.users.registered,
    });

    const problems: string[] = [];
    if (retention.overall[7] < 25) {
      problems.push(`D7 retention ${retention.overall[7]}% < 25%`);
    }
    if (retention.overall[30] < 15) {
      problems.push(`D30 retention ${retention.overall[30]}% < 15%`);
    }
    if (liaAmongReturningPct < 40) {
      problems.push(
        `Среди вернувшихся Лия только у ${liaAmongReturningPct}%`,
      );
    }
    if (openCritical > 0) problems.push(`Critical: ${openCritical}`);
    const funnelDrops = openBeta.funnel
      .filter((f) => (f.dropOffPct ?? 0) >= 30)
      .map(
        (f) =>
          `${f.label}: потеря ${f.dropOffPct}% (−${f.dropOffCount ?? 0})`,
      );
    problems.push(...funnelDrops.slice(0, 2));
    if (problems.length === 0) {
      problems.push("Критических проблем удержания не выявлено");
    }

    const recommendations: string[] = [
      openBetaGrowthDecisionHints[decisionValue],
    ];
    if (decisionValue === "improve_retention") {
      recommendations.push(
        "Усилить цепочки с положительным lift (Лия → проект → заявка)",
      );
      recommendations.push("Сократить drop-off после профиля / до Лии");
    } else if (decisionValue === "continue_growth") {
      recommendations.push("Донабрать когорту Open Beta Wave 1");
      recommendations.push("Закрепить ценные действия в онбординге ролей");
    } else {
      recommendations.push("Готовить расширение public по docs/open-beta-growth.md");
      recommendations.push("Держать Critical = 0 и мониторить D7/D30");
    }

    const readiness = Math.round(
      (Math.min(100, retention.overall[7] * 2) +
        Math.min(100, retention.overall[30] * 3) +
        Math.min(100, liaAmongReturningPct) +
        (openCritical === 0 ? 100 : 20)) /
        4,
    );

    const decision: OpenBetaGrowthDecisionBlock = {
      decision: decisionValue,
      label: openBetaGrowthDecisionLabels[decisionValue],
      hint: openBetaGrowthDecisionHints[decisionValue],
      readiness,
      indicators: [
        `D1 ${retention.overall[1]}% · D7 ${retention.overall[7]}% · D14 ${retention.overall[14]}% · D30 ${retention.overall[30]}%`,
        `Вернувшихся: ${returningPct}% · Лия среди них: ${liaAmongReturningPct}%`,
        `Связи: заявки ${ecosystem.applications} · интересы ${ecosystem.interests} · сделки ${ecosystem.deals}`,
        `Версия ${platformVersion.version}`,
      ],
      problems,
      recommendations,
    };

    const retentionReport = buildRetentionReport({
      retention,
      valuableActions,
      funnelDrops,
      decision,
    });

    return {
      growth: {
        newRegistrations: openBeta.users.registered,
        activeUsers: openBeta.users.active,
        activeRoles,
        sources: Array.from(sourceCounts.entries())
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count),
        channels: Array.from(channelCounts.entries())
          .map(([channel, count]) => ({ channel, count }))
          .sort((a, b) => b.count - a.count),
      },
      retention,
      valuableActions,
      roleGrowth,
      ecosystem,
      feedbackValue,
      decision,
      retentionReport,
      scaleCriteria: GROWTH_SCALE_CRITERIA,
    };
  } catch {
    return getOpenBetaGrowthDashboardFallback();
  }
}

function getOpenBetaGrowthDashboardFallback(): OpenBetaGrowthDashboard {
  const retention: RetentionMetrics = {
    overall: emptyRetentionByDay(),
    byRole: {
      entrepreneurs: emptyRetentionByDay(),
      experts: emptyRetentionByDay(),
      investors: emptyRetentionByDay(),
      organizations: emptyRetentionByDay(),
    },
    cohortSize: 0,
    returningUsers: 0,
  };
  const decision: OpenBetaGrowthDecisionBlock = {
    decision: "improve_retention",
    label: openBetaGrowthDecisionLabels.improve_retention,
    hint: openBetaGrowthDecisionHints.improve_retention,
    readiness: 0,
    indicators: ["Ошибка загрузки данных"],
    problems: ["Не удалось собрать analytics_events"],
    recommendations: ["Проверить Supabase и повторить"],
  };
  return {
    growth: {
      newRegistrations: 0,
      activeUsers: 0,
      activeRoles: {
        entrepreneurs: 0,
        experts: 0,
        investors: 0,
        organizations: 0,
      },
      sources: [],
      channels: [],
    },
    retention,
    valuableActions: [],
    roleGrowth: {
      summary: "Нет данных",
      entrepreneurs: [],
      experts: [],
      investors: [],
      organizations: [],
    },
    ecosystem: {
      newConnections: 0,
      activeInteractions: 0,
      applications: 0,
      deals: 0,
      interests: 0,
    },
    feedbackValue: {
      summary: "Нет данных",
      active_users: [],
      feedback_themes: [],
      improvements: [],
      recommendations: [],
    },
    decision,
    retentionReport: buildRetentionReport({
      retention,
      valuableActions: [],
      funnelDrops: [],
      decision,
    }),
    scaleCriteria: GROWTH_SCALE_CRITERIA,
  };
}

export async function buildRetentionReportAsync(): Promise<RetentionReport> {
  const dashboard = await getOpenBetaGrowthDashboard();
  return dashboard.retentionReport;
}

export { OPEN_BETA_GROWTH_DECISIONS };
