import {
  ECOSYSTEM_ROLE_PLAYBOOKS,
  ECOSYSTEM_SCENARIOS,
  ECOSYSTEM_WAVE_ID,
  ECOSYSTEM_WAVE_NAME,
} from "@/config/ecosystem-beta";
import {
  goalProgressPercent,
  launchGoalMetricLabels,
  type LaunchGoalMetricType,
} from "@/config/launch-goals";
import { listLaunchGoals, type LaunchGoalView } from "@/lib/launch/goals";
import { listLaunchWaves } from "@/lib/launch/waves";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { LaunchWaveRow } from "@/types/database";
import type { EcosystemReport } from "@/types/lia";

export type EcosystemConnection = {
  key: string;
  label: string;
  count: number;
  detail: string;
};

export type EcosystemMetrics = {
  entrepreneurs: number;
  experts: number;
  investors: number;
  organizations: number;
  registered: number;
  profileCompleted: number;
  liaUsed: number;
  firstAction: number;
  profilePct: number;
  liaPct: number;
  firstActionPct: number;
  projects: number;
  interests: number;
  applications: number;
  expertApplications: number;
  investmentApplications: number;
  projectApplications: number;
  acceptedApplications: number;
  deals: number;
  partnerships: number;
  dealOrPartnership: number;
  connectionsTotal: number;
};

export type TindaEcosystemCheck = {
  organization: string;
  projectTitle: string;
  needsExperts: boolean;
  needsPartners: boolean;
  canFindResources: boolean;
  notes: string[];
};

export type EcosystemDashboard = {
  wave: LaunchWaveRow | null;
  goals: LaunchGoalView[];
  metrics: EcosystemMetrics;
  connections: EcosystemConnection[];
  scenarios: typeof ECOSYSTEM_SCENARIOS;
  rolePlaybooks: typeof ECOSYSTEM_ROLE_PLAYBOOKS;
  tinda: TindaEcosystemCheck;
  report: EcosystemReport;
};

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function emptyMetrics(): EcosystemMetrics {
  return {
    entrepreneurs: 0,
    experts: 0,
    investors: 0,
    organizations: 0,
    registered: 0,
    profileCompleted: 0,
    liaUsed: 0,
    firstAction: 0,
    profilePct: 0,
    liaPct: 0,
    firstActionPct: 0,
    projects: 0,
    interests: 0,
    applications: 0,
    expertApplications: 0,
    investmentApplications: 0,
    projectApplications: 0,
    acceptedApplications: 0,
    deals: 0,
    partnerships: 0,
    dealOrPartnership: 0,
    connectionsTotal: 0,
  };
}

function emptyDashboard(): EcosystemDashboard {
  const metrics = emptyMetrics();
  return {
    wave: null,
    goals: [],
    metrics,
    connections: [],
    scenarios: ECOSYSTEM_SCENARIOS,
    rolePlaybooks: ECOSYSTEM_ROLE_PLAYBOOKS,
    tinda: {
      organization: "ООО ТИНДА",
      projectTitle: "Развитие оптовой платформы ТИНДА",
      needsExperts: true,
      needsPartners: true,
      canFindResources: true,
      notes: [
        "Примените миграции Wave 2 и откройте /admin/ecosystem-report.",
      ],
    },
    report: {
      summary: "Нет данных экосистемы Wave 2.",
      active_users: [],
      project_activity: [],
      expert_activity: [],
      investment_activity: [],
      connections: [],
      recommendations: ["Примените миграцию ecosystem_beta_wave2."],
    },
  };
}

