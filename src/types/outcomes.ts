import type {
  FinancialMetricType,
  ProjectResultType,
} from "@/config/outcomes";
import type { ProjectMetric } from "@/types/execution";

export type ProjectResult = {
  id: string;
  projectId: string;
  resultType: ProjectResultType;
  title: string;
  description: string;
  value: number | null;
  unit: string;
  achievedAt: string | null;
  metricId: string | null;
  createdAt?: string;
};

export type ProjectFinancialMetric = {
  id: string;
  projectId: string;
  metricType: FinancialMetricType;
  value: number;
  currency: string;
  period: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Цель → текущее → фактический результат. */
export type KpiOutcomeRow = {
  metric: ProjectMetric;
  result: ProjectResult | null;
  targetValue: number;
  currentValue: number;
  actualValue: number | null;
  attainmentPercent: number | null;
};

export type ProjectOutcomeSummary = {
  projectId: string;
  projectTitle: string;
  status: string;
  results: ProjectResult[];
  financialMetrics: ProjectFinancialMetric[];
  kpiRows: KpiOutcomeRow[];
  roadmapPercent: number;
  dealsCount: number;
};

export type CkrEfficiencyMetrics = {
  projectsCreated: number;
  projectsCompleted: number;
  projectsActive: number;
  dealsCount: number;
  dealsCompleted: number;
  investmentSum: number;
  partnersCount: number;
  avgDaysIdeaToLaunch: number | null;
  avgDaysToFirstDeal: number | null;
  avgRoadmapCompletionPercent: number;
  avgMilestonesCompletedPercent: number;
  projectSuccessRate: number;
  avgAccompanimentDays: number | null;
};
