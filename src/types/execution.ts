import type {
  MetricPeriod,
  RoadmapItemStatus,
  RoadmapStatus,
} from "@/config/execution";

export type ProjectRoadmap = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type RoadmapItem = {
  id: string;
  roadmapId: string;
  title: string;
  description: string;
  orderNumber: number;
  responsibleUserId: string | null;
  responsibleName?: string | null;
  deadline: string | null;
  status: RoadmapItemStatus;
  milestoneId: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** Задачи этапа (из tasks) */
  tasks?: RoadmapTask[];
  /** Прогресс 0–100 по задачам этапа */
  progressPercent?: number;
};

export type RoadmapTask = {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string | null;
  assignedTo: string | null;
  roadmapItemId: string | null;
  relatedType: string | null;
  relatedId: string | null;
  priority: string;
};

export type ProjectMetric = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: MetricPeriod | string;
  createdAt?: string;
  updatedAt?: string;
};

/** Сводка прогресса для workspace / Лии. */
export type ProjectProgressSummary = {
  projectId: string;
  roadmap: ProjectRoadmap | null;
  currentItem: RoadmapItem | null;
  percentComplete: number;
  items: RoadmapItem[];
  upcomingTasks: RoadmapTask[];
  overdueTasks: RoadmapTask[];
  overdueItems: RoadmapItem[];
  metrics: ProjectMetric[];
  completedItemsCount: number;
  totalItemsCount: number;
};
