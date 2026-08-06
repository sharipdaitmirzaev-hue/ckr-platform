import {
  ECOSYSTEM_CONNECTION_TYPES,
  ecosystemConnectionTypeLabels,
  matchFunnelStageLabels,
  matchQualityTierLabels,
  type EcosystemConnectionType,
  type MatchFunnelStage,
  type MatchQualityTier,
} from "@/config/ecosystem-value";
import { ECOSYSTEM_WAVE_ID, ECOSYSTEM_WAVE_NAME } from "@/config/ecosystem-beta";
import { getEcosystemMetrics } from "@/lib/launch/ecosystem";
import { listLaunchWaves } from "@/lib/launch/waves";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { LaunchWaveRow } from "@/types/database";
import type { EcosystemValueReport } from "@/types/lia";

/** Метрики по одному типу связи экосистемы. */
export type ConnectionTypeMetrics = {
  type: EcosystemConnectionType;
  label: string;
  created: number;
  applications_sent: number;
  accepted: number;
  active: number;
  completed: number;
};

/** Сводный слой EcosystemMatchingMetrics. */
export type EcosystemMatchingMetrics = {
  by_type: ConnectionTypeMetrics[];
  totals: {
    created: number;
    applications_sent: number;
    accepted: number;
    active: number;
    completed: number;
  };
};

/** Воронка качества совпадений MatchQualityScore. */
export type MatchQualityScore = {
  /** 0–100, эвристика конверсии воронки. */
  score: number;
  funnel: Record<MatchFunnelStage, number>;
  conversion: {
    created_to_accepted: number;
    accepted_to_interaction: number;
    interaction_to_result: number;
  };
  tiers: Record<MatchQualityTier, string[]>;
};

export type EcosystemValueOverview = {
  active_users: number;
  projects: number;
  experts: number;
  investors: number;
  organizations: number;
};

export type EcosystemValueResults = {
  applications: number;
  deals: number;
  partnerships: number;
};

export type ConnectionTableRow = {
  id: string;
  type: EcosystemConnectionType;
  typeLabel: string;
  title: string;
  status: string;
  stage: "created" | "accepted" | "active" | "completed";
  quality: MatchQualityTier;
};

export type EcosystemValueDashboard = {
  wave: LaunchWaveRow | null;
  overview: EcosystemValueOverview;
  matching: EcosystemMatchingMetrics;
  quality: MatchQualityScore;
  results: EcosystemValueResults;
  connections: ConnectionTableRow[];
  report: EcosystemValueReport;
};

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function emptyMatching(): EcosystemMatchingMetrics {
  const by_type = ECOSYSTEM_CONNECTION_TYPES.map((type) => ({
    type,
    label: ecosystemConnectionTypeLabels[type],
    created: 0,
    applications_sent: 0,
    accepted: 0,
    active: 0,
    completed: 0,
  }));
  return {
    by_type,
    totals: {
      created: 0,
      applications_sent: 0,
      accepted: 0,
      active: 0,
      completed: 0,
    },
  };
}

function emptyQuality(): MatchQualityScore {
  return {
    score: 0,
    funnel: { created: 0, accepted: 0, interaction: 0, result: 0 },
    conversion: {
      created_to_accepted: 0,
      accepted_to_interaction: 0,
      interaction_to_result: 0,
    },
    tiers: { weak: [], strong: [], successful: [] },
  };
}

function emptyDashboard(): EcosystemValueDashboard {
  return {
    wave: null,
    overview: {
      active_users: 0,
      projects: 0,
      experts: 0,
      investors: 0,
      organizations: 0,
    },
    matching: emptyMatching(),
    quality: emptyQuality(),
    results: { applications: 0, deals: 0, partnerships: 0 },
    connections: [],
    report: {
      summary: "Нет данных для EcosystemValueReport.",
      strong_connections: [],
      weak_connections: [],
      successful_matches: [],
      blocked_matches: [],
      recommendations: [
        "Примените миграции launch/ecosystem и откройте /admin/ecosystem-value.",
      ],
    },
  };
}