export async function getEcosystemMetrics(): Promise<EcosystemMetrics> {
  if (!hasSupabaseEnv()) return emptyMetrics();

  try {
    const supabase = createClient();

    const [
      rolesRes,
      orgsRes,
      profilesRes,
      projectsRes,
      interestsRes,
      appsRes,
      expertAppsRes,
      investAppsRes,
      projectAppsRes,
      acceptedRes,
      dealsRes,
      partnershipsRes,
      eventsRes,
    ] = await Promise.all([
      supabase.from("user_roles").select("user_id, role"),
      supabase
        .from("organizations")
        .select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase
        .from("investor_interests")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("target_type", "expert"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("target_type", "investment"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("target_type", "project"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted"),
      supabase.from("deals").select("id", { count: "exact", head: true }),
      supabase
        .from("partnerships")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("analytics_events")
        .select("user_id, event_type")
        .in("event_type", [
          "profile_completed",
          "onboarding_completed",
          "role_selected",
          "first_lia_use",
          "lia_used",
          "first_project",
          "first_project_created",
          "first_application_sent",
          "first_interest_created",
          "first_investment_interest",
          "first_expert_request",
        ])
        .limit(5000),
    ]);

    const roleRows = (rolesRes.data ?? []) as Array<{
      user_id: string;
      role: string;
    }>;
    const entrepreneurs = new Set(
      roleRows.filter((r) => r.role === "entrepreneur").map((r) => r.user_id),
    ).size;
    const experts = new Set(
      roleRows.filter((r) => r.role === "expert").map((r) => r.user_id),
    ).size;
    const investors = new Set(
      roleRows.filter((r) => r.role === "investor").map((r) => r.user_id),
    ).size;

    const eventRows = (eventsRes.data ?? []) as Array<{
      user_id: string | null;
      event_type: string;
    }>;
    const profileUsers = new Set<string>();
    const liaUsers = new Set<string>();
    const actionUsers = new Set<string>();
    for (const row of eventRows) {
      if (!row.user_id) continue;
      if (
        row.event_type === "profile_completed" ||
        row.event_type === "onboarding_completed" ||
        row.event_type === "role_selected"
      ) {
        profileUsers.add(row.user_id);
      }
      if (
        row.event_type === "first_lia_use" ||
        row.event_type === "lia_used"
      ) {
        liaUsers.add(row.user_id);
      }
      if (
        row.event_type === "first_project" ||
        row.event_type === "first_project_created" ||
        row.event_type === "first_application_sent" ||
        row.event_type === "first_interest_created" ||
        row.event_type === "first_investment_interest" ||
        row.event_type === "first_expert_request"
      ) {
        actionUsers.add(row.user_id);
      }
    }

    const registered = profilesRes.count ?? 0;
    const organizations = orgsRes.count ?? 0;
    const projects = projectsRes.count ?? 0;
    const interests = interestsRes.count ?? 0;
    const applications = appsRes.count ?? 0;
    const expertApplications = expertAppsRes.count ?? 0;
    const investmentApplications = investAppsRes.count ?? 0;
    const projectApplications = projectAppsRes.count ?? 0;
    const acceptedApplications = acceptedRes.count ?? 0;
    const deals = dealsRes.count ?? 0;
    const partnerships = partnershipsRes.count ?? 0;
    const dealOrPartnership = deals + partnerships;

    const entrepreneurExpert = expertApplications;
    const entrepreneurInvestor =
      investmentApplications + interests + projectApplications;
    const orgProject = projects; // proxy: проекты с org считаются отдельно ниже

    return {
      entrepreneurs,
      experts,
      investors,
      organizations,
      registered,
      profileCompleted: profileUsers.size,
      liaUsed: liaUsers.size,
      firstAction: actionUsers.size,
      profilePct: pct(profileUsers.size, registered),
      liaPct: pct(liaUsers.size, registered),
      firstActionPct: pct(actionUsers.size, registered),
      projects,
      interests,
      applications,
      expertApplications,
      investmentApplications,
      projectApplications,
      acceptedApplications,
      deals,
      partnerships,
      dealOrPartnership,
      connectionsTotal:
        entrepreneurExpert +
        entrepreneurInvestor +
        acceptedApplications +
        orgProject,
    };
  } catch {
    return emptyMetrics();
  }
}

async function getOrgLinkedProjectsCount(): Promise<number> {
  if (!hasSupabaseEnv()) return 0;
  try {
    const supabase = createClient();
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .not("organization_id", "is", null);
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function getTindaEcosystemCheck(): Promise<TindaEcosystemCheck> {
  const base: TindaEcosystemCheck = {
    organization: "ООО ТИНДА",
    projectTitle: "Развитие оптовой платформы ТИНДА",
    needsExperts: true,
    needsPartners: true,
    canFindResources: true,
    notes: [],
  };

  if (!hasSupabaseEnv()) {
    base.notes.push("Supabase env не настроен — проверка по каркасу.");
    return base;
  }

  try {
    const supabase = createClient();
    const [
      expertsRes,
      orgsRes,
      opportunitiesRes,
      investmentsRes,
      expertAppsRes,
    ] = await Promise.all([
      supabase
        .from("expert_profiles")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("organizations")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("investment_offers")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("target_type", "expert"),
    ]);

    const experts = expertsRes.count ?? 0;
    const orgs = orgsRes.count ?? 0;
    const opportunities = opportunitiesRes.count ?? 0;
    const investments = investmentsRes.count ?? 0;
    const expertApps = expertAppsRes.count ?? 0;

    base.needsExperts = experts === 0 || expertApps === 0;
    base.needsPartners = orgs < 2;
    base.canFindResources =
      opportunities + investments + experts > 0;

    base.notes.push(
      base.needsExperts
        ? "Есть потребность в экспертах: мало профилей или нет запросов к экспертам."
        : "Запросы к экспертам уже появляются в контуре.",
    );
    base.notes.push(
      base.needsPartners
        ? "Есть потребность в партнёрах: мало организаций для сетевого эффекта."
        : "Организаций достаточно для партнёрских связей.",
    );
    base.notes.push(
      base.canFindResources
        ? "Ресурсы через ЦКР доступны: эксперты / возможности / инвестиции в каталоге."
        : "Каталог ресурсов пуст — ТИНДА не найдёт внешние ресурсы в ЦКР.",
    );

    return base;
  } catch {
    base.notes.push("Не удалось прочитать данные ТИНДА/каталога.");
    return base;
  }
}

export function buildEcosystemReportFromMetrics(
  metrics: EcosystemMetrics,
  connections: EcosystemConnection[],
  waveName: string,
): EcosystemReport {
  const recommendations: string[] = [];
  if (metrics.entrepreneurs < 10) {
    recommendations.push("Набрать когорту предпринимателей до цели 10.");
  }
  if (metrics.experts < 3) {
    recommendations.push("Пригласить экспертов и пройти верификацию.");
  }
  if (metrics.investors < 2) {
    recommendations.push("Добавить инвесторов для сценария интерес → контакт.");
  }
  if (metrics.expertApplications < 2) {
    recommendations.push(
      "Прогнать сценарий предприниматель → поиск эксперта → заявка.",
    );
  }
  if (metrics.dealOrPartnership < 1) {
    recommendations.push(
      "Довести хотя бы одну связь до сделки или партнёрства.",
    );
  }
  if (metrics.liaPct < 70) {
    recommendations.push("Поднять использование Лии до 70% когорты.");
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Цели Wave 2 в норме — фиксируйте результаты и готовьте Decision Gate к Wave 3.",
    );
  }

  return {
    summary: [
      `${waveName}: экосистемный срез.`,
      `Роли: ${metrics.entrepreneurs} предпринимателей, ${metrics.experts} экспертов, ${metrics.investors} инвесторов, ${metrics.organizations} орг.`,
      `Связи/заявки: ${metrics.applications} заявок, ${metrics.acceptedApplications} принятых, ${metrics.deals} сделок, ${metrics.partnerships} партнёрств.`,
    ].join(" "),
    active_users: [
      `Предприниматели: ${metrics.entrepreneurs}`,
      `Эксперты: ${metrics.experts}`,
      `Инвесторы: ${metrics.investors}`,
      `Организации: ${metrics.organizations}`,
      `Профиль завершён: ${metrics.profilePct}%`,
      `Лия: ${metrics.liaPct}%`,
      `Первое действие: ${metrics.firstActionPct}%`,
    ],
    project_activity: [
      `Проектов: ${metrics.projects}`,
      `Заявок к проектам: ${metrics.projectApplications}`,
      `Интересов: ${metrics.interests}`,
    ],
    expert_activity: [
      `Заявок к экспертам: ${metrics.expertApplications}`,
      `Экспертов в ролях: ${metrics.experts}`,
    ],
    investment_activity: [
      `Инвесторов: ${metrics.investors}`,
      `Интересов: ${metrics.interests}`,
      `Заявок к инвестициям: ${metrics.investmentApplications}`,
    ],
    connections: connections.map(
      (c) => `${c.label}: ${c.count} — ${c.detail}`,
    ),
    recommendations,
  };
}

export async function getEcosystemDashboard(): Promise<EcosystemDashboard> {
  if (!hasSupabaseEnv()) return emptyDashboard();

  try {
    const waves = await listLaunchWaves();
    const wave =
      waves.find((w) => w.id === ECOSYSTEM_WAVE_ID) ??
      waves.find((w) => w.name === ECOSYSTEM_WAVE_NAME) ??
      waves.find((w) => w.wave_type === "beta" && w.status === "active") ??
      null;

    const [metrics, orgProjects, goalRows, tinda] = await Promise.all([
      getEcosystemMetrics(),
      getOrgLinkedProjectsCount(),
      wave ? listLaunchGoals(wave.id) : Promise.resolve([]),
      getTindaEcosystemCheck(),
    ]);

    const connections: EcosystemConnection[] = [
      {
        key: "entrepreneur_expert",
        label: "Предприниматель → эксперт",
        count: metrics.expertApplications,
        detail: "заявки target_type=expert",
      },
      {
        key: "entrepreneur_investor",
        label: "Предприниматель → инвестор",
        count:
          metrics.investmentApplications +
          metrics.interests +
          metrics.projectApplications,
        detail: "интересы + заявки к инвестициям/проектам",
      },
      {
        key: "organization_project",
        label: "Организация → проект",
        count: orgProjects,
        detail: "projects.organization_id",
      },
    ];

    const goals: LaunchGoalView[] = goalRows
      .filter((g) => g.status !== "cancelled")
      .map((g) => ({
        ...g,
        target_value: Number(g.target_value),
        current_value: Number(g.current_value),
        progress: goalProgressPercent(
          Number(g.current_value),
          Number(g.target_value),
        ),
        metricLabel:
          launchGoalMetricLabels[g.metric_type as LaunchGoalMetricType] ??
          g.metric_type,
      }));

    const report = buildEcosystemReportFromMetrics(
      metrics,
      connections,
      wave?.name ?? ECOSYSTEM_WAVE_NAME,
    );

    return {
      wave,
      goals,
      metrics,
      connections,
      scenarios: ECOSYSTEM_SCENARIOS,
      rolePlaybooks: ECOSYSTEM_ROLE_PLAYBOOKS,
      tinda,
      report,
    };
  } catch {
    return emptyDashboard();
  }
}

export async function buildEcosystemReport(): Promise<EcosystemReport> {
  const dashboard = await getEcosystemDashboard();
  return dashboard.report;
}

/** Значения целей Wave 2 для syncLaunchGoalsForWave / metricValueForGoal. */
export function ecosystemMetricValueForGoal(
  title: string,
  metrics: EcosystemMetrics,
): number | null {
  const t = title.toLowerCase();
  if (t.includes("предпринимател")) return metrics.entrepreneurs;
  if (t.includes("эксперт") && t.includes("взаимодейств")) {
    return metrics.expertApplications;
  }
  if (t.includes("эксперт")) return metrics.experts;
  if (t.includes("инвестор")) return metrics.investors;
  if (t.includes("организац")) return metrics.organizations;
  if (t.includes("профиль") && t.includes("%")) return metrics.profilePct;
  if (t.includes("лию") || (t.includes("лия") && t.includes("%"))) {
    return metrics.liaPct;
  }
  if (t.includes("первое действие") || t.includes("перв")) {
    if (t.includes("%")) return metrics.firstActionPct;
  }
  if (t.includes("проект")) return metrics.projects;
  if (t.includes("интерес")) return metrics.interests;
  if (t.includes("заявк")) return metrics.applications;
  if (t.includes("сделк") || t.includes("партнёр") || t.includes("партнер")) {
    return metrics.dealOrPartnership > 0 ? metrics.dealOrPartnership : 0;
  }
  return null;
}
