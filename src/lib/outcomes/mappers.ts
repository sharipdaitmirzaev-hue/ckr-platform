import type {
  ProjectFinancialMetric,
  ProjectResult,
} from "@/types/outcomes";
import type {
  ProjectFinancialMetricRow,
  ProjectResultRow,
} from "@/types/database";

export function mapProjectResult(row: ProjectResultRow): ProjectResult {
  return {
    id: row.id,
    projectId: row.project_id,
    resultType: row.result_type,
    title: row.title,
    description: row.description,
    value: row.value === null || row.value === undefined ? null : Number(row.value),
    unit: row.unit,
    achievedAt: row.achieved_at,
    metricId: row.metric_id,
    createdAt: row.created_at,
  };
}

export function mapProjectFinancialMetric(
  row: ProjectFinancialMetricRow,
): ProjectFinancialMetric {
  return {
    id: row.id,
    projectId: row.project_id,
    metricType: row.metric_type,
    value: Number(row.value) || 0,
    currency: row.currency,
    period: row.period,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
