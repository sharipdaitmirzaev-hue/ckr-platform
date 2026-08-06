import type {
  ProjectMetric,
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

export function mapProjectRoadmap(row: ProjectRoadmapRow): ProjectRoadmap {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRoadmapItem(
  row: RoadmapItemRow & { responsible_name?: string | null },
): RoadmapItem {
  return {
    id: row.id,
    roadmapId: row.roadmap_id,
    title: row.title,
    description: row.description,
    orderNumber: row.order_number,
    responsibleUserId: row.responsible_user_id,
    responsibleName: row.responsible_name ?? null,
    deadline: row.deadline,
    status: row.status,
    milestoneId: row.milestone_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRoadmapTask(row: TaskRow): RoadmapTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    deadline: row.deadline,
    assignedTo: row.assigned_to,
    roadmapItemId: row.roadmap_item_id ?? null,
    relatedType: row.related_type,
    relatedId: row.related_id,
    priority: row.priority,
  };
}

export function mapProjectMetric(row: ProjectMetricRow): ProjectMetric {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    targetValue: Number(row.target_value) || 0,
    currentValue: Number(row.current_value) || 0,
    unit: row.unit,
    period: row.period,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function taskProgressPercent(tasks: RoadmapTask[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((item) => item.status === "completed").length;
  return Math.round((done / tasks.length) * 100);
}
