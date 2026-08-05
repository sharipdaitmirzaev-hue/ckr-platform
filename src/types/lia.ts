export type LiaMessageRole = "user" | "assistant" | "system" | "tool";

export type LiaScenarioId =
  | "business_idea"
  | "find_investments"
  | "find_property"
  | "find_expert"
  | "solution"
  | "realize_project"
  | "org_find_projects"
  | "org_offer_opportunities"
  | "check_reliability"
  | "business_audit"
  | "develop_strategy"
  | "check_progress"
  | "evaluate_outcome";

/** Отчёт сценария «Аудит бизнеса». */
export type BusinessAuditReport = {
  industry: string;
  region: string;
  stage: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  risks: string[];
  next_steps: string[];
};

/** Отчёт сценария «Разработать стратегию развития». */
export type StrategyReport = {
  projectTitle: string;
  summary: string;
  goals: string[];
  growthDirections: string[];
  resources: string[];
  risks: string[];
  actionPlan: string[];
  methodologyStage: "strategy";
  suggestedTemplate:
    | "new_business"
    | "business_development"
    | "investment_project"
    | "business_optimization";
};

/** Отчёт сценария «Проверь прогресс проекта». */
export type ProgressReport = {
  projectTitle: string;
  summary: string;
  completed_items: string[];
  delayed_items: string[];
  risks: string[];
  recommendations: string[];
  next_steps: string[];
  percentComplete: number;
  currentStage: string | null;
};

/** Отчёт сценария «Оцени результат проекта». */
export type OutcomeReport = {
  projectTitle: string;
  summary: string;
  achievements: string[];
  missed_targets: string[];
  risks: string[];
  recommendations: string[];
  next_steps: string[];
};

export type LiaSession = {
  id: string;
  userId: string;
  title: string;
  contextType: string | null;
  contextId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LiaMessage = {
  id: string;
  sessionId: string;
  role: LiaMessageRole;
  content: string;
  metadata: LiaMessageMetadata;
  createdAt: string;
};

export type LiaResultLink = {
  type: "project" | "opportunity" | "investment" | "expert";
  id: string;
  title: string;
  summary: string;
  href: string;
};

/** Черновик проекта из сценария Лии «От идеи до проекта». */
export type ProjectDraft = {
  title: string;
  summary: string;
  description: string;
  category: string;
  region: string;
  investment_required: number;
  stage: string;
  existing_resources: string;
  required_resources: string;
  /** Служебные поля для UI/БД. */
  currency?: string;
  /** @deprecated используйте existing_resources */
  assets?: string;
  /** @deprecated используйте required_resources */
  needs?: string;
};

/**
 * Каталожная сборка сценария «Собери комплексное решение» (чат).
 * Не путать с SolutionDraft — анализом конкретного проекта.
 */
export type LiaCatalogDraft = {
  task: string;
  projects: LiaResultLink[];
  opportunities: LiaResultLink[];
  investments: LiaResultLink[];
  experts: LiaResultLink[];
  nextSteps: string[];
  risks: string[];
  missingData: string[];
};

/** Результат анализа проекта Лией. */
export type SolutionDraft = {
  project_id: string;
  summary: string;
  available_resources: string[];
  missing_resources: string[];
  recommendations: string[];
  risks: string[];
  next_steps: string[];
};

/** Совпадение во внутреннем поиске ЦКР. */
export type InternalMatch = {
  id: string;
  title: string;
  type: "project" | "opportunity" | "investment" | "expert";
  href: string;
  description: string;
  /** Соответствие 0–1. */
  matchScore: number;
};

/** Результат внешнего поиска (не доверять автоматически). */
export type ExternalSearchResult = {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  /** ISO-дата или YYYY-MM-DD; пустая строка, если неизвестна. */
  published_at: string;
  /** Оценка доверия 0–1 (эвристика провайдера, не верификация ЦКР). */
  trust_score: number;
  /** Внешние данные всегда непроверенные. */
  trusted: false;
  /** Запрос, по которому получен результат. */
  query?: string;
  /** @deprecated используйте trust_score */
  confidence?: number;
  /** @deprecated используйте published_at */
  date?: string;
};

/** Комплексный отчёт: проект + ЦКР + внешние источники. */
export type SolutionReport = {
  project: {
    id: string;
    title: string;
    summary: string;
    region: string;
    category: string;
    stage: string;
    investment_required: number;
  };
  available: string[];
  missing: string[];
  /** Поисковые запросы, сформированные Лией для внешнего поиска. */
  searchQueries: string[];
  externalProvider: string;
  internal: {
    projects: InternalMatch[];
    opportunities: InternalMatch[];
    investments: InternalMatch[];
    experts: InternalMatch[];
  };
  external: ExternalSearchResult[];
  recommendations: string[];
  risks: string[];
  next_steps: string[];
  solutionDraft: SolutionDraft;
  disclaimer: string;
};

export type LiaAnalysis = {
  id: string;
  userId: string;
  projectId: string;
  projectTitle: string | null;
  summary: string;
  availableResources: string[];
  missingResources: string[];
  recommendations: string[];
  risks: string[];
  nextSteps: string[];
  internalMatches: InternalMatch[];
  externalResults: ExternalSearchResult[];
  report: SolutionReport;
  createdAt: string;
};

export type LiaMessageMetadata = {
  scenario?: LiaScenarioId | null;
  results?: LiaResultLink[];
  projectDraft?: ProjectDraft | null;
  /** Анализ проекта (Этап 11). */
  solutionDraft?: SolutionDraft | null;
  /** Каталожная сборка чата. */
  catalogDraft?: LiaCatalogDraft | null;
  solutionReport?: SolutionReport | null;
  businessIdeaStep?: number;
  businessIdeaAnswers?: Record<string, string>;
  businessAuditStep?: number;
  businessAuditAnswers?: Record<string, string>;
  businessAuditReport?: BusinessAuditReport | null;
  strategyStep?: number;
  strategyAnswers?: Record<string, string>;
  strategyReport?: StrategyReport | null;
  progressReport?: ProgressReport | null;
  outcomeReport?: OutcomeReport | null;
  disclaimer?: string;
  provider?: string;
  [key: string]: unknown;
};

export type LiaChatRequest = {
  sessionId?: string | null;
  message: string;
  scenario?: LiaScenarioId | null;
  /** Контекст проекта для сценария сопровождения. */
  projectId?: string | null;
};

export type LiaChatResponse = {
  ok: boolean;
  sessionId: string;
  assistantMessage: LiaMessage;
  results?: LiaResultLink[];
  projectDraft?: ProjectDraft | null;
  solutionDraft?: SolutionDraft | null;
  catalogDraft?: LiaCatalogDraft | null;
  disclaimer: string;
  error?: string;
};

export type LiaAnalyzeRequest = {
  projectId: string;
  /** analyze — только анализ; find_solutions — анализ + поиск. */
  mode?: "analyze" | "find_solutions";
};

export type LiaAnalyzeResponse = {
  ok: boolean;
  analysisId?: string;
  report?: SolutionReport;
  solutionDraft?: SolutionDraft;
  disclaimer: string;
  error?: string;
};
