export const PRODUCT_IMPROVEMENT_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export type ProductImprovementPriority =
  (typeof PRODUCT_IMPROVEMENT_PRIORITIES)[number];

export const productImprovementPriorityLabels: Record<
  ProductImprovementPriority,
  string
> = {
  critical: "Критичный",
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

export const PRODUCT_IMPROVEMENT_STATUSES = [
  "planned",
  "in_progress",
  "released",
  "rejected",
] as const;

export type ProductImprovementStatus =
  (typeof PRODUCT_IMPROVEMENT_STATUSES)[number];

export const productImprovementStatusLabels: Record<
  ProductImprovementStatus,
  string
> = {
  planned: "Запланировано",
  in_progress: "В работе",
  released: "Выпущено",
  rejected: "Отклонено",
};

export const PRODUCT_IMPROVEMENT_SOURCES = [
  "feedback",
  "pilot_issue",
  "analytics",
  "lia",
  "manual",
] as const;

export type ProductImprovementSource =
  (typeof PRODUCT_IMPROVEMENT_SOURCES)[number];

export const productImprovementSourceLabels: Record<
  ProductImprovementSource,
  string
> = {
  feedback: "Feedback",
  pilot_issue: "Pilot issue",
  analytics: "Аналитика",
  lia: "Лия",
  manual: "Вручную",
};

export function isProductImprovementPriority(
  value: string,
): value is ProductImprovementPriority {
  return (PRODUCT_IMPROVEMENT_PRIORITIES as readonly string[]).includes(value);
}

export function isProductImprovementStatus(
  value: string,
): value is ProductImprovementStatus {
  return (PRODUCT_IMPROVEMENT_STATUSES as readonly string[]).includes(value);
}

export function isProductImprovementSource(
  value: string,
): value is ProductImprovementSource {
  return (PRODUCT_IMPROVEMENT_SOURCES as readonly string[]).includes(value);
}

/** Severity pilot_issue → priority improvement. */
export function priorityFromSeverity(
  severity: string,
): ProductImprovementPriority {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (severity === "low") return "low";
  return "medium";
}

/** Feedback priority → improvement priority. */
export function priorityFromFeedback(
  priority: string,
): ProductImprovementPriority {
  if (priority === "critical") return "critical";
  if (priority === "high") return "high";
  if (priority === "low") return "low";
  return "medium";
}
