import {
  mapProjectMetric,
  mapProjectRoadmap,
  mapRoadmapItem,
  mapRoadmapTask,
  taskProgressPercent,
} from "@/lib/execution/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ProjectMetric,
  ProjectProgressSummary,
  ProjectRoadmap,
  RoadmapItem,
  RoadmapTask,
} from "@/types/execution";
import type {
  ProjectMetricRow,
  ProjectRoadmapRow,
  RoadmapItemRow,
  TaskRow,
} from "@/types/database";

function isOverdue(deadline: string | null, status: string): boolean {
  if (!deadline) return false;
  if (status === "completed" || status === "cancelled") return false;
  return new Date(deadline).getTime() < Date.now();
}

export async function getActiveRoadmapForProject(
  projectId: string,
): Promise<ProjectRoadmap | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_roadmaps")
    .select("*")
    .eq("project_id", projectId)
    .in("status", ["active", "draft"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapProjectRoadmap(data as ProjectRoadmapRow);
}

export async function listRoadmapItems(
  roadmapId: string,
): Promise<RoadmapItem[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("roadmap_items")
    .select(
      "*, responsible:responsible_user_id ( full_name )",
    )
    .eq("roadmap_id", roadmapId)
    .order("order_number", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => {
    const raw = row as RoadmapItemRow & {
      responsible?: { full_name?: string | null } | null;
    };
    return mapRoadmapItem({
      ...raw,
      responsible_name: raw.responsible?.full_name ?? null,
    });
  });
}

export async function listTasksForRoadmapItems(
  itemIds: string[],
): Promise<RoadmapTask[]> {
  if (!hasSupabaseEnv() || itemIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .in("roadmap_item_id", itemIds)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as TaskRow[]).map(mapRoadmapTask);
}

export async function listProjectMetrics(
  projectId: string,
): Promise<ProjectMetric[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_metrics")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as ProjectMetricRow[]).map(mapProjectMetric);
}

export async function getProjectProgressSummary(
  projectId: string,
): Promise<ProjectProgressSummary> {
  const empty: ProjectProgressSummary = {
    projectId,
    roadmap: null,
    currentItem: null,
    percentComplete: 0,
    items: [],
    upcomingTasks: [],
    overdueTasks: [],
    overdueItems: [],
    metrics: [],
    completedItemsCount: 0,
    totalItemsCount: 0,
  };

  const [roadmap, metrics] = await Promise.all([
    getActiveRoadmapForProject(projectId),
    listProjectMetrics(projectId),
  ]);

  if (!roadmap) {
    return { ...empty, metrics };
  }

  const items = await listRoadmapItems(roadmap.id);
  const tasks = await listTasksForRoadmapItems(items.map((item) => item.id));
  const tasksByItem = new Map<string, RoadmapTask[]>();
  for (const task of tasks) {
    if (!task.roadmapItemId) continue;
    const list = tasksByItem.get(task.roadmapItemId) ?? [];
    list.push(task);
    tasksByItem.set(task.roadmapItemId, list);
  }

  const enriched = items.map((item) => {
    const itemTasks = tasksByItem.get(item.id) ?? [];
    return {
      ...item,
      tasks: itemTasks,
      progressPercent: taskProgressPercent(itemTasks),
    };
  });

  const completedItemsCount = enriched.filter(
    (item) => item.status === "completed",
  ).length;
  const activeItems = enriched.filter(
    (item) => item.status !== "cancelled",
  );
  const totalItemsCount = activeItems.length;
  const percentComplete =
    totalItemsCount === 0
      ? 0
      : Math.round((completedItemsCount / totalItemsCount) * 100);

  const currentItem =
    enriched.find((item) => item.status === "in_progress") ??
    enriched.find((item) => item.status === "planned") ??
    enriched.find((item) => item.status === "blocked") ??
    null;

  const openTasks = tasks.filter(
    (task) => task.status !== "completed" && task.status !== "cancelled",
  );
  const overdueTasks = openTasks.filter((task) =>
    isOverdue(task.deadline, task.status),
  );
  const upcomingTasks = openTasks
    .filter((task) => !isOverdue(task.deadline, task.status))
    .slice(0, 6);

  const overdueItems = enriched.filter((item) =>
    isOverdue(item.deadline, item.status),
  );

  return {
    projectId,
    roadmap,
    currentItem,
    percentComplete,
    items: enriched,
    upcomingTasks,
    overdueTasks,
    overdueItems,
    metrics,
    completedItemsCount,
    totalItemsCount,
  };
}