function computeMatchQualityScore(input: {
  created: number;
  accepted: number;
  interaction: number;
  result: number;
  byType: ConnectionTypeMetrics[];
}): MatchQualityScore {
  const { created, accepted, interaction, result, byType } = input;
  const created_to_accepted = pct(accepted, created);
  const accepted_to_interaction = pct(interaction, accepted || created);
  const interaction_to_result = pct(result, interaction || accepted);

  // Взвешенная эвристика: принятие важнее создания, результат — сильнее всего.
  const score = Math.round(
    created_to_accepted * 0.25 +
      accepted_to_interaction * 0.35 +
      interaction_to_result * 0.4,
  );

  const tiers: Record<MatchQualityTier, string[]> = {
    weak: [],
    strong: [],
    successful: [],
  };

  for (const row of byType) {
    const label = row.label;
    if (row.completed > 0 || (row.active > 0 && row.accepted > 0)) {
      if (row.completed > 0) {
        tiers.successful.push(
          `${label}: ${row.completed} завершённых / ${row.active} активных`,
        );
      } else {
        tiers.strong.push(
          `${label}: принято ${row.accepted}, активных ${row.active}`,
        );
      }
    } else if (row.applications_sent > 0 && row.accepted === 0) {
      tiers.weak.push(
        `${label}: ${row.applications_sent} заявок без принятия`,
      );
    } else if (row.created > 0 && row.applications_sent === 0) {
      tiers.weak.push(`${label}: связи созданы, заявок нет`);
    } else if (row.created === 0) {
      tiers.weak.push(`${label}: совпадений пока нет`);
    } else {
      tiers.strong.push(`${label}: есть принятие (${row.accepted})`);
    }
  }

  if (tiers.successful.length === 0 && result > 0) {
    tiers.successful.push(`Есть завершённые результаты: ${result}`);
  }
  if (tiers.strong.length === 0 && interaction > 0) {
    tiers.strong.push(`Есть активные взаимодействия: ${interaction}`);
  }

  return {
    score,
    funnel: { created, accepted, interaction, result },
    conversion: {
      created_to_accepted,
      accepted_to_interaction,
      interaction_to_result,
    },
    tiers,
  };
}

function buildReport(
  quality: MatchQualityScore,
  matching: EcosystemMatchingMetrics,
  overview: EcosystemValueOverview,
  results: EcosystemValueResults,
): EcosystemValueReport {
  const blocked: string[] = [];
  for (const row of matching.by_type) {
    if (row.applications_sent > 0 && row.accepted === 0) {
      blocked.push(
        `${row.label}: ${row.applications_sent} заявок без принятия`,
      );
    }
    if (row.accepted > 0 && row.active === 0 && row.completed === 0) {
      blocked.push(
        `${row.label}: принято ${row.accepted}, но взаимодействие не началось`,
      );
    }
  }

  const recommendations: string[] = [];
  if (quality.score < 40) {
    recommendations.push(
      "Низкий MatchQualityScore — усилить принятие заявок и доведение до сделок.",
    );
  }
  if (matching.totals.accepted === 0 && matching.totals.applications_sent > 0) {
    recommendations.push(
      "Заявки уходят, но не принимаются — проверить UX входящих заявок.",
    );
  }
  if (results.deals + results.partnerships === 0) {
    recommendations.push(
      "Нет сделок/партнёрств — провести сценарии Wave 2 до результата.",
    );
  }
  if (overview.experts < 3) {
    recommendations.push("Мало экспертов в контуре — набрать когорту Wave 2.");
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Связи дают результат — зафиксировать выводы в Decision Gate.",
    );
  }

  return {
    summary: [
      `Ценность экосистемы ЦКР: MatchQualityScore ${quality.score}/100.`,
      `Связей создано ${matching.totals.created}, принято ${matching.totals.accepted}, активных ${matching.totals.active}, завершённых ${matching.totals.completed}.`,
      `Результаты: заявки ${results.applications}, сделки ${results.deals}, партнёрства ${results.partnerships}.`,
      "Лия только анализирует — решения не принимает.",
    ].join(" "),
    strong_connections:
      quality.tiers.strong.length > 0
        ? quality.tiers.strong
        : ["Сильных связей по данным пока нет"],
    weak_connections:
      quality.tiers.weak.length > 0
        ? quality.tiers.weak
        : ["Слабых связей не выявлено"],
    successful_matches:
      quality.tiers.successful.length > 0
        ? quality.tiers.successful
        : ["Успешных сценариев с результатом пока нет"],
    blocked_matches:
      blocked.length > 0 ? blocked : ["Заблокированных совпадений не видно"],
    recommendations,
  };
}

