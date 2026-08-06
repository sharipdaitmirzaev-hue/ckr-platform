import { LAUNCH_WAVE_IDS } from "@/config/launch-waves";
import {
  TINDA_CRM_IDS,
  TINDA_LEAD_IDS,
  TINDA_ORG_ID,
  TINDA_PROJECT_ID,
  TINDA_ROADMAP_ID,
} from "@/lib/pilot/tinda-seed-data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { LaunchWaveRow } from "@/types/database";

/** Слой расчёта метрик запуска (этапы 42–43). */
export type LaunchMetrics = {
  users: {
    invited: number;
    registered: number;
    active: number;
  };
  activation: {
    profile_completed: number;
    first_action: number;
    lia_used: number;
  };
  business: {
    projects: number;
    applications: number;
    deals: number;
    results: number;
  };
  tinda: {
    org_profile: number;
    project: number;
    onboarding: number;
    roadmap: number;
    tasks_done: number;
    kpi_updated: number;
    client_contacts: number;
    negotiations: number;
    partners: number;
    deals: number;
  };
  period_label: string;
};

function emptyMetrics(): LaunchMetrics {
  return {
    users: { invited: 0, registered: 0, active: 0 },
    activation: { profile_completed: 0, first_action: 0, lia_used: 0 },
    business: { projects: 0, applications: 0, deals: 0, results: 0 },
    tinda: {
      org_profile: 0,
      project: 0,
      onboarding: 0,
      roadmap: 0,
      tasks_done: 0,
      kpi_updated: 0,
      client_contacts: 0,
      negotiations: 0,
      partners: 0,
      deals: 0,
    },
    period_label: "—",
  };
}

export async function getLaunchMetrics(
  wave: LaunchWaveRow | null,
): Promise<LaunchMetrics> {
  if (!hasSupabaseEnv() || !wave) return emptyMetrics();

  try {
    const supabase = createClient();
    const waveStart =
      wave.start_date != null
        ? `${wave.start_date}T00:00:00.000Z`
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const clientIds = [TINDA_CRM_IDS.clientA, TINDA_CRM_IDS.clientB];
    const leadIds = [
      TINDA_LEAD_IDS.clientExpansion,
      TINDA_LEAD_IDS.supplierOnboard,
    ];

    const [
      participantsRes,
      eventsRes,
      projectsRes,
      appsRes,
      dealsRes,
      resultsRes,
      orgRes,
      tindaProjectRes,
      roadmapRes,
      kpiRes,
      crmRes,
      leadsRes,
      partnersRes,
      tindaDealsRes,
    ] = await Promise.all([
      supabase
        .from("launch_wave_participants")
        .select("id, status, user_id")
        .eq("wave_id", wave.id),
      supabase
        .from("analytics_events")
        .select("event_type, user_id")
        .gte("created_at", waveStart)
        .limit(5000),
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
      supabase
        .from("project_results")
        .select("id", { count: "exact", head: true })
        .gte("created_at", waveStart),
      supabase
        .from("organizations")
        .select("id, name, description")
        .eq("id", TINDA_ORG_ID)
        .maybeSingle(),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("id", TINDA_PROJECT_ID),
      supabase
        .from("project_roadmaps")
        .select("id", { count: "exact", head: true })
        .eq("id", TINDA_ROADMAP_ID),
      supabase
        .from("project_metrics")
        .select("id, current_value")
        .eq("project_id", TINDA_PROJECT_ID),
      supabase
        .from("crm_contacts")
        .select("id", { count: "exact", head: true })
        .in("id", clientIds),
      supabase
        .from("crm_leads")
        .select("id", { count: "exact", head: true })
        .in("id", leadIds),
      supabase
        .from("partnerships")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", TINDA_ORG_ID),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("project_id", TINDA_PROJECT_ID),
    ]);

    // Tasks completed for TINDA roadmap items
    const { data: roadmapItems } = await supabase
      .from("roadmap_items")
      .select("id")
      .eq("roadmap_id", TINDA_ROADMAP_ID);
    const itemIds = (roadmapItems ?? []).map((r) => r.id as string);
    let tasksDone = 0;
    if (itemIds.length > 0) {
      const { count } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("roadmap_item_id", itemIds)
        .eq("status", "completed");
      tasksDone = count ?? 0;
    }

    const participants = participantsRes.data ?? [];
    const invited = participants.length;
    const registered = participants.filter((p) => p.user_id).length;
    const active = participants.filter((p) =>
      ["joined", "active", "completed"].includes(p.status as string),
    ).length;

    const events = (eventsRes.data ?? []) as Array<{
      event_type: string;
      user_id: string | null;
    }>;
    const countDistinct = (...types: string[]) => {
      const set = new Set(
        events
          .filter((e) => types.includes(e.event_type) && e.user_id)
          .map((e) => e.user_id as string),
      );
      return set.size;
    };

    const org = orgRes.data as { name?: string; description?: string } | null;
    const orgReady =
      org && (org.name?.trim().length ?? 0) > 0 ? 1 : 0;

    const kpiRows = (kpiRes.data ?? []) as Array<{ current_value: number | string }>;
    const kpiUpdated = kpiRows.some((m) => Number(m.current_value) > 0)
      ? 1
      : 0;

    const onboardingUsers = Math.max(
      countDistinct(
        "onboarding_completed",
        "role_selected",
        "profile_completed",
      ),
      registered > 0 ? 1 : 0,
    );

    return {
      users: { invited, registered, active },
      activation: {
        profile_completed: countDistinct(
          "profile_completed",
          "onboarding_completed",
          "role_selected",
        ),
        first_action: countDistinct(
          "first_project",
          "first_project_created",
          "first_application_sent",
          "first_interest_created",
          "first_investment_interest",
          "first_expert_request",
        ),
        lia_used: countDistinct("first_lia_use", "lia_used"),
      },
      business: {
        projects: projectsRes.count ?? 0,
        applications: appsRes.count ?? 0,
        deals: dealsRes.count ?? 0,
        results: resultsRes.count ?? 0,
      },
      tinda: {
        org_profile: orgReady,
        project: (tindaProjectRes.count ?? 0) > 0 ? 1 : 0,
        onboarding: onboardingUsers > 0 ? 1 : 0,
        roadmap: (roadmapRes.count ?? 0) > 0 ? 1 : 0,
        tasks_done: tasksDone,
        kpi_updated: kpiUpdated,
        client_contacts: crmRes.count ?? 0,
        negotiations: leadsRes.count ?? 0,
        partners: partnersRes.count ?? 0,
        deals: tindaDealsRes.count ?? 0,
      },
      period_label:
        wave.id === LAUNCH_WAVE_IDS.closed
          ? `Closed Wave 1 — ТИНДА · с ${wave.start_date ?? "старта"}`
          : `с ${wave.start_date ?? "старта волны"}`,
    };
  } catch {
    return emptyMetrics();
  }
}

