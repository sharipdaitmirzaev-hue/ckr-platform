export const ROADMAP_STATUSES = [
  "draft",
  "active",
  "completed",
  "archived",
] as const;

export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

export const roadmapStatusLabels: Record<RoadmapStatus, string> = {
  draft: "Черновик",
  active: "Активна",
  completed: "Завершена",
  archived: "Архив",
};

export const ROADMAP_ITEM_STATUSES = [
  "planned",
  "in_progress",
  "blocked",
  "completed",
  "cancelled",
] as const;

export type RoadmapItemStatus = (typeof ROADMAP_ITEM_STATUSES)[number];

export const roadmapItemStatusLabels: Record<RoadmapItemStatus, string> = {
  planned: "Запланирован",
  in_progress: "В работе",
  blocked: "Блокер",
  completed: "Завершён",
  cancelled: "Отменён",
};

export const METRIC_PERIODS = [
  "month",
  "quarter",
  "half_year",
  "year",
  "custom",
] as const;

export type MetricPeriod = (typeof METRIC_PERIODS)[number];

export const metricPeriodLabels: Record<MetricPeriod, string> = {
  month: "Месяц",
  quarter: "Квартал",
  half_year: "Полгода",
  year: "Год",
  custom: "Свой период",
};