export async function getEcosystemValueDashboard(): Promise<EcosystemValueDashboard> {
  if (!hasSupabaseEnv()) return emptyDashboard();

  try {
    const supabase = createClient();
    const [waves, eco] = await Promise.all([
      listLaunchWaves(),
      getEcosystemMetrics(),
    ]);

    const wave =
      waves.find((w) => w.id === ECOSYSTEM_WAVE_ID) ??
      waves.find((w) => w.name === ECOSYSTEM_WAVE_NAME) ??
      null;

    const [
      appsRes,
      dealsRes,
      partnershipsRes,
      orgProjectsRes,
      interestsRes,
      dealParticipantsRes,
    ] = await Promise.all([
      supabase
        .from("applications")
        .select("id, target_type, status, created_at")
        .limit(2000),
      supabase
        .from("deals")
        .select("id, deal_type, status, project_id")
        .limit(1000),
      supabase
        .from("partnerships")
        .select("id, status, organization_id")
        .limit(1000),
      supabase
        .from("projects")
        .select("id, title, organization_id, status")
        .not("organization_id", "is", null)
        .limit(1000),
      supabase
        .from("investor_interests")
        .select("id, target_type, created_at")
        .limit(1000),
      supabase
        .from("deal_participants")
        .select("deal_id, role")
        .limit(2000),
    ]);

    const apps = (appsRes.data ?? []) as Array<{
      id: string;
      target_type: string;
      status: string;
    }>;
    const deals = (dealsRes.data ?? []) as Array<{
      id: string;
      deal_type: string;
      status: string;
      project_id: string | null;
    }>;
    const partnerships = (partnershipsRes.data ?? []) as Array<{
      id: string;
      status: string;
    }>;
    const orgProjects = (orgProjectsRes.data ?? []) as Array<{
      id: string;
      title: string | null;
      organization_id: string | null;
      status: string | null;
    }>;
    const interests = (interestsRes.data ?? []) as Array<{
      id: string;
      target_type: string;
    }>;
    const dealParticipants = (dealParticipantsRes.data ?? []) as Array<{
      deal_id: string;
      role: string;
    }>;

    const dealsWithExpert = new Set(
      dealParticipants
        .filter((p) => p.role === "expert")
        .map((p) => p.deal_id),
    );
    const dealsWithInvestor = new Set(
      dealParticipants
        .filter((p) => p.role === "investor")
        .map((p) => p.deal_id),
    );
    const dealsWithPartner = new Set(
      dealParticipants
        .filter((p) => p.role === "partner")
        .map((p) => p.deal_id),
    );

    const expertApps = apps.filter((a) => a.target_type === "expert");
    const investApps = apps.filter((a) => a.target_type === "investment");
    const projectApps = apps.filter((a) => a.target_type === "project");
    const opportunityApps = apps.filter((a) => a.target_type === "opportunity");

    const expertDeals = deals.filter((d) => dealsWithExpert.has(d.id));
    const investorDeals = deals.filter(
      (d) =>
        dealsWithInvestor.has(d.id) ||
        d.deal_type === "investment",
    );
    const partnerDeals = deals.filter(
      (d) =>
        dealsWithPartner.has(d.id) ||
        d.deal_type === "partnership",
    );

    function appCounts(list: typeof apps) {
      const sent = list.length;
      const accepted = list.filter((a) => a.status === "accepted").length;
      return { sent, accepted };
    }

    function dealCounts(list: typeof deals) {
      const active = list.filter(
        (d) =>
          d.status === "active" ||
          d.status === "negotiation" ||
          d.status === "agreement",
      ).length;
      const completed = list.filter((d) => d.status === "completed").length;
      return { active, completed };
    }

    const expertApp = appCounts(expertApps);
    const expertDeal = dealCounts(expertDeals);
    const projectExpert: ConnectionTypeMetrics = {
      type: "project_expert",
      label: ecosystemConnectionTypeLabels.project_expert,
      created: expertApps.length + expertDeals.length,
      applications_sent: expertApp.sent,
      accepted: expertApp.accepted,
      active: expertDeal.active,
      completed: expertDeal.completed,
    };

    const investApp = appCounts([...investApps, ...projectApps]);
    const investDeal = dealCounts(investorDeals);
    const projectInvestor: ConnectionTypeMetrics = {
      type: "project_investor",
      label: ecosystemConnectionTypeLabels.project_investor,
      created:
        investApps.length +
        projectApps.length +
        interests.length +
        investorDeals.length,
      applications_sent: investApp.sent,
      accepted: investApp.accepted,
      active: investDeal.active,
      completed: investDeal.completed,
    };

    const partnerApp = appCounts(opportunityApps);
    const partnerDeal = dealCounts(partnerDeals);
    const activePartnerships = partnerships.filter(
      (p) => p.status === "active",
    ).length;
    const projectPartner: ConnectionTypeMetrics = {
      type: "project_partner",
      label: ecosystemConnectionTypeLabels.project_partner,
      created:
        opportunityApps.length + partnerDeals.length + partnerships.length,
      applications_sent: partnerApp.sent,
      accepted: partnerApp.accepted + partnerships.filter((p) => p.status === "active" || p.status === "pending").length,
      active: partnerDeal.active + activePartnerships,
      completed:
        partnerDeal.completed +
        partnerships.filter((p) => p.status === "inactive").length,
    };

    const orgProject: ConnectionTypeMetrics = {
      type: "organization_project",
      label: ecosystemConnectionTypeLabels.organization_project,
      created: orgProjects.length,
      applications_sent: 0,
      accepted: orgProjects.length,
      active: orgProjects.filter(
        (p) => p.status === "published" || p.status === "active",
      ).length,
      completed: orgProjects.filter((p) => p.status === "archived" || p.status === "completed").length,
    };

    const by_type = [
      projectExpert,
      projectInvestor,
      projectPartner,
      orgProject,
    ];

    const totals = by_type.reduce(
      (acc, row) => ({
        created: acc.created + row.created,
        applications_sent: acc.applications_sent + row.applications_sent,
        accepted: acc.accepted + row.accepted,
        active: acc.active + row.active,
        completed: acc.completed + row.completed,
      }),
      {
        created: 0,
        applications_sent: 0,
        accepted: 0,
        active: 0,
        completed: 0,
      },
    );

    const matching: EcosystemMatchingMetrics = { by_type, totals };

    const funnelCreated = totals.created;
    const funnelAccepted = totals.accepted;
    const funnelInteraction = totals.active;
    const funnelResult = totals.completed + deals.filter((d) => d.status === "completed").length;

    const quality = computeMatchQualityScore({
      created: funnelCreated,
      accepted: funnelAccepted,
      interaction: funnelInteraction,
      result: Math.max(funnelResult, totals.completed),
      byType: by_type,
    });

    const overview: EcosystemValueOverview = {
      active_users: Math.max(
        eco.entrepreneurs + eco.experts + eco.investors,
        eco.registered,
      ),
      projects: eco.projects,
      experts: eco.experts,
      investors: eco.investors,
      organizations: eco.organizations,
    };

    const results: EcosystemValueResults = {
      applications: apps.length,
      deals: deals.length,
      partnerships: partnerships.length,
    };

    const connections: ConnectionTableRow[] = [];

    for (const app of expertApps.slice(0, 20)) {
      connections.push({
        id: `app-expert-${app.id}`,
        type: "project_expert",
        typeLabel: ecosystemConnectionTypeLabels.project_expert,
        title: `Заявка к эксперту · ${app.status}`,
        status: app.status,
        stage:
          app.status === "accepted"
            ? "accepted"
            : app.status === "closed"
              ? "completed"
              : "created",
        quality:
          app.status === "accepted"
            ? "strong"
            : app.status === "rejected"
              ? "weak"
              : "weak",
      });
    }
    for (const app of [...investApps, ...projectApps].slice(0, 15)) {
      connections.push({
        id: `app-invest-${app.id}`,
        type: "project_investor",
        typeLabel: ecosystemConnectionTypeLabels.project_investor,
        title: `Заявка (${app.target_type}) · ${app.status}`,
        status: app.status,
        stage:
          app.status === "accepted"
            ? "accepted"
            : app.status === "closed"
              ? "completed"
              : "created",
        quality: app.status === "accepted" ? "strong" : "weak",
      });
    }
    for (const deal of deals.slice(0, 15)) {
      const type: EcosystemConnectionType = dealsWithExpert.has(deal.id)
        ? "project_expert"
        : dealsWithInvestor.has(deal.id) || deal.deal_type === "investment"
          ? "project_investor"
          : "project_partner";
      const stage =
        deal.status === "completed"
          ? "completed"
          : deal.status === "active" ||
              deal.status === "negotiation" ||
              deal.status === "agreement"
            ? "active"
            : "created";
      connections.push({
        id: `deal-${deal.id}`,
        type,
        typeLabel: ecosystemConnectionTypeLabels[type],
        title: `Сделка ${deal.deal_type} · ${deal.status}`,
        status: deal.status,
        stage,
        quality:
          deal.status === "completed"
            ? "successful"
            : stage === "active"
              ? "strong"
              : "weak",
      });
    }
    for (const p of orgProjects.slice(0, 15)) {
      connections.push({
        id: `org-project-${p.id}`,
        type: "organization_project",
        typeLabel: ecosystemConnectionTypeLabels.organization_project,
        title: p.title || "Проект организации",
        status: p.status || "linked",
        stage: "accepted",
        quality: "strong",
      });
    }

    const report = buildReport(quality, matching, overview, results);

    return {
      wave,
      overview,
      matching,
      quality,
      results,
      connections,
      report,
    };
  } catch {
    return emptyDashboard();
  }
}

export async function buildEcosystemValueReport(): Promise<EcosystemValueReport> {
  const dashboard = await getEcosystemValueDashboard();
  return dashboard.report;
}

export function matchFunnelChartItems(
  quality: MatchQualityScore,
): Array<{ label: string; value: number }> {
  return (Object.keys(quality.funnel) as MatchFunnelStage[]).map((stage) => ({
    label: matchFunnelStageLabels[stage],
    value: quality.funnel[stage],
  }));
}

export { matchQualityTierLabels, matchFunnelStageLabels };