export function metricValueForGoal(
  metricType: string,
  title: string,
  metrics: LaunchMetrics,
): number {
  const t = title.toLowerCase();

  // Этап 43 — цели ТИНДА (по формулировке)
  if (t.includes("профиль организации") || t.includes("профиль организац")) {
    return metrics.tinda.org_profile;
  }
  if (t.includes("создан проект") || t === "создан проект") {
    return metrics.tinda.project;
  }
  if (t.includes("onboarding") || t.includes("онбординг")) {
    return metrics.tinda.onboarding;
  }
  if (t.includes("roadmap")) {
    return metrics.tinda.roadmap;
  }
  if (t.includes("первые задачи") || t.includes("задач")) {
    return metrics.tinda.tasks_done;
  }
  if (t.includes("kpi") || t.includes("кпи")) {
    return metrics.tinda.kpi_updated;
  }
  if (t.includes("клиент") && t.includes("crm")) {
    return metrics.tinda.client_contacts;
  }
  if (t.includes("партнёр") || t.includes("партнер")) {
    return metrics.tinda.partners;
  }
  if (t.includes("сделк") && t.includes("тинда")) {
    return metrics.tinda.deals;
  }

  switch (metricType) {
    case "users":
      return metrics.users.invited;
    case "activation":
      if (t.includes("профил")) {
        return Math.max(
          metrics.activation.profile_completed,
          metrics.tinda.org_profile,
        );
      }
      return Math.max(
        metrics.activation.profile_completed,
        metrics.activation.first_action,
        metrics.tinda.onboarding,
      );
    case "projects":
      return Math.max(metrics.business.projects, metrics.tinda.project);
    case "applications":
      return metrics.business.applications;
    case "deals":
      if (t.includes("тинда") || t.includes("созданы сделки")) {
        return metrics.tinda.deals;
      }
      return Math.max(metrics.business.deals, metrics.tinda.deals);
    case "lia_usage":
      return metrics.activation.lia_used;
    case "business_results":
      if (t.includes("контакт")) return metrics.tinda.client_contacts;
      if (t.includes("переговор")) return metrics.tinda.negotiations;
      if (t.includes("партнёр") || t.includes("партнер")) {
        return metrics.tinda.partners;
      }
      if (t.includes("сделк")) return metrics.tinda.deals;
      if (t.includes("roadmap")) return metrics.tinda.roadmap;
      if (t.includes("задач")) return metrics.tinda.tasks_done;
      if (t.includes("kpi") || t.includes("кпи")) {
        return metrics.tinda.kpi_updated;
      }
      return metrics.business.results;
    default:
      return 0;
  }
}
