import { getProjectProgressSummary } from "@/lib/execution/queries";
import { listProjectMetrics } from "@/lib/execution/queries";
import {
  mapProjectFinancialMetric,
  mapProjectResult,
} from "@/lib/outcomes/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  CkrEfficiencyMetrics,
  KpiOutcomeRow,
  ProjectFinancialMetric,
  ProjectOutcomeSummary,
  ProjectResult,
} from "@/types/outcomes";
import type {
  DealRow,
  PartnershipRow,
  ProjectFinancialMetricRow,
  ProjectResultRow,
  ProjectRow,
  RoadmapItemRow,
} from "@/types/database";

function daysBetween(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

export async function listProjectResults(
  projectId: string,
): Promise<ProjectResult[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_results")
    .select("*")
    .eq("project_id", projectId)
    .order("achieved_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ProjectResultRow[]).map(mapProjectResult);
}

export async function listProjectFinancialMetrics(
  projectId: string,
): Promise<ProjectFinancialMetric[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_financial_metrics")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as ProjectFinancialMetricRow[]).map(mapProjectFinancialMetric);
}

export async function listAllProjectResults(
  limit = 100,
): Promise<(ProjectResult & { projectTitle?: string })[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_results")
    .select("*, projects:project_id ( title )")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const raw = row as ProjectResultRow & {
      projects?: { title?: string } | null;
    };
    return {
      ...mapProjectResult(raw),
      projectTitle: raw.projects?.title ?? undefined,
    };
  });
}

export async function getProjectOutcomeSummary(
  projectId: string,
): Promise<ProjectOutcomeSummary | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, title, status")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project) return null;

  const [results, financialMetrics, metrics, progress, dealsRes] =
    await Promise.all([
      listProjectResults(projectId),
      listProjectFinancialMetrics(projectId),
      listProjectMetrics(projectId),
      getProjectProgressSummary(projectId),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
    ]);

  const resultsByMetric = new Map<string, ProjectResult>();
  for (const result of results) {
    if (result.metricId && !resultsByMetric.has(result.metricId)) {
      resultsByMetric.set(result.metricId, result);
    }
  }

  const kpiRows: KpiOutcomeRow[] = metrics.map((metric) => {
    const linked = resultsByMetric.get(metric.id) ?? null;
    const actualValue = linked?.value ?? null;
    const attainmentPercent =
      metric.targetValue > 0 && actualValue !== null
        ? Math.round((actualValue / metric.targetValue) * 100)
        : metric.targetValue > 0
          ? Math.round((metric.currentValue / metric.targetValue) * 100)
          : null;

    return {
      metric,
      result: linked,
      targetValue: metric.targetValue,
      currentValue: metric.currentValue,
      actualValue,
      attainmentPercent,
    };
  });

  return {
    projectId,
    projectTitle: project.title,
    status: project.status,
    results,
    financialMetrics,
    kpiRows,
    roadmapPercent: progress.percentComplete,
    dealsCount: dealsRes.count ?? 0,
  };
}

