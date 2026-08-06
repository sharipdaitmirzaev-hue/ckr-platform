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
  | "evaluate_outcome"
  | "pilot_insight"
  | "product_improvement"
  | "product_fix_review"
  | "beta_analysis"
  | "beta_review"
  | "launch_readiness"
  | "launch_guide"
  | "launch_status"
  | "launch_goals"
  | "closed_wave"
  | "wave_review"
  | "launch_decision"
  | "ecosystem"
  | "ecosystem_value"
  | "first_users"
  | "first_users_review"
  | "beta_expansion"
  | "open_beta_readiness"
  | "open_beta"
  | "open_beta_growth";

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

/** Отчёт сценария «Что мешает проекту двигаться?» (пилот, только анализ). */
export type PilotInsightReport = {
  summary: string;
  blocked_projects: string[];
  inactive_users: string[];
  recommendations: string[];
  next_actions: string[];
};

/** Отчёт сценария «Что улучшить в ЦКР?» (только анализ). */
export type ProductImprovementReport = {
  summary: string;
  main_problems: string[];
  patterns: string[];
  recommendations: string[];
  priority_actions: string[];
};

/** Отчёт Product Fix Sprint (этап 52). */
export type ProductFixSprintReport = {
  summary: string;
  fixed_issues: string[];
  remaining_issues: string[];
  activation_changes: string[];
  lia_changes: string[];
  recommendations: string[];
};

/**
 * Сценарий «Что улучшилось после исправлений?» (этап 52).
 * Не путать с ProductImprovementReport («Что улучшить в ЦКР?»).
 */
export type ProductFixImprovementReport = {
  summary: string;
  completed: string[];
  improved: string[];
  remaining_problems: string[];
  next_steps: string[];
};

/** Отчёт сценария «Как проходит запуск ЦКР?» (только анализ). */
export type BetaAnalysisReport = {
  summary: string;
  activation_rate: number;
  blocked_users: string[];
  unused_features: string[];
  recommendations: string[];
};

/** Обзор закрытой beta (этап 39, только по данным). */
export type BetaReviewReport = {
  summary: string;
  successful_flows: string[];
  blocked_flows: string[];
  unused_features: string[];
  user_problems: string[];
  business_value_signals: string[];
  recommendations: string[];
};

/** Готовность к public launch (только анализ). */
export type LaunchReadinessReport = {
  summary: string;
  critical_issues: string[];
  recommended_actions: string[];
  launch_risks: string[];
};

/** Сценарий «Как начать работу с ЦКР?» — роль и первый шаг. */
export type LaunchGuide = {
  summary: string;
  recommended_role: string;
  role_rationale: string;
  first_step: string;
  next_steps: string[];
  tips: string[];
};

/** Сценарий «Как проходит запуск?» — статус волны (только анализ). */
export type LaunchStatusReport = {
  summary: string;
  activity: string[];
  blockers: string[];
  recommendations: string[];
};

/** Сценарий «Достигнуты ли цели запуска?» (только анализ). */
export type LaunchGoalReport = {
  summary: string;
  achieved_goals: string[];
  failed_goals: string[];
  risks: string[];
  recommendations: string[];
  next_actions: string[];
};

/** Сценарий «Проанализируй первую волну ЦКР» (только анализ). */
export type ClosedWaveReport = {
  summary: string;
  completed_goals: string[];
  failed_goals: string[];
  user_experience: string[];
  business_results: string[];
  recommendations: string[];
};

/** Сценарий «Проанализируй результаты первой волны» (только анализ). */
export type WaveReviewReport = {
  summary: string;
  success_factors: string[];
  problems: string[];
  patterns: string[];
  recommendations: string[];
};

/** Сценарий «Готов ли ЦКР к следующей волне?» (только анализ). */
export type LaunchDecisionAIReport = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recommendation: string;
};

/** Сценарий «Как развивается экосистема ЦКР?» (только анализ). */
export type EcosystemReport = {
  summary: string;
  active_users: string[];
  project_activity: string[];
  expert_activity: string[];
  investment_activity: string[];
  connections: string[];
  recommendations: string[];
};

