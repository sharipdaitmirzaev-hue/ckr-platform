import { mapFeedbackRow } from "@/lib/beta/mappers";
import { mapProductImprovementRow } from "@/lib/improvements/mappers";
import { mapPilotIssueRow } from "@/lib/pilot/mappers";
import { PILOT_METRIC_TYPES } from "@/config/pilot";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Feedback, PilotIssue, ProductImprovement } from "@/types";
import type {
  FeedbackRow,
  PilotIssueRow,
  ProductImprovementRow,
} from "@/types/database";

export type ImprovementsDashboard = {
  improvements: ProductImprovement[];
  problems: PilotIssue[];
  proposals: Feedback[];
  counts: {
    improvements: number;
    problemsOpen: number;
    proposals: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
  metricHints: Array<{ eventType: string; count: number }>;
};

function emptyDashboard(): ImprovementsDashboard {
  return {
    improvements: [],
    problems: [],
    proposals: [],
    counts: {
      improvements: 0,
      problemsOpen: 0,
      proposals: 0,
      byStatus: {},
      byPriority: {},
    },
    metricHints: [],
  };
}

export async function getImprovementsDashboard(): Promise<ImprovementsDashboard> {
  if (!hasSupabaseEnv()) return emptyDashboard();

  try {
    const supabase = createClient();
    const [
      improvementsRes,
      issuesRes,
      feedbackRes,
      eventsRes,
    ] = await Promise.all([
      supabase
        .from("product_improvements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("pilot_issues")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60),
      supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60),
      supabase
        .from("analytics_events")
        .select("event_type")
        .in("event_type", [...PILOT_METRIC_TYPES])
        .limit(500),
    ]);

    const improvements = ((improvementsRes.data ??
      []) as ProductImprovementRow[]).map(mapProductImprovementRow);
    const problems = ((issuesRes.data ?? []) as PilotIssueRow[]).map(
      mapPilotIssueRow,
    );
    const proposals = ((feedbackRes.data ?? []) as FeedbackRow[]).map(
      mapFeedbackRow,
    );

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const item of improvements) {
      byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
      byPriority[item.priority] = (byPriority[item.priority] ?? 0) + 1;
    }

    const metricMap = new Map<string, number>();
    for (const row of eventsRes.data ?? []) {
      const key = row.event_type as string;
      metricMap.set(key, (metricMap.get(key) ?? 0) + 1);
    }

    return {
      improvements,
      problems,
      proposals,
      counts: {
        improvements: improvements.length,
        problemsOpen: problems.filter(
          (p) => p.status === "open" || p.status === "in_progress",
        ).length,
        proposals: proposals.length,
        byStatus,
        byPriority,
      },
      metricHints: Array.from(metricMap.entries())
        .map(([eventType, count]) => ({ eventType, count }))
        .sort((a, b) => b.count - a.count),
    };
  } catch {
    return emptyDashboard();
  }
}

export async function listProductImprovements(
  limit = 80,
): Promise<ProductImprovement[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("product_improvements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as ProductImprovementRow[]).map(mapProductImprovementRow);
  } catch {
    return [];
  }
}