export async function getCkrEfficiencyMetrics(): Promise<CkrEfficiencyMetrics> {
  const empty: CkrEfficiencyMetrics = {
    projectsCreated: 0,
    projectsCompleted: 0,
    projectsActive: 0,
    dealsCount: 0,
    dealsCompleted: 0,
    investmentSum: 0,
    partnersCount: 0,
    avgDaysIdeaToLaunch: null,
    avgDaysToFirstDeal: null,
    avgRoadmapCompletionPercent: 0,
    avgMilestonesCompletedPercent: 0,
    projectSuccessRate: 0,
    avgAccompanimentDays: null,
  };

  if (!hasSupabaseEnv()) return empty;
  const supabase = createClient();

  try {
    const [
      projectsRes,
      dealsRes,
      partnershipsRes,
      roadmapsRes,
      milestonesRes,
    ] = await Promise.all([
      supabase.from("projects").select("id, status, stage, created_at, updated_at"),
      supabase
        .from("deals")
        .select("id, project_id, status, amount, created_at"),
      supabase.from("partnerships").select("id, status"),
      supabase.from("project_roadmaps").select("id, project_id, status"),
      supabase
        .from("project_milestones")
        .select("id, project_id, status"),
    ]);

    const projects = (projectsRes.data ?? []) as Pick<
      ProjectRow,
      "id" | "status" | "stage" | "created_at" | "updated_at"
    >[];
    const deals = (dealsRes.data ?? []) as Pick<
      DealRow,
      "id" | "project_id" | "status" | "amount" | "created_at"
    >[];
    const partnerships = (partnershipsRes.data ?? []) as Pick<
      PartnershipRow,
      "id" | "status"
    >[];

    const projectsCreated = projects.length;
    const projectsCompleted = projects.filter(
      (p) => p.status === "completed",
    ).length;
    const projectsActive = projects.filter(
      (p) => p.status === "active" || p.status === "published",
    ).length;
    const dealsCount = deals.length;
    const dealsCompleted = deals.filter((d) => d.status === "completed").length;
    const investmentSum = deals
      .filter((d) => d.amount != null)
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const partnersCount = partnerships.filter(
      (p) => p.status === "active",
    ).length;

    const ideaToLaunchDays = projects
      .filter((p) => p.status === "active" || p.status === "completed")
      .map((p) => daysBetween(p.created_at, p.updated_at))
      .filter((n) => n > 0);

    const firstDealByProject = new Map<string, string>();
    for (const deal of deals) {
      const prev = firstDealByProject.get(deal.project_id);
      if (!prev || deal.created_at < prev) {
        firstDealByProject.set(deal.project_id, deal.created_at);
      }
    }
    const daysToFirstDeal = projects
      .map((p) => {
        const first = firstDealByProject.get(p.id);
        if (!first) return null;
        return daysBetween(p.created_at, first);
      })
      .filter((n): n is number => n !== null && n >= 0);

    const roadmapIds = (roadmapsRes.data ?? []).map(
      (r: { id: string }) => r.id,
    );
    let avgRoadmapCompletionPercent = 0;
    if (roadmapIds.length > 0) {
      const { data: items } = await supabase
        .from("roadmap_items")
        .select("id, roadmap_id, status")
        .in("roadmap_id", roadmapIds);

      const byRoadmap = new Map<string, { total: number; done: number }>();
      for (const item of (items ?? []) as Pick<
        RoadmapItemRow,
        "id" | "roadmap_id" | "status"
      >[]) {
        const bucket = byRoadmap.get(item.roadmap_id) ?? {
          total: 0,
          done: 0,
        };
        if (item.status !== "cancelled") {
          bucket.total += 1;
          if (item.status === "completed") bucket.done += 1;
        }
        byRoadmap.set(item.roadmap_id, bucket);
      }
      const percents = Array.from(byRoadmap.values())
        .filter((b) => b.total > 0)
        .map((b) => Math.round((b.done / b.total) * 100));
      avgRoadmapCompletionPercent = average(percents) ?? 0;
    }

    const milestones = (milestonesRes.data ?? []) as {
      id: string;
      project_id: string;
      status: string;
    }[];
    const byProject = new Map<string, { total: number; done: number }>();
    for (const m of milestones) {
      const bucket = byProject.get(m.project_id) ?? { total: 0, done: 0 };
      bucket.total += 1;
      if (m.status === "completed") bucket.done += 1;
      byProject.set(m.project_id, bucket);
    }
    const milestonePercents = Array.from(byProject.values())
      .filter((b) => b.total > 0)
      .map((b) => Math.round((b.done / b.total) * 100));
    const avgMilestonesCompletedPercent = average(milestonePercents) ?? 0;

    const finishedLike = projects.filter(
      (p) => p.status === "completed" || p.status === "archived",
    ).length;
    const projectSuccessRate =
      finishedLike > 0
        ? Math.round((projectsCompleted / finishedLike) * 100)
        : projectsCreated > 0
          ? Math.round((projectsCompleted / projectsCreated) * 100)
          : 0;

    const accompanimentDays = projects
      .filter((p) => p.status === "completed" || p.status === "active")
      .map((p) => daysBetween(p.created_at, p.updated_at))
      .filter((n) => n > 0);

    return {
      projectsCreated,
      projectsCompleted,
      projectsActive,
      dealsCount,
      dealsCompleted,
      investmentSum,
      partnersCount,
      avgDaysIdeaToLaunch: average(ideaToLaunchDays),
      avgDaysToFirstDeal: average(daysToFirstDeal),
      avgRoadmapCompletionPercent,
      avgMilestonesCompletedPercent,
      projectSuccessRate,
      avgAccompanimentDays: average(accompanimentDays),
    };
  } catch (error) {
    console.error("[outcomes] efficiency metrics failed:", error);
    return empty;
  }
}
