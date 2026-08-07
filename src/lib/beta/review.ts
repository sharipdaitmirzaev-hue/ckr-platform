import {
  isActivatedInviteStatus,
  isOpenInviteStatus,
} from "@/config/controlled-beta";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { BetaReviewReport, LaunchReadinessReport } from "@/types/lia";

export type FunnelStepReview = {
  key: string;
  label: string;
  users: number;
  conversionFromPrev: number | null;
  dropOff: number | null;
  avgHoursFromPrev: number | null;
};

export type ModuleUsage = {
  key: string;
  label: string;
  uses: number;
  activeUsers: number;
  resultLabel: string;
  resultValue: number;
};

export type RoleStats = {
  entrepreneurs: {
    projects: number;
    activeUsers: number;
    liaUsers: number;
  };
  investors: {
    interests: number;
    applications: number;
  };
  experts: {
    profiles: number;
    verified: number;
    requests: number;
  };
  organizations: {
    projects: number;
    partnerships: number;
  };
};

export type PmfSignals = {
  returningUsers: number;
  repeatActionUsers: number;
  reachedResultUsers: number;
  topScenarios: Array<{ label: string; count: number }>;
  notes: string[];
};

export type BetaReviewDashboard = {
  users: {
    invited: number;
    registered: number;
    activated: number;
    completedScenario: number;
  };
  roles: RoleStats;
  funnel: FunnelStepReview[];
  modules: ModuleUsage[];
  pmf: PmfSignals;
  reviewReport: BetaReviewReport;
  launchReport: LaunchReadinessReport;
};

function hoursBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return ms / (1000 * 60 * 60);
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
}

function emptyDashboard(): BetaReviewDashboard {
  const reviewReport: BetaReviewReport = {
    summary: "Нет данных beta для анализа.",
    successful_flows: [],
    blocked_flows: [],
    unused_features: [],
    user_problems: [],
    business_value_signals: [],
    recommendations: [],
  };
  const launchReport: LaunchReadinessReport = {
    summary: "Недостаточно данных для оценки готовности к запуску.",
    critical_issues: [],
    recommended_actions: [],
    launch_risks: [],
  };
  return {
    users: { invited: 0, registered: 0, activated: 0, completedScenario: 0 },
    roles: {
      entrepreneurs: { projects: 0, activeUsers: 0, liaUsers: 0 },
      investors: { interests: 0, applications: 0 },
      experts: { profiles: 0, verified: 0, requests: 0 },
      organizations: { projects: 0, partnerships: 0 },
    },
    funnel: [],
    modules: [],
    pmf: {
      returningUsers: 0,
      repeatActionUsers: 0,
      reachedResultUsers: 0,
      topScenarios: [],
      notes: [],
    },
    reviewReport,
    launchReport,
  };
}

