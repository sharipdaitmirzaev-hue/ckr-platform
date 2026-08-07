export const PROJECT_RESULT_TYPES = [
  "revenue",
  "investment",
  "partnership",
  "launch",
  "growth",
  "cost_reduction",
  "other",
] as const;

export type ProjectResultType = (typeof PROJECT_RESULT_TYPES)[number];

export const projectResultTypeLabels: Record<ProjectResultType, string> = {
  revenue: "Выручка",
  investment: "Инвестиции",
  partnership: "Партнёрство",
  launch: "Запуск",
  growth: "Рост",
  cost_reduction: "Снижение затрат",
  other: "Прочее",
};

export const FINANCIAL_METRIC_TYPES = [
  "revenue",
  "investment",
  "expenses",
  "profit",
  "valuation",
] as const;

export type FinancialMetricType = (typeof FINANCIAL_METRIC_TYPES)[number];

export const financialMetricTypeLabels: Record<FinancialMetricType, string> = {
  revenue: "Выручка",
  investment: "Инвестиции",
  expenses: "Расходы",
  profit: "Прибыль",
  valuation: "Оценка",
};
