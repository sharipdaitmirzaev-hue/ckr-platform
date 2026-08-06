import { LAUNCH_WAVE_IDS } from "@/config/launch-waves";
import {
  TINDA_CRM_IDS,
  TINDA_LEAD_IDS,
  TINDA_ORG_ID,
  TINDA_PROJECT_ID,
} from "@/lib/pilot/tinda-seed-data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { LaunchWaveRow } from "@/types/database";

/** Слой расчёта метрик запуска (этап 42). */
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
    tinda: { client_contacts: 0, negotiations: 0, partners: 0, deals: 0 },
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
        client_contacts: crmRes.count ?? 0,
        negotiations: leadsRes.count ?? 0,
        partners: partnersRes.count ?? 0,
        deals: tindaDealsRes.count ?? 0,
      },
      period_label:
        wave.id === LAUNCH_WAVE_IDS.closed
          ? `с ${wave.start_date ?? "старта"} · closed + ТИНДА`
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
  switch (metricType) {
    case "users":
      return metrics.users.invited;
    case "activation":
      if (t.includes("профил")) return metrics.activation.profile_completed;
      return Math.max(
        metrics.activation.profile_completed,
        metrics.activation.first_action,
      );
    case "projects":
      return metrics.business.projects;
    case "applications":
      return metrics.business.applications;
    case "deals":
      if (t.includes("тинда")) return metrics.tinda.deals;
      return metrics.business.deals;
    case "lia_usage":
      return metrics.activation.lia_used;
    case "business_results":
      if (t.includes("контакт")) return metrics.tinda.client_contacts;
      if (t.includes("переговор")) return metrics.tinda.negotiations;
      if (t.includes("партнёр") || t.includes("партнер")) {
        return metrics.tinda.partners;
      }
      if (t.includes("сделк")) return metrics.tinda.deals;
      return metrics.business.results;
    default:
      return 0;
  }
}