export function buildBetaReviewReport(input: {
  users: BetaReviewDashboard["users"];
  funnel: FunnelStepReview[];
  modules: ModuleUsage[];
  pmf: PmfSignals;
  openIssues: number;
  criticalFeedback: number;
}): BetaReviewReport {
  const successful_flows: string[] = [];
  const blocked_flows: string[] = [];
  const unused_features: string[] = [];
  const user_problems: string[] = [];
  const business_value_signals: string[] = [];
  const recommendations: string[] = [];

  for (let i = 1; i < input.funnel.length; i += 1) {
    const step = input.funnel[i];
    const prev = input.funnel[i - 1];
    if (
      step.conversionFromPrev !== null &&
      step.conversionFromPrev >= 50 &&
      prev.users > 0
    ) {
      successful_flows.push(
        `${prev.label} → ${step.label}: ${step.conversionFromPrev}%`,
      );
    }
    if (
      step.dropOff !== null &&
      step.dropOff >= 40 &&
      prev.users > 0
    ) {
      blocked_flows.push(
        `Потеря на шаге «${step.label}»: −${step.dropOff}% от «${prev.label}»`,
      );
    }
  }

  for (const mod of input.modules) {
    if (mod.uses === 0 || mod.activeUsers === 0) {
      unused_features.push(`${mod.label}: почти нет использования`);
    }
  }

  if (input.openIssues > 0) {
    user_problems.push(`Открытых pilot_issues: ${input.openIssues}`);
  }
  if (input.criticalFeedback > 0) {
    user_problems.push(
      `Feedback critical/high: ${input.criticalFeedback}`,
    );
  }
  if (input.users.activated > 0 && input.users.completedScenario === 0) {
    user_problems.push("Никто не отмечен как завершивший сценарий");
  }

  if (input.pmf.returningUsers > 0) {
    business_value_signals.push(
      `Возвращающиеся пользователи: ${input.pmf.returningUsers}`,
    );
  }
  if (input.pmf.repeatActionUsers > 0) {
    business_value_signals.push(
      `Повторные действия: ${input.pmf.repeatActionUsers} пользователей`,
    );
  }
  if (input.pmf.reachedResultUsers > 0) {
    business_value_signals.push(
      `Дошли до результата: ${input.pmf.reachedResultUsers}`,
    );
  }
  for (const s of input.pmf.topScenarios.slice(0, 3)) {
    business_value_signals.push(`Сценарий «${s.label}»: ${s.count}`);
  }

  if (successful_flows.length === 0) {
    successful_flows.push("Явных сильных переходов воронки пока мало");
  }
  if (blocked_flows.length === 0) {
    blocked_flows.push("Критических провалов воронки не видно");
  }
  if (unused_features.length === 0) {
    unused_features.push("Все ключевые модули имеют хоть какое-то использование");
  }
  if (user_problems.length === 0) {
    user_problems.push("Критических проблем в выборке не зафиксировано");
  }
  if (business_value_signals.length === 0) {
    business_value_signals.push(
      "Сигналы ценности пока слабые — нужна более длинная волна beta",
    );
  }

  recommendations.push(
    "Закройте шаги воронки с наибольшим drop-off до расширения доступа",
  );
  recommendations.push(
    "Продвигайте unused modules через онбординг и demo-скрипт, не через новые модули",
  );
  recommendations.push(
    "Ведите critical feedback → product_improvements → released",
  );
  recommendations.push("Сверьте readiness: сценарий Лии «Что нужно исправить перед запуском?»");

  const activationShare =
    input.users.invited + input.users.activated > 0
      ? Math.round(
          (input.users.activated /
            (input.users.invited + input.users.activated)) *
            100,
        )
      : 0;

  return {
    summary: `Обзор beta: приглашено ${input.users.invited}, зарегистрировано ${input.users.registered}, активировано ${input.users.activated} (${activationShare}%), сценарий завершили ${input.users.completedScenario}. Отчёт только по данным платформы.`,
    successful_flows,
    blocked_flows,
    unused_features,
    user_problems,
    business_value_signals,
    recommendations,
  };
}

export function buildLaunchReadinessReport(input: {
  review: BetaReviewReport;
  criticalIssues: string[];
  openCriticalIssues: number;
  activationRate: number;
  funnelDropMax: number;
}): LaunchReadinessReport {
  const critical_issues = [...input.criticalIssues];
  if (input.openCriticalIssues > 0) {
    critical_issues.push(
      `Открытых critical/high проблем пилота: ${input.openCriticalIssues}`,
    );
  }
  if (input.activationRate < 50) {
    critical_issues.push(
      `Низкая активация приглашений: ${input.activationRate}%`,
    );
  }
  if (input.funnelDropMax >= 50) {
    critical_issues.push(
      `Сильная потеря в воронке: до ${input.funnelDropMax}% на одном шаге`,
    );
  }
  if (critical_issues.length === 0) {
    critical_issues.push("Блокирующих critical-сигналов в данных не видно");
  }

  const recommended_actions = [
    ...input.review.recommendations.slice(0, 3),
    "Зафиксируйте решение Go / Conditional Go / No-Go в docs/public-launch-plan.md",
    "Прогоните smoke ключевых сценариев ролей на стенде",
  ];

  const hasUnused = input.review.unused_features.some((f) =>
    f.includes("почти нет"),
  );
  const launch_risks = [
    input.activationRate < 60
      ? "Риск низкой активации при открытии доступа"
      : "Активация приемлема при текущей когорте",
    hasUnused
      ? "Часть модулей почти не используется — риск перегруза UI"
      : "Использование модулей распределено",
    "Без оператора улучшений feedback не превратится в релизы",
  ];

  const ready =
    input.openCriticalIssues === 0 &&
    input.activationRate >= 50 &&
    input.funnelDropMax < 60;

  return {
    summary: ready
      ? "Данные beta допускают Conditional Go к public launch при закрытии UX/операционных хвостов. Новые бизнес-модули не требуются."
      : "К public launch пока рано: закройте critical-сигналы и просадки воронки. Новые бизнес-модули не добавлять.",
    critical_issues,
    recommended_actions,
    launch_risks,
  };
}

