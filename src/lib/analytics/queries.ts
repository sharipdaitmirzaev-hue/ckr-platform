import {
  periodStartIso,
  type AnalyticsPeriod,
} from "@/config/analytics";
import { expertSpecializationLabels } from "@/config/experts";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ExpertSpecialization } from "@/types";
import type {
  DealRow,
  ExpertProfileRow,
  InvestmentOfferRow,
  ProjectRow,
} from "@/types/database";

export type NamedCount = {
  key: string;
  label: string;
  value: number;
};

export type PlatformAnalytics = {
  period: AnalyticsPeriod;
  users: {
    total: number;
    newInPeriod: number;
    activeInPeriod: number;
  };
  projects: {
    total: number;
    published: number;
    byCategory: NamedCount[];
  };
  investments: {
    count: number;
    totalVolume: number;
  };
  deals: {
    active: number;
    completed: number;
    amountSum: number;
  };
  experts: {
    count: number;
    byCategory: NamedCount[];
  };
  eventsByType: NamedCount[];
};

export type ProjectAnalyticsData = {
  projectId: string;
  views: number;
  applications: number;
  investmentInterest: number;
  activityCount: number;
  recentEvents: NamedCount[];
};

function emptyPlatform(period: AnalyticsPeriod): PlatformAnalytics {
  return {
    period,
    users: { total: 0, newInPeriod: 0, activeInPeriod: 0 },
    projects: { total: 0, published: 0, byCategory: [] },
    investments: { count: 0, totalVolume: 0 },
    deals: { active: 0, completed: 0, amountSum: 0 },
    experts: { count: 0, byCategory: [] },
    eventsByType: [],
  };
}

function countBy<T>(
  rows: T[],
  keyFn: (row: T) => string,
  labelFn: (key: string) => string,
): NamedCount[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row) || "other";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, value]) => ({ key, label: labelFn(key), value }))
    .sort((a, b) => b.value - a.value);
}

export async function getPlatformAnalytics(
  period: AnalyticsPeriod = "30d",
): Promise<PlatformAnalytics> {
  if (!hasSupabaseEnv()) return emptyPlatform(period);

  const supabase = createClient();
  const since = periodStartIso(period);

  try {
    const [
      usersTotal,
      usersNew,
      activeEvents,
      projectsRes,
      investmentsRes,
      dealsRes,
      expertsRes,
      eventsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since),
      supabase
        .from("analytics_events")
        .select("user_id")
        .gte("created_at", since)
        .not("user_id", "is", null),
      supabase.from("projects").select("id, category, status"),
      supabase
        .from("investment_offers")
        .select("id, amount_min, amount_max, status"),
      supabase.from("deals").select("id, status, amount"),
      supabase
        .from("expert_profiles")
        .select("id, specialization, status"),
      supabase
        .from("analytics_events")
        .select("event_type")
        .gte("created_at", since),
    ]);

    const projects = (projectsRes.data ?? []) as Pick<
      ProjectRow,
      "id" | "category" | "status"
    >[];
    const investments = (investmentsRes.data ?? []) as Pick<
      InvestmentOfferRow,
      "id" | "amount_min" | "amount_max" | "status"
    >[];
    const deals = (dealsRes.data ?? []) as Pick<
      DealRow,
      "id" | "status" | "amount"
    >[];
    const experts = (expertsRes.data ?? []) as Pick<
      ExpertProfileRow,
      "id" | "specialization" | "status"
    >[];

    const activeUserIds = new Set(
      (activeEvents.data ?? [])
        .map((row) => row.user_id as string | null)
        .filter((id): id is string => Boolean(id)),
    );

    const publishedInvestments = investments.filter(
      (item) => item.status === "published",
    );
    const totalVolume = publishedInvestments.reduce((sum, item) => {
      const min = Number(item.amount_min) || 0;
      const max = Number(item.amount_max) || min;
      return sum + (min + max) / 2;
    }, 0);

    const activeDeals = deals.filter((d) =>
      ["negotiation", "agreement", "active"].includes(d.status),
    );
    const completedDeals = deals.filter((d) => d.status === "completed");
    const amountSum = completedDeals.reduce((sum, d) => {
      return sum + (d.amount === null || d.amount === undefined ? 0 : Number(d.amount));
    }, 0);

    const publishedExperts = experts.filter((e) => e.status === "published");

    const eventCounts = countBy(
      (eventsRes.data ?? []) as { event_type: string }[],
      (row) => row.event_type,
      (key) => key,
    );

    return {
      period,
      users: {
        total: usersTotal.count ?? 0,
        newInPeriod: usersNew.count ?? 0,
        activeInPeriod: activeUserIds.size,
      },
      projects: {
        total: projects.length,
        published: projects.filter((p) => p.status === "published").length,
        byCategory: countBy(
          projects,
          (p) => p.category,
          (key) => key,
        ),
      },
      investments: {
        count: publishedInvestments.length,
        totalVolume,
      },
      deals: {
        active: activeDeals.length,
        completed: completedDeals.length,
        amountSum,
      },
      experts: {
        count: publishedExperts.length,
        byCategory: countBy(
          publishedExperts,
          (e) => e.specialization,
          (key) =>
            expertSpecializationLabels[key as ExpertSpecialization] ?? key,
        ),
      },
      eventsByType: eventCounts,
    };
  } catch {
    return emptyPlatform(period);
  }
}

export async function getProjectAnalytics(
  projectId: string,
): Promise<ProjectAnalyticsData> {
  const empty: ProjectAnalyticsData = {
    projectId,
    views: 0,
    applications: 0,
    investmentInterest: 0,
    activityCount: 0,
    recentEvents: [],
  };

  if (!hasSupabaseEnv()) return empty;

  const supabase = createClient();

  try {
    const [
      viewsRes,
      applicationsRes,
      investmentDealsRes,
      activityRes,
      eventsRes,
    ] = await Promise.all([
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "project_viewed")
        .eq("entity_type", "project")
        .eq("entity_id", projectId),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("target_type", "project")
        .eq("target_id", projectId),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("deal_type", "investment"),
      supabase
        .from("project_activity")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
      supabase
        .from("analytics_events")
        .select("event_type")
        .eq("entity_type", "project")
        .eq("entity_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const applications = applicationsRes.count ?? 0;
    const investmentDeals = investmentDealsRes.count ?? 0;

    return {
      projectId,
      views: viewsRes.count ?? 0,
      applications,
      investmentInterest: applications + investmentDeals,
      activityCount: activityRes.count ?? 0,
      recentEvents: countBy(
        (eventsRes.data ?? []) as { event_type: string }[],
        (row) => row.event_type,
        (key) => key,
      ),
    };
  } catch {
    return empty;
  }
}