/** Сценарий «Какая польза от экосистемы ЦКР?» (только анализ). */
export type EcosystemValueReport = {
  summary: string;
  strong_connections: string[];
  weak_connections: string[];
  successful_matches: string[];
  blocked_matches: string[];
  recommendations: string[];
};

/** Сценарий «Как прошёл первый запуск ЦКР?» (только анализ). */
export type FirstUsersReport = {
  summary: string;
  activation: string[];
  user_behavior: string[];
  problems: string[];
  success_cases: string[];
  recommendations: string[];
};

/** Анализ Лии в First Users Wave (этап 51). */
export type FirstUsersLiaReport = {
  summary: string;
  used_scenarios: string[];
  successful_flows: string[];
  blocked_flows: string[];
  recommendations: string[];
};

/** Сценарий «Что показал первый запуск ЦКР?» (только анализ). */
export type FirstUsersReviewReport = {
  summary: string;
  activation: string[];
  user_behavior: string[];
  successful_cases: string[];
  main_problems: string[];
  recommendations: string[];
};

/** Сценарий «Как проходит расширенная beta?» (этап 53, только анализ). */
export type BetaExpansionReport = {
  summary: string;
  activation: string[];
  role_analysis: string[];
  lia_usage: string[];
  ecosystem_growth: string[];
  problems: string[];
  recommendations: string[];
};

/** Сценарий «Готов ли ЦКР к открытому запуску?» (этап 54, только анализ). */
export type OpenBetaReadinessReport = {
  summary: string;
  product_readiness: string[];
  user_readiness: string[];
  ecosystem_readiness: string[];
  risks: string[];
  recommendations: string[];
};

/** Сценарий «Как проходит открытый запуск ЦКР?» (этап 55, только анализ). */
export type OpenBetaReport = {
  summary: string;
  users: string[];
  activation: string[];
  lia_usage: string[];
  ecosystem_activity: string[];
  problems: string[];
  recommendations: string[];
};

/** Сценарий «Почему пользователи возвращаются в ЦКР?» (этап 56, только анализ). */
export type RetentionReport = {
  summary: string;
  returning_users: string[];
  valuable_actions: string[];
  drop_off_points: string[];
  recommendations: string[];
};

/** Рост и ценность по ролям Open Beta (этап 56). */
export type RoleGrowthReport = {
  summary: string;
  entrepreneurs: string[];
  experts: string[];
  investors: string[];
  organizations: string[];
};

/** Активные пользователи → отзывы → улучшения (этап 56). */
export type UserValueFeedbackReport = {
  summary: string;
  active_users: string[];
  feedback_themes: string[];
  improvements: string[];
  recommendations: string[];
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
  pilotInsightReport?: PilotInsightReport | null;
  productImprovementReport?: ProductImprovementReport | null;
  productFixSprintReport?: ProductFixSprintReport | null;
  productFixImprovementReport?: ProductFixImprovementReport | null;
  betaAnalysisReport?: BetaAnalysisReport | null;
  betaReviewReport?: BetaReviewReport | null;
  launchReadinessReport?: LaunchReadinessReport | null;
  launchGuide?: LaunchGuide | null;
  launchStatusReport?: LaunchStatusReport | null;
  launchGoalReport?: LaunchGoalReport | null;
  closedWaveReport?: ClosedWaveReport | null;
  waveReviewReport?: WaveReviewReport | null;
  launchDecisionAIReport?: LaunchDecisionAIReport | null;
  ecosystemReport?: EcosystemReport | null;
  ecosystemValueReport?: EcosystemValueReport | null;
  firstUsersReport?: FirstUsersReport | null;
  firstUsersLiaReport?: FirstUsersLiaReport | null;
  firstUsersReviewReport?: FirstUsersReviewReport | null;
  betaExpansionReport?: BetaExpansionReport | null;
  openBetaReadinessReport?: OpenBetaReadinessReport | null;
  openBetaReport?: OpenBetaReport | null;
  retentionReport?: RetentionReport | null;
  roleGrowthReport?: RoleGrowthReport | null;
  userValueFeedbackReport?: UserValueFeedbackReport | null;
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