export async function getBetaReviewDashboard(): Promise<BetaReviewDashboard> {
  if (!hasSupabaseEnv()) return emptyDashboard();

  try {
    const supabase = createClient();
    const [
      invitesRes,
      eventsRes,
      rolesRes,
      projectsRes,
      appsRes,
      interestsRes,
      expertProfilesRes,
      partnershipsRes,
      orgsProjectsRes,
      opportunitiesRes,
      investmentsRes,
      liaSessionsRes,
      crmContactsRes,
      activityRes,
      resultsRes,
      feedbackRes,
      issuesRes,
      profilesCountRes,
    ] = await Promise.all([
      supabase.from("beta_invites").select("id, status, used_by, role"),
      supabase
        .from("analytics_events")
        .select("event_type, user_id, created_at, metadata")
        .order("created_at", { ascending: true })
        .limit(4000),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("projects").select("id, owner_id, status, organization_id"),
      supabase.from("applications").select("id, from_user_id, target_type"),
      supabase.from("investor_interests").select("id, user_id"),
      supabase
        .from("expert_profiles")
        .select("id, user_id, verification_status, status"),
      supabase.from("partnerships").select("id", { count: "exact", head: true }),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .not("organization_id", "is", null),
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("investment_offers")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("lia_sessions")
        .select("id, user_id", { count: "exact" }),
      supabase
        .from("crm_contacts")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("project_activity")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("project_results")
        .select("id", { count: "exact", head: true }),
      supabase.from("feedback").select("id, type, priority, message"),
      supabase
        .from("pilot_issues")
        .select("id, severity, status, title")
        .in("status", ["open", "in_progress"]),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    const invites = invitesRes.data ?? [];
    const events = eventsRes.data ?? [];
    const roles = rolesRes.data ?? [];
    const projects = projectsRes.data ?? [];
    const apps = appsRes.data ?? [];
    const interests = interestsRes.data ?? [];
    const experts = expertProfilesRes.data ?? [];

    const invited = invites.filter((i) =>
      isOpenInviteStatus(i.status as string),
    ).length;
    const activated = invites.filter((i) =>
      isActivatedInviteStatus(i.status as string),
    ).length;
    const completedScenario = invites.filter(
      (i) => (i.status as string) === "completed",
    ).length;
    const registered =
      profilesCountRes.count ??
      new Set(
        invites
          .map((i) => i.used_by as string | null)
          .filter((id): id is string => Boolean(id)),
      ).size;

    const entrepreneurIds = new Set(
      roles
        .filter((r) => r.role === "entrepreneur")
        .map((r) => r.user_id as string),
    );
    const investorIds = new Set(
      roles.filter((r) => r.role === "investor").map((r) => r.user_id as string),
    );
    const expertRoleIds = new Set(
      roles.filter((r) => r.role === "expert").map((r) => r.user_id as string),
    );
    const companyIds = new Set(
      roles.filter((r) => r.role === "company").map((r) => r.user_id as string),
    );

    const eventsByUser = new Map<string, Array<{ type: string; at: string }>>();
    const usersByType = new Map<string, Set<string>>();
    const dayUsers = new Map<string, Set<string>>();
    const scenarioCounts = new Map<string, number>();

    for (const e of events) {
      const uid = e.user_id as string | null;
      const type = e.event_type as string;
      const at = e.created_at as string;
      if (!usersByType.has(type)) usersByType.set(type, new Set());
      if (uid) {
        usersByType.get(type)!.add(uid);
        const list = eventsByUser.get(uid) ?? [];
        list.push({ type, at });
        eventsByUser.set(uid, list);
        const day = at.slice(0, 10);
        if (!dayUsers.has(day)) dayUsers.set(day, new Set());
        dayUsers.get(day)!.add(uid);
      }
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      if (typeof meta.scenario === "string" && meta.scenario) {
        scenarioCounts.set(
          meta.scenario,
          (scenarioCounts.get(meta.scenario) ?? 0) + 1,
        );
      }
    }

    const firstTime = (uid: string, types: string[]): string | null => {
      const list = eventsByUser.get(uid) ?? [];
      for (const item of list) {
        if (types.includes(item.type)) return item.at;
      }
      return null;
    };

    const userSet = (...types: string[]) => {
      const set = new Set<string>();
      for (const t of types) {
        for (const uid of Array.from(usersByType.get(t) ?? [])) set.add(uid);
      }
      return set;
    };

    const regUsers = userSet("registration_completed", "user_registered");
    const profileUsers = userSet("profile_completed", "onboarding_completed");
    const liaUsers = userSet("first_lia_use", "lia_used");
    const objectUsers = userSet(
      "first_project_created",
      "project_created",
      "opportunity_created",
      "investment_created",
    );
    const interactionUsers = userSet(
      "application_sent",
      "first_application_sent",
      "first_interest_created",
      "deal_created",
    );
    const resultUsers = userSet(
      "result_created",
      "outcome_generated",
      "deal_completed",
      "project_completed",
    );

    const funnelDefs: Array<{
      key: string;
      label: string;
      users: Set<string>;
      timeTypes: string[];
    }> = [
      {
        key: "registration",
        label: "Регистрация",
        users: regUsers,
        timeTypes: ["registration_completed", "user_registered"],
      },
      {
        key: "profile",
        label: "Профиль",
        users: profileUsers,
        timeTypes: ["profile_completed", "onboarding_completed"],
      },
      {
        key: "lia",
        label: "Первое использование Лии",
        users: liaUsers,
        timeTypes: ["first_lia_use", "lia_used"],
      },
      {
        key: "object",
        label: "Создание объекта",
        users: objectUsers,
        timeTypes: [
          "first_project_created",
          "project_created",
          "opportunity_created",
          "investment_created",
        ],
      },
      {
        key: "interaction",
        label: "Взаимодействие",
        users: interactionUsers,
        timeTypes: [
          "application_sent",
          "first_application_sent",
          "first_interest_created",
          "deal_created",
        ],
      },
      {
        key: "result",
        label: "Результат",
        users: resultUsers,
        timeTypes: [
          "result_created",
          "outcome_generated",
          "deal_completed",
          "project_completed",
        ],
      },
    ];

    const funnel: FunnelStepReview[] = funnelDefs.map((step, index) => {
      const prev = index > 0 ? funnelDefs[index - 1] : null;
      const users = step.users.size;
      const prevCount = prev ? prev.users.size : null;
      const conversionFromPrev =
        prevCount && prevCount > 0
          ? Math.round((users / prevCount) * 100)
          : null;
      const dropOff =
        prevCount && prevCount > 0
          ? Math.round(((prevCount - users) / prevCount) * 100)
          : null;

      let avgHoursFromPrev: number | null = null;
      if (prev) {
        const deltas: number[] = [];
        for (const uid of Array.from(step.users)) {
          if (!prev.users.has(uid)) continue;
          const tPrev = firstTime(uid, prev.timeTypes);
          const tCurr = firstTime(uid, step.timeTypes);
          if (tPrev && tCurr) deltas.push(hoursBetween(tPrev, tCurr));
        }
        avgHoursFromPrev = avg(deltas);
      }

      return {
        key: step.key,
        label: step.label,
        users,
        conversionFromPrev,
        dropOff,
        avgHoursFromPrev,
      };
    });

    const activeEntrepreneurOwners = new Set(
      projects
        .filter(
          (p) =>
            entrepreneurIds.has(p.owner_id as string) &&
            (p.status === "active" || p.status === "published"),
        )
        .map((p) => p.owner_id as string),
    );
    const liaEntrepreneur = Array.from(liaUsers).filter((id) =>
      entrepreneurIds.has(id),
    ).length;

    const expertVerified = experts.filter(
      (e) => e.verification_status === "verified",
    ).length;
    const expertRequests = apps.filter(
      (a) => a.target_type === "expert",
    ).length;

    const rolesStats: RoleStats = {
      entrepreneurs: {
        projects: projects.filter((p) =>
          entrepreneurIds.has(p.owner_id as string),
        ).length,
        activeUsers: activeEntrepreneurOwners.size,
        liaUsers: liaEntrepreneur,
      },
      investors: {
        interests: interests.filter((i) =>
          investorIds.has(i.user_id as string),
        ).length,
        applications: apps.filter((a) =>
          investorIds.has(a.from_user_id as string),
        ).length,
      },
      experts: {
        profiles: experts.length || expertRoleIds.size,
        verified: expertVerified,
        requests: expertRequests,
      },
      organizations: {
        projects: orgsProjectsRes.count ?? 0,
        partnerships: partnershipsRes.count ?? 0,
      },
    };

    // company-owned projects fallback
    if (rolesStats.organizations.projects === 0 && companyIds.size > 0) {
      rolesStats.organizations.projects = projects.filter((p) =>
        companyIds.has(p.owner_id as string),
      ).length;
    }

    const liaSessionUsers = new Set(
      (liaSessionsRes.data ?? []).map((s) => s.user_id as string),
    );

    const modules: ModuleUsage[] = [
      {
        key: "lia",
        label: "Лия",
        uses: liaSessionsRes.count ?? liaUsers.size,
        activeUsers: Math.max(liaSessionUsers.size, liaUsers.size),
        resultLabel: "Сессии / first use",
        resultValue: liaUsers.size,
      },
      {
        key: "projects",
        label: "Проекты",
        uses: projects.length,
        activeUsers: new Set(projects.map((p) => p.owner_id as string)).size,
        resultLabel: "Опубликовано/active",
        resultValue: projects.filter(
          (p) => p.status === "published" || p.status === "active",
        ).length,
      },
      {
        key: "opportunities",
        label: "Возможности",
        uses: opportunitiesRes.count ?? 0,
        activeUsers: usersByType.get("opportunity_created")?.size ?? 0,
        resultLabel: "Создано",
        resultValue: opportunitiesRes.count ?? 0,
      },
      {
        key: "investments",
        label: "Инвестиции",
        uses: investmentsRes.count ?? 0,
        activeUsers: usersByType.get("investment_created")?.size ?? 0,
        resultLabel: "Офферы",
        resultValue: investmentsRes.count ?? 0,
      },
      {
        key: "experts",
        label: "Эксперты",
        uses: experts.length,
        activeUsers: expertRoleIds.size,
        resultLabel: "Запросы",
        resultValue: expertRequests,
      },
      {
        key: "crm",
        label: "CRM",
        uses: crmContactsRes.count ?? 0,
        activeUsers: 0,
        resultLabel: "Контакты",
        resultValue: crmContactsRes.count ?? 0,
      },
      {
        key: "workspace",
        label: "Workspace",
        uses: activityRes.count ?? 0,
        activeUsers: usersByType.get("project_progress_checked")?.size ?? 0,
        resultLabel: "Результаты проектов",
        resultValue: resultsRes.count ?? 0,
      },
    ];

    const userDayCounts = new Map<string, number>();
    for (const set of Array.from(dayUsers.values())) {
      for (const uid of Array.from(set)) {
        userDayCounts.set(uid, (userDayCounts.get(uid) ?? 0) + 1);
      }
    }
    const returningUsers = Array.from(userDayCounts.values()).filter(
      (n) => n >= 2,
    ).length;

    const repeatActionUsers = Array.from(eventsByUser.entries()).filter(
      ([, list]) => list.length >= 3,
    ).length;

    const topScenarios = Array.from(scenarioCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const pmf: PmfSignals = {
      returningUsers,
      repeatActionUsers,
      reachedResultUsers: resultUsers.size,
      topScenarios,
      notes: [
        returningUsers > 0
          ? "Есть возвраты — сигнал удержания"
          : "Возвратов мало — усилить ценность первого сеанса",
        resultUsers.size > 0
          ? "Часть пользователей доходит до результата"
          : "До результата почти никто не дошёл — главный риск launch",
        topScenarios[0]
          ? `Самый частый сценарий Лии: ${topScenarios[0].label}`
          : "Сценарии Лии почти не размечены в metadata",
      ],
    };

    const feedback = feedbackRes.data ?? [];
    const criticalFeedback = feedback.filter(
      (f) => f.priority === "critical" || f.priority === "high",
    ).length;
    const openIssues = issuesRes.data ?? [];
    const openCriticalIssues = openIssues.filter(
      (i) => i.severity === "critical" || i.severity === "high",
    ).length;

    const usersBlock = {
      invited,
      registered,
      activated,
      completedScenario,
    };

    const reviewReport = buildBetaReviewReport({
      users: usersBlock,
      funnel,
      modules,
      pmf,
      openIssues: openIssues.length,
      criticalFeedback,
    });

    const activationRate =
      invited + activated > 0
        ? Math.round((activated / (invited + activated)) * 100)
        : 0;
    const funnelDropMax = Math.max(
      0,
      ...funnel.map((f) => f.dropOff ?? 0),
    );

    const criticalIssues = openIssues
      .filter((i) => i.severity === "critical" || i.severity === "high")
      .slice(0, 8)
      .map((i) => `[${i.severity}] ${i.title}`);

    for (const f of feedback
      .filter((item) => item.priority === "critical")
      .slice(0, 5)) {
      criticalIssues.push(
        `Feedback critical: ${String(f.message).slice(0, 100)}`,
      );
    }

    const launchReport = buildLaunchReadinessReport({
      review: reviewReport,
      criticalIssues,
      openCriticalIssues,
      activationRate,
      funnelDropMax,
    });

    return {
      users: usersBlock,
      roles: rolesStats,
      funnel,
      modules,
      pmf,
      reviewReport,
      launchReport,
    };
  } catch {
    return emptyDashboard();
  }
}
