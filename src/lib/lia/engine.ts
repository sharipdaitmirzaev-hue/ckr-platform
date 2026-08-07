import {
  BUSINESS_AUDIT_START_PATTERN,
  BUSINESS_AUDIT_STEPS,
  BUSINESS_IDEA_STEPS,
  CHECK_PROGRESS_START_PATTERN,
  CHECK_RELIABILITY_PATTERN,
  DEVELOP_STRATEGY_START_PATTERN,
  DEVELOP_STRATEGY_STEPS,
  EVALUATE_OUTCOME_START_PATTERN,
  LIA_DISCLAIMER,
  PILOT_INSIGHT_START_PATTERN,
  BETA_ANALYSIS_START_PATTERN,
  BETA_REVIEW_START_PATTERN,
  LAUNCH_READINESS_START_PATTERN,
  LAUNCH_GUIDE_START_PATTERN,
  LAUNCH_STATUS_START_PATTERN,
  LAUNCH_GOALS_START_PATTERN,
  CLOSED_WAVE_START_PATTERN,
  WAVE_REVIEW_START_PATTERN,
  LAUNCH_DECISION_START_PATTERN,
  ECOSYSTEM_START_PATTERN,
  ECOSYSTEM_VALUE_START_PATTERN,
  FIRST_USERS_START_PATTERN,
  FIRST_USERS_REVIEW_START_PATTERN,
  BETA_EXPANSION_START_PATTERN,
  OPEN_BETA_READINESS_START_PATTERN,
  OPEN_BETA_GROWTH_START_PATTERN,
  OPEN_BETA_START_PATTERN,
  PUBLIC_LAUNCH_DECISION_START_PATTERN,
  PUBLIC_LAUNCH_START_PATTERN,
  LIVE_LAUNCH_START_PATTERN,
  GROWTH_START_PATTERN,
  PROJECT_ACQUISITION_START_PATTERN,
  PARTNERSHIP_NETWORK_START_PATTERN,
  REVENUE_OPPORTUNITY_START_PATTERN,
  PRODUCT_IMPROVEMENT_START_PATTERN,
  PRODUCT_FIX_REVIEW_START_PATTERN,
  PROJECT_FLOW_START_PATTERN,
  REALIZE_PROJECT_PATTERN,
} from "@/config/lia";
import { trackAnalyticsEvent } from "@/lib/analytics/track";
import { getProjectProgressSummary } from "@/lib/execution/queries";
import { getLiaProvider } from "@/lib/lia/provider";
import { buildRealizeProjectGuidance } from "@/lib/lia/realize";
import {
  searchExperts,
  searchInvestments,
  searchOpportunities,
  searchProjects,
} from "@/lib/lia/search";
import { getProjectOutcomeSummary } from "@/lib/outcomes/queries";
import { getProjectById } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";
import type {
  BusinessAuditReport,
  LiaCatalogDraft,
  LiaMessage,
  LiaMessageMetadata,
  LiaResultLink,
  LiaScenarioId,
  OutcomeReport,
  PilotInsightReport,
  BetaAnalysisReport,
  BetaReviewReport,
  ClosedWaveReport,
  LaunchGuide,
  LaunchGoalReport,
  LaunchReadinessReport,
  LaunchStatusReport,
  ProductImprovementReport,
  ProductFixImprovementReport,
  WaveReviewReport,
  LaunchDecisionAIReport,
  EcosystemReport,
  EcosystemValueReport,
  FirstUsersReport,
  FirstUsersReviewReport,
  BetaExpansionReport,
  OpenBetaReadinessReport,
  OpenBetaReport,
  RetentionReport,
  RoleGrowthReport,
  UserValueFeedbackReport,
  PublicLaunchDecisionReport,
  PublicLaunchReport,
  LiveLaunchReport,
  GrowthReport,
  ProjectAcquisitionReport,
  PartnershipReport,
  RevenueOpportunityReport,
  ProgressReport,
  ProjectDraft,
  SolutionDraft,
  StrategyReport,
} from "@/types/lia";
import {
  financialMetricTypeLabels,
  projectResultTypeLabels,
} from "@/config/outcomes";

export type LiaEngineResult = {
  content: string;
  metadata: LiaMessageMetadata;
  results: LiaResultLink[];
  projectDraft: ProjectDraft | null;
  solutionDraft: SolutionDraft | null;
  catalogDraft: LiaCatalogDraft | null;
};

function detectScenario(
  message: string,
  explicit: LiaScenarioId | null,
): LiaScenarioId | null {
  if (explicit) return explicit;
  const value = message.toLowerCase();
  if (
    PROJECT_FLOW_START_PATTERN.test(value) ||
    /бизнес-иде|оформить.*иде|создать проект|идею/.test(value)
  ) {
    return "business_idea";
  }
  if (/инвест/.test(value)) return "find_investments";
  if (/земл|помещен|недвиж|аренд/.test(value)) return "find_property";
  if (/эксперт|юрист|бухгалтер|инженер|консульт/.test(value)) {
    return "find_expert";
  }
  if (/комплексн|решени|собери/.test(value)) return "solution";
  if (REALIZE_PROJECT_PATTERN.test(value)) return "realize_project";
  if (
    /подходящ.*проект|проект.*организац|для нашей организац/.test(value)
  ) {
    return "org_find_projects";
  }
  if (
    /возможност.*предлож|мы можем предлож|предложит.*организац/.test(value)
  ) {
    return "org_offer_opportunities";
  }
  if (CHECK_RELIABILITY_PATTERN.test(value)) {
    return "check_reliability";
  }
  if (BUSINESS_AUDIT_START_PATTERN.test(value)) {
    return "business_audit";
  }
  if (DEVELOP_STRATEGY_START_PATTERN.test(value)) {
    return "develop_strategy";
  }
  if (CHECK_PROGRESS_START_PATTERN.test(value)) {
    return "check_progress";
  }
  if (EVALUATE_OUTCOME_START_PATTERN.test(value)) {
    return "evaluate_outcome";
  }
  if (PILOT_INSIGHT_START_PATTERN.test(value)) {
    return "pilot_insight";
  }
  if (PRODUCT_FIX_REVIEW_START_PATTERN.test(value)) {
    return "product_fix_review";
  }
  if (PRODUCT_IMPROVEMENT_START_PATTERN.test(value)) {
    return "product_improvement";
  }
  if (BETA_ANALYSIS_START_PATTERN.test(value)) {
    return "beta_analysis";
  }
  if (BETA_REVIEW_START_PATTERN.test(value)) {
    return "beta_review";
  }
  if (LAUNCH_GUIDE_START_PATTERN.test(value)) {
    return "launch_guide";
  }
  if (LAUNCH_STATUS_START_PATTERN.test(value)) {
    return "launch_status";
  }
  if (LAUNCH_GOALS_START_PATTERN.test(value)) {
    return "launch_goals";
  }
  if (FIRST_USERS_REVIEW_START_PATTERN.test(value)) {
    return "first_users_review";
  }
  if (BETA_EXPANSION_START_PATTERN.test(value)) {
    return "beta_expansion";
  }
  if (FIRST_USERS_START_PATTERN.test(value)) {
    return "first_users";
  }
  if (ECOSYSTEM_VALUE_START_PATTERN.test(value)) {
    return "ecosystem_value";
  }
  if (ECOSYSTEM_START_PATTERN.test(value)) {
    return "ecosystem";
  }
  if (LAUNCH_DECISION_START_PATTERN.test(value)) {
    return "launch_decision";
  }
  if (WAVE_REVIEW_START_PATTERN.test(value)) {
    return "wave_review";
  }
  if (CLOSED_WAVE_START_PATTERN.test(value)) {
    return "closed_wave";
  }
  if (LIVE_LAUNCH_START_PATTERN.test(value)) {
    return "live_launch";
  }
  if (GROWTH_START_PATTERN.test(value)) {
    return "growth";
  }
  if (PROJECT_ACQUISITION_START_PATTERN.test(value)) {
    return "project_acquisition";
  }
  if (PARTNERSHIP_NETWORK_START_PATTERN.test(value)) {
    return "partnership_network";
  }
  if (REVENUE_OPPORTUNITY_START_PATTERN.test(value)) {
    return "revenue_opportunity";
  }
  if (PUBLIC_LAUNCH_START_PATTERN.test(value)) {
    return "public_launch";
  }
  if (PUBLIC_LAUNCH_DECISION_START_PATTERN.test(value)) {
    return "public_launch_decision";
  }
  if (OPEN_BETA_READINESS_START_PATTERN.test(value)) {
    return "open_beta_readiness";
  }
  if (OPEN_BETA_GROWTH_START_PATTERN.test(value)) {
    return "open_beta_growth";
  }
  if (OPEN_BETA_START_PATTERN.test(value)) {
    return "open_beta";
  }
  if (LAUNCH_READINESS_START_PATTERN.test(value)) {
    return "launch_readiness";
  }
  return null;
}

function extractProjectIdFromMessage(message: string) {
  const match = message.match(
    /(?:projectId|project|проект)[:\s]+([0-9a-f-]{36})/i,
  );
  return match?.[1] || null;
}

function extractEntityIdFromMessage(message: string) {
  const labeled = message.match(
    /(?:userId|profileId|участник|профиль|id)[:\s]+([0-9a-f-]{36})/i,
  );
  if (labeled?.[1]) return labeled[1];
  const bare = message.match(
    /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  return bare?.[1] || null;
}

function mapCategorySlug(raw: string) {
  const value = raw.toLowerCase();
  if (/производ/.test(value)) return "production";
  if (/недвиж|строит/.test(value)) return "real-estate";
  if (/сельск|агро/.test(value)) return "agriculture";
  if (/\bit\b|цифр|софт|tech/.test(value)) return "it";
  if (/туризм|hotel|гостин/.test(value)) return "tourism";
  return value.trim().slice(0, 40) || "production";
}

function mapStage(raw: string) {
  const value = raw.toLowerCase();
  if (value.includes("startup") || value.includes("стартап")) return "startup";
  if (value.includes("operating") || value.includes("действ")) {
    return "operating";
  }
  if (value.includes("expansion") || value.includes("расшир")) {
    return "expansion";
  }
  return "idea";
}

function parseInvestment(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  const amount = Number(digits || "0");
  return Number.isFinite(amount) ? amount : 0;
}

function getBusinessIdeaState(history: LiaMessage[]) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const message = history[i];
    if (
      message.role === "assistant" &&
      message.metadata?.scenario === "business_idea" &&
      typeof message.metadata.businessIdeaStep === "number"
    ) {
      return {
        step: message.metadata.businessIdeaStep,
        answers: (message.metadata.businessIdeaAnswers as Record<
          string,
          string
        >) || {},
      };
    }
  }
  return { step: 0, answers: {} as Record<string, string> };
}

function ensureMinLength(text: string, min: number, fallback: string) {
  const value = text.trim();
  if (value.length >= min) return value;
  const padded = `${value}${value ? " " : ""}${fallback}`.trim();
  return padded.length >= min
    ? padded
    : `${padded} ${".".repeat(min)}`.slice(0, min);
}

function buildProjectDraft(answers: Record<string, string>): ProjectDraft {
  const title = answers.title?.trim() || "Новый проект";
  const region = answers.region?.trim() || "Россия";
  const category = mapCategorySlug(answers.category || "production");
  const investmentRequired = parseInvestment(answers.investment || "0");
  const stage = mapStage(answers.stage || "idea");
  const existingResources = answers.assets?.trim() || "";
  const requiredResources = answers.needs?.trim() || "";
  const description = answers.description?.trim() || "";

  const summaryBase = [
    description.slice(0, 160) || `Проект «${title}» в регионе ${region}.`,
    requiredResources ? `Требуется: ${requiredResources}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const fullDescription = [
    description || `Описание проекта «${title}».`,
    existingResources ? `\n\nЧто уже есть: ${existingResources}` : "",
    requiredResources ? `\nЧто требуется: ${requiredResources}` : "",
  ]
    .join("")
    .trim();

  return {
    title,
    summary: ensureMinLength(
      summaryBase,
      20,
      "Предварительный черновик проекта ЦКР.",
    ).slice(0, 400),
    description: ensureMinLength(
      fullDescription,
      40,
      "Черновик сформирован с помощью Лии. Дополните детали перед публикацией.",
    ),
    category,
    region,
    investment_required: investmentRequired,
    stage,
    currency: "RUB",
    existing_resources: existingResources,
    required_resources: requiredResources,
    assets: existingResources,
    needs: requiredResources,
  };
}

async function handleBusinessIdea(
  userMessage: string,
  history: LiaMessage[],
): Promise<LiaEngineResult> {
  const state = getBusinessIdeaState(history);
  const answers = { ...state.answers };
  let step = state.step;

  const isStart =
    PROJECT_FLOW_START_PATTERN.test(userMessage) &&
    Object.keys(answers).length === 0 &&
    step === 0 &&
    !history.some((m) => m.metadata?.scenario === "business_idea");

  if (!isStart && step < BUSINESS_IDEA_STEPS.length) {
    const current = BUSINESS_IDEA_STEPS[step];
    answers[current.key] = userMessage.trim();
    step += 1;
  }

  if (step < BUSINESS_IDEA_STEPS.length) {
    const next = BUSINESS_IDEA_STEPS[step];
    const progress = `Шаг ${step + 1} из ${BUSINESS_IDEA_STEPS.length}`;
    return {
      content: [
        "Сценарий «От идеи до проекта».",
        progress,
        "",
        next.question,
        "",
        `_${LIA_DISCLAIMER}_`,
      ].join("\n"),
      metadata: {
        scenario: "business_idea",
        businessIdeaStep: step,
        businessIdeaAnswers: answers,
        disclaimer: LIA_DISCLAIMER,
      },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  const projectDraft = buildProjectDraft(answers);
  const content = [
    "Предварительный проект готов.",
    "",
    "Проверьте данные ниже. Лия не создаёт запись в базе автоматически — проект появится только после вашего подтверждения.",
    "",
    "Кнопки: «Редактировать» или «Создать проект».",
    "",
    `_${LIA_DISCLAIMER}_`,
  ].join("\n");

  return {
    content,
    metadata: {
      scenario: "business_idea",
      businessIdeaStep: step,
      businessIdeaAnswers: answers,
      projectDraft,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft,
    solutionDraft: null,
    catalogDraft: null,
  };
}

function getBusinessAuditState(history: LiaMessage[]) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const message = history[i];
    if (
      message.role === "assistant" &&
      message.metadata?.scenario === "business_audit" &&
      typeof message.metadata.businessAuditStep === "number"
    ) {
      return {
        step: message.metadata.businessAuditStep,
        answers: (message.metadata.businessAuditAnswers as Record<
          string,
          string
        >) || {},
      };
    }
  }
  return { step: 0, answers: {} as Record<string, string> };
}

function buildBusinessAuditReport(
  answers: Record<string, string>,
): BusinessAuditReport {
  const industry = answers.industry?.trim() || "не указана";
  const region = answers.region?.trim() || "не указан";
  const stage = mapStage(answers.stage || "operating");
  const resources = answers.resources?.trim() || "";
  const team = answers.team?.trim() || "";
  const problems = answers.problems?.trim() || "";
  const goals = answers.goals?.trim() || "";

  const strengths = [
    resources
      ? `Есть ресурсная база: ${resources.slice(0, 160)}`
      : "Есть действующий бизнес-контур для анализа",
    team
      ? `Команда обозначена: ${team.slice(0, 160)}`
      : "Готовность пройти структурированный аудит",
    `Стадия «${stage}» позволяет планировать ближайшие шаги`,
  ];

  const weaknesses = [
    problems
      ? `Заявленные ограничения: ${problems.slice(0, 180)}`
      : "Проблемы роста сформулированы недостаточно конкретно",
    !resources
      ? "Ресурсы описаны кратко — сложно приоритизировать поддержку"
      : "Часть ресурсов может быть узким местом при масштабировании",
    !team
      ? "Роли команды не детализированы"
      : "Нужно проверить загрузку ключевых ролей",
  ];

  const opportunities = [
    goals
      ? `Цели на горизонте: ${goals.slice(0, 180)}`
      : "Можно зафиксировать цели на 6–12 месяцев в проекте ЦКР",
    "Использовать шаблон business_development для проекта развития",
    "Сегментировать CRM: customers / suppliers / partners",
    `Подобрать решения ЦКР под отрасль «${industry}» и регион «${region}»`,
  ];

  const risks = [
    problems
      ? `Риск усиления текущих проблем без фокуса: ${problems.slice(0, 120)}`
      : "Риск распыления усилий без приоритизации",
    "Недостаток оборотного капитала или партнёров при росте",
    "Концентрация продаж / поставок в узком контуре",
  ];

  const next_steps = [
    "Создать проект по шаблону «Развитие бизнеса» и заполнить разделы",
    "Применить CRM-шаблоны: клиенты, поставщики, партнёры",
    "Запустить анализ Лии / find_solutions по проекту",
    "Собрать этапы workspace: подготовка → продажи → партнёры → масштаб",
    "Зафиксировать 1–2 пилотные сделки в negotiation",
  ];

  return {
    industry,
    region,
    stage,
    summary: [
      `Предварительный аудит бизнеса в отрасли «${industry}» (${region}).`,
      `Стадия: ${stage}.`,
      goals ? `Фокус целей: ${goals.slice(0, 120)}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    strengths,
    weaknesses,
    opportunities,
    risks,
    next_steps,
  };
}

async function handleBusinessAudit(
  userMessage: string,
  history: LiaMessage[],
): Promise<LiaEngineResult> {
  const state = getBusinessAuditState(history);
  const answers = { ...state.answers };
  let step = state.step;

  const isStart =
    BUSINESS_AUDIT_START_PATTERN.test(userMessage) &&
    Object.keys(answers).length === 0 &&
    step === 0 &&
    !history.some((m) => m.metadata?.scenario === "business_audit");

  if (!isStart && step < BUSINESS_AUDIT_STEPS.length) {
    const current = BUSINESS_AUDIT_STEPS[step];
    answers[current.key] = userMessage.trim();
    step += 1;
  }

  if (step < BUSINESS_AUDIT_STEPS.length) {
    const next = BUSINESS_AUDIT_STEPS[step];
    const progress = `Шаг ${step + 1} из ${BUSINESS_AUDIT_STEPS.length}`;
    return {
      content: [
        "Сценарий «Аудит бизнеса».",
        progress,
        "",
        next.question,
        "",
        `_${LIA_DISCLAIMER}_`,
      ].join("\n"),
      metadata: {
        scenario: "business_audit",
        businessAuditStep: step,
        businessAuditAnswers: answers,
        disclaimer: LIA_DISCLAIMER,
      },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  const report = buildBusinessAuditReport(answers);
  const projectDraft = buildProjectDraftFromAudit(answers, report);

  try {
    const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
    await trackAnalyticsEvent({
      eventType: "lia_started",
      entityType: "project_acquisition",
      metadata: {
        source: "lia",
        scenario: "business_audit",
        channel: "lia",
        acquisition: true,
        draftProposed: true,
      },
    });
  } catch {
    // мягкий сбой
  }

  const content = [
    "Аудит моего бизнеса подготовлен.",
    "",
    report.summary,
    "",
    "Ниже — BusinessAuditReport: сильные/слабые стороны, возможности, риски и шаги.",
    "",
    "Предлагаю создать проект развития ЦКР по шаблону business_development.",
    "Проект появится только после вашего подтверждения (кнопка «Создать проект»).",
    "",
    "Дальше: стратегия → ресурсы → эксперты / партнёры / инвестиции.",
    "",
    `_${LIA_DISCLAIMER}_`,
  ].join("\n");

  return {
    content,
    metadata: {
      scenario: "business_audit",
      businessAuditStep: step,
      businessAuditAnswers: answers,
      businessAuditReport: report,
      projectDraft,
      disclaimer: LIA_DISCLAIMER,
      source: "lia",
      acquisition: true,
    },
    results: [],
    projectDraft,
    solutionDraft: null,
    catalogDraft: null,
  };
}

function buildProjectDraftFromAudit(
  answers: Record<string, string>,
  report: BusinessAuditReport,
): ProjectDraft {
  const industry = answers.industry?.trim() || report.industry;
  const region = answers.region?.trim() || report.region;
  const stage = mapStage(answers.stage || report.stage || "operating");
  const resources = answers.resources?.trim() || "";
  const problems = answers.problems?.trim() || "";
  const goals = answers.goals?.trim() || "";
  const team = answers.team?.trim() || "";

  const title = ensureMinLength(
    `Развитие бизнеса: ${industry}`.slice(0, 80),
    5,
    "Проект развития бизнеса",
  );

  const summary = ensureMinLength(
    [
      report.summary.slice(0, 180),
      goals ? `Цели: ${goals.slice(0, 80)}` : null,
    ]
      .filter(Boolean)
      .join(" "),
    20,
    "Проект развития действующего бизнеса в ЦКР.",
  ).slice(0, 400);

  const description = ensureMinLength(
    [
      report.summary,
      "",
      goals ? `Цели: ${goals}` : "",
      problems ? `Проблемы и ограничения: ${problems}` : "",
      resources ? `Ресурсы: ${resources}` : "",
      team ? `Команда: ${team}` : "",
      "",
      "Шаблон: business_development.",
      "Путь: аудит → стратегия → проект → ресурсы → эксперты/партнёры/инвестиции.",
    ]
      .filter((line) => line !== undefined)
      .join("\n")
      .trim(),
    40,
    "Черновик проекта развития сформирован после аудита Лии.",
  );

  return {
    title,
    summary,
    description,
    category: mapCategorySlug(industry),
    region: region || "Россия",
    investment_required: 0,
    stage,
    currency: "RUB",
    existing_resources: resources,
    required_resources: problems
      ? `Решение ограничений: ${problems.slice(0, 200)}`
      : "Ресурсы для развития бизнеса",
    assets: resources,
    needs: problems || "Поддержка развития",
  };
}

function getStrategyState(history: LiaMessage[]) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const message = history[i];
    if (
      message.role === "assistant" &&
      message.metadata?.scenario === "develop_strategy" &&
      typeof message.metadata.strategyStep === "number"
    ) {
      return {
        step: message.metadata.strategyStep,
        answers: (message.metadata.strategyAnswers as Record<
          string,
          string
        >) || {},
      };
    }
  }
  return { step: 0, answers: {} as Record<string, string> };
}

function buildStrategyReport(answers: Record<string, string>): StrategyReport {
  const projectTitle = answers.project?.trim() || "Проект ЦКР";
  const audit = answers.audit?.trim() || "";
  const goalsRaw = answers.goals?.trim() || "";
  const resourcesRaw = answers.resources?.trim() || "";
  const constraints = answers.constraints?.trim() || "";

  const goals = goalsRaw
    ? goalsRaw
        .split(/[;\n]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6)
    : [
        "Усилить продажи и управляемость",
        "Закрыть дефицит ключевых ресурсов",
        "Подготовить сделки и масштабирование",
      ];

  const growthDirections = [
    "Рост в текущем регионе за счёт дисциплины CRM и воронки",
    "Партнёрская сеть: поставщики и дистрибуция",
    "Привлечение капитала / экспертизы под узкие места",
    audit
      ? `Опираться на выводы аудита: ${audit.slice(0, 140)}`
      : "Уточнить аудит бизнеса перед крупными инвестициями",
  ];

  const resources = resourcesRaw
    ? resourcesRaw
        .split(/[;\n]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6)
    : [
        "Команда и текущая операционная база",
        "Нужны партнёры, капитал и экспертиза под рост",
      ];

  const risks = [
    constraints
      ? `Ограничения: ${constraints.slice(0, 160)}`
      : "Не заданы жёсткие ограничения — риск размытия фокуса",
    "Недостаток ресурсов на пике роста",
    "Затягивание перехода от стратегии к сделке",
  ];

  const actionPlan = [
    "Этап методологии «Стратегия»: зафиксировать цели в карточке проекта",
    "Перейти к поиску ресурсов (Лия find_solutions / CRM-сегменты)",
    "Собрать RoadmapDraft по этапам workspace",
    "Подготовить сделку (applications → deal)",
    "Вести реализацию и контроль результата",
  ];

  return {
    projectTitle,
    summary: [
      `Стратегия развития для «${projectTitle}».`,
      goalsRaw ? `Фокус: ${goalsRaw.slice(0, 140)}.` : "",
      "Следующий шаг методологии ЦКР — поиск ресурсов и подготовка сделки.",
    ]
      .filter(Boolean)
      .join(" "),
    goals,
    growthDirections,
    resources,
    risks,
    actionPlan,
    methodologyStage: "strategy",
    suggestedTemplate: "business_development",
  };
}

async function handleDevelopStrategy(
  userMessage: string,
  history: LiaMessage[],
): Promise<LiaEngineResult> {
  const state = getStrategyState(history);
  const answers = { ...state.answers };
  let step = state.step;

  const isStart =
    DEVELOP_STRATEGY_START_PATTERN.test(userMessage) &&
    Object.keys(answers).length === 0 &&
    step === 0 &&
    !history.some((m) => m.metadata?.scenario === "develop_strategy");

  if (!isStart && step < DEVELOP_STRATEGY_STEPS.length) {
    const current = DEVELOP_STRATEGY_STEPS[step];
    answers[current.key] = userMessage.trim();
    step += 1;
  }

  if (step < DEVELOP_STRATEGY_STEPS.length) {
    const next = DEVELOP_STRATEGY_STEPS[step];
    const progress = `Шаг ${step + 1} из ${DEVELOP_STRATEGY_STEPS.length}`;
    return {
      content: [
        "Сценарий «Разработать стратегию развития».",
        progress,
        "",
        next.question,
        "",
        `_${LIA_DISCLAIMER}_`,
      ].join("\n"),
      metadata: {
        scenario: "develop_strategy",
        strategyStep: step,
        strategyAnswers: answers,
        disclaimer: LIA_DISCLAIMER,
      },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  const report = buildStrategyReport(answers);
  return {
    content: [
      "Стратегия развития подготовлена.",
      "",
      report.summary,
      "",
      "Ниже — StrategyReport: цели, направления роста, ресурсы, риски и план действий.",
      "Лия только рекомендует. Документы (BusinessPlanDraft / RoadmapDraft) — структуры данных без файлов.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "develop_strategy",
      strategyStep: step,
      strategyAnswers: answers,
      strategyReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleSearchScenario(
  scenario: LiaScenarioId,
  query: string,
): Promise<LiaEngineResult> {
  let results: LiaResultLink[] = [];
  let intro = "";

  if (scenario === "find_investments") {
    results = await searchInvestments(query, 5);
    intro = "Подходящие инвестиционные предложения в каталоге ЦКР:";
  } else if (scenario === "find_property") {
    results = await searchOpportunities(
      `${query} земля помещение недвижимость`,
      5,
    );
    intro = "Земля и помещения в каталоге возможностей:";
  } else if (scenario === "find_expert") {
    results = await searchExperts(query, 5);
    intro = "Эксперты ЦКР по запросу:";
  }

  if (results.length === 0) {
    return {
      content: [
        intro || "Поиск по каталогам ЦКР",
        "",
        "Точных совпадений пока нет. Уточните отрасль, регион или сумму.",
        "",
        `_${LIA_DISCLAIMER}_`,
      ].join("\n"),
      metadata: {
        scenario,
        results: [],
        disclaimer: LIA_DISCLAIMER,
      },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  const list = results
    .map(
      (item, index) =>
        `${index + 1}. [${item.title}](${item.href}) — ${item.summary}`,
    )
    .join("\n");

  return {
    content: `${intro}\n\n${list}\n\n_${LIA_DISCLAIMER}_`,
    metadata: {
      scenario,
      results,
      disclaimer: LIA_DISCLAIMER,
    },
    results,
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleSolution(query: string): Promise<LiaEngineResult> {
  const task = query.trim() || "Собрать комплексное решение для проекта";
  const [projects, opportunities, investments, experts] = await Promise.all([
    searchProjects(task, 3),
    searchOpportunities(task, 3),
    searchInvestments(task, 3),
    searchExperts(task, 3),
  ]);

  const missingData: string[] = [];
  if (!/регион|област|край|город/i.test(task)) {
    missingData.push("Регион реализации");
  }
  if (!/\d/.test(task)) {
    missingData.push("Ориентир по сумме инвестиций");
  }
  if (!/отрасл|производ|недвиж|it|агро|туризм/i.test(task)) {
    missingData.push("Отрасль / направление");
  }

  const catalogDraft: LiaCatalogDraft = {
    task,
    projects,
    opportunities,
    investments,
    experts,
    nextSteps: [
      "Уточнить регион, стадию и бюджет проекта",
      "Выбрать 1–2 возможности и проверить совместимость с проектом",
      "Отправить заявки инвестору и эксперту через модуль applications",
      "Собрать документы для проверки ЦКР",
    ],
    risks: [
      "Подбор выполнен по открытым каталогам и может быть неполным",
      "Без проверки документов нельзя считать партнёров подтверждёнными",
      "Финансовые и юридические условия нужно согласовывать отдельно",
    ],
    missingData,
  };

  const section = (title: string, items: LiaResultLink[]) =>
    items.length
      ? `${title}:\n${items.map((item) => `- [${item.title}](${item.href})`).join("\n")}`
      : `${title}: пока нет точных совпадений`;

  const content = [
    "Собрала аналитическое комплексное решение (черновик, не запись в БД).",
    "",
    `**Задача:** ${task}`,
    "",
    section("Проекты", projects),
    "",
    section("Возможности", opportunities),
    "",
    section("Инвестиции", investments),
    "",
    section("Эксперты", experts),
    "",
    "**Следующие шаги:**",
    ...catalogDraft.nextSteps.map((step, i) => `${i + 1}. ${step}`),
    "",
    "**Риски:**",
    ...catalogDraft.risks.map((risk) => `- ${risk}`),
    "",
    missingData.length
      ? `**Недостающие данные:** ${missingData.join("; ")}`
      : "**Недостающие данные:** критичных пробелов не видно",
    "",
    "Для анализа конкретного проекта откройте карточку проекта и нажмите «Анализ Лией».",
    "",
    `_${LIA_DISCLAIMER}_`,
  ].join("\n");

  const results = [
    ...projects,
    ...opportunities,
    ...investments,
    ...experts,
  ];

  return {
    content,
    metadata: {
      scenario: "solution",
      results,
      catalogDraft,
      disclaimer: LIA_DISCLAIMER,
    },
    results,
    projectDraft: null,
    solutionDraft: null,
    catalogDraft,
  };
}

async function handleEvaluateOutcome(input: {
  userMessage: string;
  projectId?: string | null;
  userId: string;
}): Promise<LiaEngineResult> {
  const projectId =
    input.projectId || extractProjectIdFromMessage(input.userMessage);

  if (!projectId) {
    return {
      content: [
        "Сценарий «Оцени результат проекта».",
        "",
        "Укажите проект: откройте workspace и нажмите «Оцени результат проекта»,",
        "или пришлите UUID в формате `projectId: <uuid>`.",
        "",
        "Лия только анализирует — показатели не изменяет.",
        "",
        `_${LIA_DISCLAIMER}_`,
      ].join("\n"),
      metadata: {
        scenario: "evaluate_outcome",
        disclaimer: LIA_DISCLAIMER,
      },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  const [project, outcome, progress] = await Promise.all([
    getProjectById(projectId),
    getProjectOutcomeSummary(projectId),
    getProjectProgressSummary(projectId),
  ]);

  if (!project || !outcome) {
    return {
      content: `Проект не найден или нет доступа.\n\n_${LIA_DISCLAIMER}_`,
      metadata: { scenario: "evaluate_outcome", disclaimer: LIA_DISCLAIMER },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  const achievements = [
    ...outcome.results.map((item) => {
      const value =
        item.value !== null ? ` (${item.value} ${item.unit})`.trimEnd() : "";
      return `${item.title}${value} · ${projectResultTypeLabels[item.resultType]}`;
    }),
    ...outcome.kpiRows
      .filter(
        (row) =>
          row.attainmentPercent !== null && row.attainmentPercent >= 80,
      )
      .map(
        (row) =>
          `KPI «${row.metric.name}»: ${row.currentValue}/${row.targetValue} ${row.metric.unit}`,
      ),
    ...(outcome.roadmapPercent >= 50
      ? [`Roadmap выполнен на ${outcome.roadmapPercent}%`]
      : []),
  ];

  const missed_targets = outcome.kpiRows
    .filter(
      (row) =>
        row.attainmentPercent !== null && row.attainmentPercent < 60,
    )
    .map(
      (row) =>
        `«${row.metric.name}»: цель ${row.targetValue}, сейчас ${row.currentValue}${
          row.actualValue !== null ? `, факт ${row.actualValue}` : ""
        } ${row.metric.unit}`,
    );

  if (progress.overdueTasks.length > 0) {
    missed_targets.push(
      `Просроченных задач: ${progress.overdueTasks.length}`,
    );
  }
  if (outcome.results.length === 0) {
    missed_targets.push("Фактические результаты ещё не зафиксированы");
  }

  const risks = [
    ...(missed_targets.length > 2
      ? ["Несколько KPI существенно отстают от цели"]
      : []),
    ...(outcome.financialMetrics.length === 0
      ? ["Нет финансовых показателей — сложно оценить экономический эффект"]
      : []),
    ...(outcome.roadmapPercent < 40
      ? ["Низкий процент выполнения roadmap"]
      : []),
    ...(progress.items.some((item) => item.status === "blocked")
      ? ["Есть заблокированные этапы реализации"]
      : []),
  ];

  const recommendations = [
    achievements.length > 0
      ? "Зафиксируйте ключевые достижения как project_results для отчётности ЦКР"
      : "Добавьте первые фактические результаты в workspace",
    missed_targets.length > 0
      ? "Скорректируйте план по отстающим KPI или обновите текущие значения"
      : "Поддерживайте ритм обновления KPI",
    outcome.financialMetrics.length === 0
      ? "Внесите revenue / investment / expenses в financial metrics"
      : "Сверьте финансовые показатели с KPI роста",
    "После корректировок повторите оценку результата",
  ];

  const next_steps = [
    "Обновите KPI и зафиксируйте фактические результаты",
    "Проверьте прогресс roadmap (сценарий «Проверь прогресс проекта»)",
    "Откройте /admin/results для сравнения с портфелем ЦКР",
  ];

  const financeNote =
    outcome.financialMetrics.length > 0
      ? outcome.financialMetrics
          .map(
            (m) =>
              `${financialMetricTypeLabels[m.metricType]}: ${m.value} ${m.currency}`,
          )
          .join("; ")
      : "финпоказатели не заданы";

  const report: OutcomeReport = {
    projectTitle: project.title,
    summary: [
      `Оценка результата «${project.title}».`,
      `Roadmap ${outcome.roadmapPercent}%, сделок ${outcome.dealsCount}, результатов ${outcome.results.length}.`,
      financeNote,
    ].join(" "),
    achievements:
      achievements.length > 0
        ? achievements
        : ["Пока нет подтверждённых достижений — зафиксируйте первые итоги"],
    missed_targets:
      missed_targets.length > 0
        ? missed_targets
        : ["Критических просадок по целям не видно"],
    risks:
      risks.length > 0
        ? risks
        : ["Существенных рисков по итогам не выявлено"],
    recommendations,
    next_steps,
  };

  try {
    const supabase = createClient();
    await supabase.from("project_activity").insert({
      project_id: projectId,
      actor_id: input.userId,
      activity_type: "outcome_generated",
      title: "Лия: оценка результата проекта",
      body: report.summary,
      metadata: { source: "lia", scenario: "evaluate_outcome" },
    });
  } catch {
    // мягкий сбой
  }

  await trackAnalyticsEvent({
    eventType: "outcome_generated",
    userId: input.userId,
    entityType: "project",
    entityId: projectId,
    metadata: { source: "lia", resultsCount: outcome.results.length },
  });

  return {
    content: [
      "Оценка результата проекта подготовлена.",
      "",
      report.summary,
      "",
      "Ниже — OutcomeReport. Лия не изменяет показатели — только анализирует и предлагает.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "evaluate_outcome",
      outcomeReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [
      {
        type: "project",
        id: project.id,
        title: project.title,
        summary: project.summary,
        href: `/dashboard/projects/${project.id}/workspace`,
      },
    ],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleBetaReview(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { getBetaReviewDashboard } = await import("@/lib/beta/review");
  const dashboard = await getBetaReviewDashboard();
  const report: BetaReviewReport = dashboard.reviewReport;

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "beta",
      metadata: { source: "lia", scenario: "beta_review" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Обзор закрытой beta сформирован по данным платформы.",
      "",
      report.summary,
      "",
      "Ниже — BetaReviewReport. Лия не изменяет продукт — только анализирует.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "beta_review",
      betaReviewReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleLaunchReadiness(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { getBetaReviewDashboard } = await import("@/lib/beta/review");
  const dashboard = await getBetaReviewDashboard();
  const report: LaunchReadinessReport = dashboard.launchReport;

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "beta",
      metadata: { source: "lia", scenario: "launch_readiness" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Что нужно исправить перед запуском?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — LaunchReadinessReport. Лия не открывает доступ и не меняет настройки — только анализирует.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "launch_readiness",
      launchReadinessReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleWaveReviewAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildWaveReviewReport } = await import("@/lib/launch/wave-review");
  const report: WaveReviewReport = await buildWaveReviewReport(input.userId);

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "wave_review" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Проанализируй результаты первой волны» завершён.",
      "",
      report.summary,
      "",
      "Ниже — WaveReviewReport. Лия не меняет волну, цели и issues — только анализирует.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "wave_review",
      waveReviewReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleLaunchDecisionAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildLaunchDecisionAIReport } = await import(
    "@/lib/launch/decision"
  );
  const report: LaunchDecisionAIReport = await buildLaunchDecisionAIReport(
    input.userId,
  );

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "launch_decision" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Готов ли ЦКР к следующей волне?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — LaunchDecisionAIReport. Лия не фиксирует решение и не меняет волны — только анализирует.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "launch_decision",
      launchDecisionAIReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleEcosystemAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildEcosystemReport } = await import("@/lib/launch/ecosystem");
  const report: EcosystemReport = await buildEcosystemReport();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "ecosystem" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Как развивается экосистема ЦКР?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — EcosystemReport. Лия не меняет волны, заявки и сделки — только анализирует сетевой эффект.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "ecosystem",
      ecosystemReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleFirstUsersAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildFirstUsersReport } = await import("@/lib/launch/first-users");
  const report: FirstUsersReport = await buildFirstUsersReport();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "first_users" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Как прошёл первый запуск ЦКР?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — FirstUsersReport. Лия не меняет приглашения и статусы — только анализирует первую когорту.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "first_users",
      firstUsersReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleFirstUsersReviewAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const {
    buildFirstUsersReviewReport,
    buildFirstUsersLiaReport,
  } = await import("@/lib/launch/first-users-review");
  const report: FirstUsersReviewReport = await buildFirstUsersReviewReport();
  const liaReport = await buildFirstUsersLiaReport();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "first_users_review" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Что показал первый запуск ЦКР?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — FirstUsersReviewReport и FirstUsersLiaReport. Лия только анализирует — решения по волне принимает оператор.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "first_users_review",
      firstUsersReviewReport: report,
      firstUsersLiaReport: liaReport,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleBetaExpansionAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildBetaExpansionReportAsync } = await import(
    "@/lib/launch/beta-expansion"
  );
  const report: BetaExpansionReport = await buildBetaExpansionReportAsync();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "beta_expansion" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Как проходит расширенная beta?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — BetaExpansionReport. Лия только анализирует Beta Expansion Wave.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "beta_expansion",
      betaExpansionReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleOpenBetaReadinessAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildOpenBetaReadinessReportAsync } = await import(
    "@/lib/launch/open-beta-readiness"
  );
  const report: OpenBetaReadinessReport =
    await buildOpenBetaReadinessReportAsync();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "open_beta_readiness" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Готов ли ЦКР к открытому запуску?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — OpenBetaReadinessReport. Лия только анализирует готовность; решение принимает команда.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "open_beta_readiness",
      openBetaReadinessReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleOpenBetaAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildOpenBetaReportAsync } = await import("@/lib/launch/open-beta");
  const report: OpenBetaReport = await buildOpenBetaReportAsync();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "open_beta" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Как проходит открытый запуск ЦКР?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — OpenBetaReport. Лия только анализирует Open Beta Wave 1.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "open_beta",
      openBetaReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleOpenBetaGrowthAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { getOpenBetaGrowthDashboard } = await import(
    "@/lib/launch/open-beta-growth"
  );
  const dashboard = await getOpenBetaGrowthDashboard();
  const report: RetentionReport = dashboard.retentionReport;
  const roleGrowthReport: RoleGrowthReport = dashboard.roleGrowth;
  const userValueFeedbackReport: UserValueFeedbackReport =
    dashboard.feedbackValue;

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "open_beta_growth" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Почему пользователи возвращаются в ЦКР?» завершён.",
      "",
      report.summary,
      "",
      `Решение роста: ${dashboard.decision.label} (${dashboard.decision.decision}).`,
      "",
      "Ниже — RetentionReport, RoleGrowthReport и UserValueFeedbackReport. Только анализ.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "open_beta_growth",
      retentionReport: report,
      roleGrowthReport,
      userValueFeedbackReport,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handlePublicLaunchDecisionAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildPublicLaunchDecisionReportAsync } = await import(
    "@/lib/launch/public-launch-decision"
  );
  const report: PublicLaunchDecisionReport =
    await buildPublicLaunchDecisionReportAsync();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "public_launch_decision" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Готов ли ЦКР к публичному запуску?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — PublicLaunchDecisionReport. Лия только анализирует и не принимает решение автоматически.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "public_launch_decision",
      publicLaunchDecisionReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handlePublicLaunchAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildPublicLaunchReportAsync } = await import(
    "@/lib/launch/public-launch"
  );
  const report: PublicLaunchReport = await buildPublicLaunchReportAsync();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "public_launch" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Как проходит публичный запуск ЦКР?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — PublicLaunchReport. Лия только анализирует ход публичного запуска.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "public_launch",
      publicLaunchReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleLiveLaunchAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildLiveLaunchReportAsync } = await import(
    "@/lib/launch/public-launch-operations"
  );
  const report: LiveLaunchReport = await buildLiveLaunchReportAsync();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "live_launch" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Как проходит запуск ЦКР сейчас?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — LiveLaunchReport. Лия только анализирует текущий операционный запуск.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "live_launch",
      liveLaunchReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleGrowthAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildGrowthReportAsync } = await import("@/lib/growth/dashboard");
  const report: GrowthReport = await buildGrowthReportAsync();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "growth",
      metadata: { source: "lia", scenario: "growth" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Как растёт ЦКР?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — GrowthReport. Лия только анализирует рост после Public Launch.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "growth",
      growthReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleProjectAcquisitionAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildProjectAcquisitionReportAsync } = await import(
    "@/lib/project-acquisition/dashboard"
  );
  const report: ProjectAcquisitionReport =
    await buildProjectAcquisitionReportAsync();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "project_acquisition",
      metadata: { source: "lia", scenario: "project_acquisition" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Как развивается поток проектов ЦКР?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — ProjectAcquisitionReport. Лия только анализирует поток проектов.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "project_acquisition",
      projectAcquisitionReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handlePartnershipNetworkAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildPartnershipReportAsync } = await import(
    "@/lib/partnership-network/dashboard"
  );
  const report: PartnershipReport = await buildPartnershipReportAsync();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "partnership_network",
      metadata: { source: "lia", scenario: "partnership_network" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Как развивается партнёрская сеть ЦКР?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — PartnershipReport. Лия только анализирует партнёрскую сеть.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "partnership_network",
      partnershipReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleRevenueOpportunityAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildRevenueOpportunityReportAsync } = await import(
    "@/lib/revenue/dashboard"
  );
  const report: RevenueOpportunityReport =
    await buildRevenueOpportunityReportAsync();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "revenue",
      metadata: { source: "lia", scenario: "revenue_opportunity" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «На чём ЦКР сейчас может заработать?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — RevenueOpportunityReport. Лия только анализирует и не меняет финансовые данные.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "revenue_opportunity",
      revenueOpportunityReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleEcosystemValueAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildEcosystemValueReport } = await import(
    "@/lib/launch/ecosystem-value"
  );
  const report: EcosystemValueReport = await buildEcosystemValueReport();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "ecosystem_value" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Какая польза от экосистемы ЦКР?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — EcosystemValueReport. Лия не изменяет связи и не принимает решения — только анализирует ценность совпадений.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "ecosystem_value",
      ecosystemValueReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleClosedWaveAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildClosedWaveReport } = await import("@/lib/launch/closed-wave");
  const report: ClosedWaveReport = await buildClosedWaveReport(input.userId);

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "closed_wave" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Проанализируй первую волну ЦКР» завершён.",
      "",
      report.summary,
      "",
      "Ниже — ClosedWaveReport. Лия не меняет волну, цели и данные ТИНДА — только анализирует.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "closed_wave",
      closedWaveReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleLaunchGoalsAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { getActiveLaunchWave } = await import("@/lib/launch/waves");
  const { getLaunchGoalsBundle } = await import("@/lib/launch/goals");
  const wave = await getActiveLaunchWave();
  const bundle = await getLaunchGoalsBundle(wave, input.userId);
  const report: LaunchGoalReport = bundle.goalReport;

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "launch_goals" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Достигнуты ли цели запуска?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — LaunchGoalReport. Лия не изменяет показатели и статусы целей — только анализирует.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "launch_goals",
      launchGoalReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleLaunchStatus(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { getLaunchWaveDashboard } = await import("@/lib/launch/waves");
  const dashboard = await getLaunchWaveDashboard();
  const report: LaunchStatusReport = dashboard.statusReport;

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "launch_status" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Как проходит запуск?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — LaunchStatusReport. Лия не меняет волны и доступы — только анализирует.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "launch_status",
      launchStatusReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleLaunchGuide(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { pathForRoles, rolePaths } = await import("@/config/onboarding");
  const { roleLabels, roleDescriptions, ASSIGNABLE_ROLES } = await import(
    "@/config/roles"
  );
  type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

  let roles: AssignableRole[] = [];
  try {
    const supabase = createClient();
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", input.userId);
    roles = ((roleRows ?? []) as Array<{ role: string }>)
      .map((row) => row.role)
      .filter((role): role is AssignableRole =>
        (ASSIGNABLE_ROLES as readonly string[]).includes(role),
      );
  } catch {
    roles = [];
  }

  const hasRoles = roles.length > 0;
  const primary = hasRoles ? pathForRoles(roles).role : "entrepreneur";
  const path = rolePaths[primary];

  const report: LaunchGuide = hasRoles
    ? {
        summary: `У вас уже выбрана роль «${roleLabels[primary]}». Ниже — как получить первую ценность в ЦКР без лишних шагов.`,
        recommended_role: roleLabels[primary],
        role_rationale: roleDescriptions[primary],
        first_step: `${path.title}: ${path.description}`,
        next_steps: [
          `Откройте: ${path.href}`,
          "Заполните профиль до понятного «о себе» — так вас найдут партнёры.",
          "Задайте Лии сценарий под вашу задачу (идея, поиск, эксперт).",
        ],
        tips: [
          "Не останавливайтесь после онбординга — первый объект или интерес важнее идеального профиля.",
          "Лия только рекомендует: заявки и сделки подтверждаете вы.",
          "Справка: docs/help-center.md и /features.",
        ],
      }
    : {
        summary:
          "ЦКР — платформа комплексных решений. Сначала выберите роль, затем сделайте одно конкретное действие — так вы быстрее увидите ценность.",
        recommended_role: "Предприниматель (если есть идея или действующий бизнес)",
        role_rationale:
          "Большинству новых пользователей подходит роль предпринимателя: создание проекта и поиск ресурсов. Инвестор — если ищете проекты; эксперт — если предлагаете компетенции; компания — для орг-кабинета.",
        first_step:
          "Пройдите онбординг: выберите роль → заполните профиль → выполните первое действие из персонального пути.",
        next_steps: [
          "Предприниматель → создать проект с Лией (/lia)",
          "Инвестор → открыть каталог проектов (/projects) и отметить интерес",
          "Эксперт → оформить профиль эксперта (/dashboard/expert)",
          "Компания → кабинет организации (/partner)",
        ],
        tips: [
          "Точка высокого выхода — сразу после профиля: не уходите, сделайте первый шаг.",
          "Одна роль на старте лучше, чем все сразу — роли можно дополнить позже.",
          "Спросите Лию «Как начать работу с ЦКР?» ещё раз после выбора роли — подсказка станет персональной.",
        ],
      };

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "launch",
      metadata: { source: "lia", scenario: "launch_guide", role: primary },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Подготовлен гид запуска в ЦКР.",
      "",
      report.summary,
      "",
      `Роль: ${report.recommended_role}`,
      `Первый шаг: ${report.first_step}`,
      "",
      "Ниже — LaunchGuide. Лия не выбирает роль за вас и не создаёт объекты — только объясняет путь.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "launch_guide",
      launchGuide: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleBetaAnalysis(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { getBetaReport } = await import("@/lib/beta/report");
  const reportData = await getBetaReport();

  const invitedPool =
    reportData.users.invited + reportData.users.activated;
  const activation_rate =
    invitedPool > 0
      ? Math.round((reportData.users.activated / invitedPool) * 100)
      : reportData.users.activated > 0
        ? 100
        : 0;

  const blocked_users: string[] = [];
  for (const p of reportData.participants) {
    if (
      p.participationStatus === "invited" &&
      !p.userId
    ) {
      blocked_users.push(`${p.email} · приглашён, не активирован`);
    } else if (
      p.userId &&
      !p.scenarioComplete &&
      (!p.lastActionAt ||
        Date.now() - new Date(p.lastActionAt).getTime() >
          7 * 24 * 60 * 60 * 1000)
    ) {
      blocked_users.push(
        `${p.fullName || p.email} · нет действий 7+ дн. / сценарий не завершён`,
      );
    }
  }
  if (blocked_users.length === 0) {
    blocked_users.push("Явных застреваний по выборке не видно");
  }

  const unused_features: string[] = [];
  if (reportData.funnel.lia < Math.max(1, Math.floor(reportData.funnel.profile * 0.4))) {
    unused_features.push("Лия — мало первых использований относительно профилей");
  }
  if (
    reportData.activity.applications <
    Math.max(1, Math.floor(reportData.activity.projects * 0.3))
  ) {
    unused_features.push("Заявки — слабое использование относительно проектов");
  }
  if (reportData.activity.interests === 0) {
    unused_features.push("Интересы инвесторов — нет событий first_interest_created");
  }
  if (reportData.activity.deals === 0) {
    unused_features.push("Сделки — ещё не зафиксированы в beta");
  }
  if (
    (reportData.onboardingEvents.first_project_created ?? 0) === 0 &&
    reportData.funnel.profile > 0
  ) {
    unused_features.push("Создание проекта — нет first_project_created");
  }
  if (unused_features.length === 0) {
    unused_features.push("Критичных провалов по модулям не видно");
  }

  const recommendations = [
    activation_rate < 50
      ? "Усильте follow-up по invited: повторное письмо и короткий гайд онбординга"
      : "Активация на приемлемом уровне — держите ритм приглашений",
    "Проведите застрявших через чеклист роли на /admin/beta-report",
    "Сфокусируйтесь на неиспользуемых модулях без добавления новых направлений",
    "Сверьте ТИНДА как beta case: roadmap / KPI / результаты",
  ];

  const report: BetaAnalysisReport = {
    summary: `Controlled beta: приглашено ${reportData.users.invited}, активировано ${reportData.users.activated}, активно ${reportData.users.active}. Активация ${activation_rate}%. Лия только анализирует.`,
    activation_rate,
    blocked_users: blocked_users.slice(0, 12),
    unused_features,
    recommendations,
  };

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "beta",
      metadata: { source: "lia", scenario: "beta_analysis" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Как проходит запуск ЦКР?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — BetaAnalysisReport. Лия не изменяет доступы и статусы — только анализирует.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "beta_analysis",
      betaAnalysisReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleProductImprovement(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const supabase = createClient();
  const [
    feedbackRes,
    issuesRes,
    improvementsRes,
    eventsRes,
  ] = await Promise.all([
    supabase
      .from("feedback")
      .select("id, type, message, priority, page, rating")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("pilot_issues")
      .select("id, title, description, severity, status")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("product_improvements")
      .select("id, title, priority, status, source_type")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("analytics_events")
      .select("event_type")
      .in("event_type", [
        "registration_completed",
        "profile_completed",
        "project_created",
        "project_published",
        "application_sent",
        "deal_created",
        "lia_used",
      ])
      .limit(400),
  ]);

  const feedback = feedbackRes.data ?? [];
  const issues = issuesRes.data ?? [];
  const improvements = improvementsRes.data ?? [];
  const events = eventsRes.data ?? [];

  const openIssues = issues.filter(
    (i) => i.status === "open" || i.status === "in_progress",
  );
  const criticalIssues = openIssues.filter(
    (i) => i.severity === "critical" || i.severity === "high",
  );

  const typeCounts = new Map<string, number>();
  const priorityCounts = new Map<string, number>();
  for (const item of feedback) {
    typeCounts.set(
      item.type as string,
      (typeCounts.get(item.type as string) ?? 0) + 1,
    );
    const pr = (item.priority as string) || "medium";
    priorityCounts.set(pr, (priorityCounts.get(pr) ?? 0) + 1);
  }

  const metricCounts = new Map<string, number>();
  for (const row of events) {
    const key = row.event_type as string;
    metricCounts.set(key, (metricCounts.get(key) ?? 0) + 1);
  }

  const main_problems: string[] = [];
  for (const issue of criticalIssues.slice(0, 6)) {
    main_problems.push(`[${issue.severity}] ${issue.title}`);
  }
  for (const item of feedback
    .filter(
      (f) =>
        f.priority === "critical" ||
        f.priority === "high" ||
        f.type === "bug" ||
        f.type === "ux",
    )
    .slice(0, 6)) {
    main_problems.push(
      `Feedback ${item.type}/${item.priority}: ${String(item.message).slice(0, 100)}`,
    );
  }
  if (main_problems.length === 0) {
    main_problems.push(
      "Критических проблем в выборке нет — смотрите паттерны и воронку",
    );
  }

  const patterns: string[] = [];
  const topTypes = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  if (topTypes.length > 0) {
    patterns.push(
      `Частые категории feedback: ${topTypes
        .map(([k, v]) => `${k} (${v})`)
        .join(", ")}`,
    );
  }
  const regs = metricCounts.get("registration_completed") ?? 0;
  const profiles = metricCounts.get("profile_completed") ?? 0;
  const projects = metricCounts.get("project_created") ?? 0;
  const apps = metricCounts.get("application_sent") ?? 0;
  const deals = metricCounts.get("deal_created") ?? 0;
  const lia = metricCounts.get("lia_used") ?? 0;
  if (regs > 0 && profiles / regs < 0.7) {
    patterns.push(
      `Воронка: профиль завершают реже регистрации (${profiles}/${regs})`,
    );
  }
  if (projects > 0 && apps / projects < 0.4) {
    patterns.push(
      `Воронка: мало заявок относительно проектов (${apps}/${projects})`,
    );
  }
  if (lia === 0) {
    patterns.push("Лия почти не используется в метриках пилота");
  } else {
    patterns.push(`Лия использована ${lia} раз(а) по метрикам пилота`);
  }
  const planned = improvements.filter((i) => i.status === "planned").length;
  const inProgress = improvements.filter(
    (i) => i.status === "in_progress",
  ).length;
  patterns.push(
    `Бэклог улучшений: ${improvements.length} (planned ${planned}, in_progress ${inProgress})`,
  );
  if (deals === 0 && apps > 0) {
    patterns.push("Есть заявки, но сделки ещё не зафиксированы");
  }

  const recommendations = [
    openIssues.length > 0
      ? `Разберите ${openIssues.length} открытых pilot_issues, критичные — в первую очередь`
      : "Открытых pilot_issues мало — поддерживайте ритм сбора feedback",
    feedback.length > 0
      ? "Продвигайте ценный feedback в проблемы и product_improvements на /admin/improvements"
      : "Усильте сбор обратной связи (категория + приоритет)",
    "Сверьте просадки воронки на /admin/pilot/report и заведите улучшения по слабым шагам",
    "Не добавляйте новые бизнес-модули — закрывайте UX/баги и ценность текущего контура",
  ];

  const priority_actions = [
    criticalIssues[0]
      ? `Эскалировать: «${criticalIssues[0].title}»`
      : "Проверить critical/high feedback за последнюю неделю",
    "Создать 1–3 product_improvements из топ-паттернов feedback",
    "Обновить статус улучшений in_progress → released после фикса",
    "Зафиксировать выводы пилота ТИНДА в docs/tinda-pilot-review.md",
  ];

  const report: ProductImprovementReport = {
    summary: `Анализ цикла улучшений: feedback ${feedback.length}, открытых проблем ${openIssues.length}, улучшений ${improvements.length}. Лия только анализирует — записи не создаёт.`,
    main_problems,
    patterns,
    recommendations,
    priority_actions,
  };

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "product",
      metadata: { source: "lia", scenario: "product_improvement" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Что улучшить в ЦКР?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — ProductImprovementReport. Лия не создаёт улучшения автоматически — только анализирует и предлагает.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "product_improvement",
      productImprovementReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleProductFixReview(input: {
  userId: string;
}): Promise<LiaEngineResult> {
  const { buildProductFixImprovementReportAsync } = await import(
    "@/lib/product/fix-sprint"
  );
  const report: ProductFixImprovementReport =
    await buildProductFixImprovementReportAsync();

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: "product",
      metadata: { source: "lia", scenario: "product_fix_review" },
    });
  } catch {
    // мягкий сбой
  }

  return {
    content: [
      "Сценарий «Что улучшилось после исправлений?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — ProductFixImprovementReport. Лия только анализирует Product Fix Sprint.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "product_fix_review",
      productFixImprovementReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handlePilotInsight(input: {
  userMessage: string;
  projectId?: string | null;
  userId: string;
}): Promise<LiaEngineResult> {
  const focusProjectId =
    input.projectId || extractProjectIdFromMessage(input.userMessage);
  const supabase = createClient();
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;

  const [projectsRes, participantsRes, dealsRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, status, stage, owner_id, updated_at")
      .in("status", ["published", "active", "moderation"])
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("pilot_participants")
      .select("id, user_id, role, status, notes")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("deals")
      .select("id, project_id, status, updated_at")
      .limit(100),
  ]);

  const projects = projectsRes.data ?? [];
  const participants = participantsRes.data ?? [];
  const deals = dealsRes.data ?? [];

  const focusIds = focusProjectId
    ? projects.filter((p) => p.id === focusProjectId)
    : projects;
  const analyzeList = focusIds.length > 0 ? focusIds : projects.slice(0, 12);

  const blocked_projects: string[] = [];
  const recommendations: string[] = [];
  const next_actions: string[] = [];

  for (const project of analyzeList) {
    const progress = await getProjectProgressSummary(project.id as string);
    const projectDeals = deals.filter((d) => d.project_id === project.id);
    const stale =
      new Date(project.updated_at as string).getTime() < cutoff;
    const blockedItems = progress.items.filter(
      (item) => item.status === "blocked",
    );
    const laggingKpi = progress.metrics.filter((metric) => {
      if (metric.targetValue <= 0) return false;
      return metric.currentValue / metric.targetValue < 0.4;
    });

    const blockers: string[] = [];
    if (blockedItems.length > 0) {
      blockers.push(
        `roadmap blocked: ${blockedItems.map((i) => i.title).join(", ")}`,
      );
    }
    if (progress.overdueTasks.length > 0) {
      blockers.push(`просрочено задач: ${progress.overdueTasks.length}`);
    }
    if (progress.overdueItems.length > 0) {
      blockers.push(`просрочено этапов: ${progress.overdueItems.length}`);
    }
    if (!progress.roadmap) {
      blockers.push("нет активной roadmap");
    }
    if (laggingKpi.length > 0) {
      blockers.push(
        `KPI отстают: ${laggingKpi.map((m) => m.name).join(", ")}`,
      );
    }
    if (stale) {
      blockers.push("нет обновлений 14+ дней");
    }
    if (projectDeals.length === 0) {
      blockers.push("нет сделок");
    }

    if (blockers.length > 0) {
      blocked_projects.push(
        `«${project.title}»: ${blockers.join("; ")}`,
      );
    }
  }

  const inactive_users: string[] = [];
  for (const participant of participants) {
    if (
      participant.status === "inactive" ||
      participant.status === "invited"
    ) {
      const label =
        (participant.notes as string)?.trim() ||
        (participant.user_id as string | null)?.slice(0, 8) ||
        participant.id;
      inactive_users.push(
        `${label} · ${participant.role} · ${participant.status}`,
      );
    }
  }

  if (blocked_projects.length === 0) {
    recommendations.push(
      "Критических блокировок по выборке проектов не видно — держите ритм обновления roadmap и KPI",
    );
  } else {
    recommendations.push(
      "Разберите blocked/просроченные этапы roadmap и переназначьте сроки задач",
    );
    recommendations.push(
      "Обновите отстающие KPI и зафиксируйте ближайшие сделки в workspace",
    );
  }

  if (inactive_users.length > 0) {
    recommendations.push(
      "Верните invited/inactive участников: короткий чеклист и сценарий в Лии",
    );
  } else {
    recommendations.push(
      "Участники пилота в активном контуре — продолжайте сбор feedback",
    );
  }

  recommendations.push(
    "Сверьте воронку на /admin/pilot/report и зафиксируйте issues",
  );

  next_actions.push(
    focusProjectId
      ? "Откройте workspace выбранного проекта и обновите текущий этап"
      : "Откройте /admin/pilot и выберите проект с наибольшим числом блокировок",
  );
  next_actions.push("Запустите «Проверь прогресс проекта» по приоритетному проекту");
  next_actions.push("Соберите обратную связь (категория + приоритет) от оператора");

  const report: PilotInsightReport = {
    summary: focusProjectId
      ? `Анализ препятствий для проекта ${focusProjectId}: заблокировано/застопорено ${blocked_projects.length}, неактивных участников ${inactive_users.length}.`
      : `Обзор пилота: проектов в выборке ${analyzeList.length}, с блокерами ${blocked_projects.length}, неактивных участников ${inactive_users.length}. Лия только анализирует.`,
    blocked_projects:
      blocked_projects.length > 0
        ? blocked_projects
        : ["Явных блокировок в выборке не обнаружено"],
    inactive_users:
      inactive_users.length > 0
        ? inactive_users
        : ["Неактивных участников pilot_participants не видно"],
    recommendations,
    next_actions,
  };

  const activityProjectId =
    (focusProjectId as string | null) ||
    (analyzeList[0]?.id as string | undefined);
  if (activityProjectId) {
    try {
      await supabase.from("project_activity").insert({
        project_id: activityProjectId,
        actor_id: input.userId,
        activity_type: "note",
        title: "Лия: что мешает проекту двигаться",
        body: report.summary,
        metadata: { source: "lia", scenario: "pilot_insight" },
      });
    } catch {
      // мягкий сбой
    }
  }

  try {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: input.userId,
      entityType: activityProjectId ? "project" : "pilot",
      entityId: activityProjectId,
      metadata: { source: "lia", scenario: "pilot_insight" },
    });
  } catch {
    // мягкий сбой метрики
  }

  return {
    content: [
      "Сценарий «Что мешает проекту двигаться?» завершён.",
      "",
      report.summary,
      "",
      "Ниже — PilotInsightReport. Лия не изменяет данные — только анализирует и предлагает.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "pilot_insight",
      pilotInsightReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: analyzeList.slice(0, 3).map((project) => ({
      type: "project" as const,
      id: project.id as string,
      title: project.title as string,
      summary: `${project.status} · ${project.stage}`,
      href: `/dashboard/projects/${project.id}/workspace`,
    })),
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleCheckProgress(input: {
  userMessage: string;
  projectId?: string | null;
  userId: string;
}): Promise<LiaEngineResult> {
  const projectId =
    input.projectId || extractProjectIdFromMessage(input.userMessage);

  if (!projectId) {
    return {
      content: [
        "Сценарий «Проверь прогресс проекта».",
        "",
        "Укажите проект: откройте workspace и нажмите «Проверь прогресс проекта»,",
        "или пришлите UUID в формате `projectId: <uuid>`.",
        "",
        "Лия только анализирует — данные не изменяет.",
        "",
        `_${LIA_DISCLAIMER}_`,
      ].join("\n"),
      metadata: {
        scenario: "check_progress",
        disclaimer: LIA_DISCLAIMER,
      },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return {
      content: `Проект не найден.\n\n_${LIA_DISCLAIMER}_`,
      metadata: { scenario: "check_progress", disclaimer: LIA_DISCLAIMER },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  const summary = await getProjectProgressSummary(projectId);
  const completed_items = summary.items
    .filter((item) => item.status === "completed")
    .map((item) => `${item.orderNumber}. ${item.title}`);
  const delayed_items = [
    ...summary.overdueItems.map(
      (item) => `Этап: ${item.orderNumber}. ${item.title}`,
    ),
    ...summary.overdueTasks.map((task) => `Задача: ${task.title}`),
  ];

  const laggingMetrics = summary.metrics.filter((metric) => {
    if (metric.targetValue <= 0) return false;
    return metric.currentValue / metric.targetValue < 0.4;
  });

  const risks = [
    ...(summary.overdueTasks.length > 0
      ? [`Просрочено задач: ${summary.overdueTasks.length}`]
      : []),
    ...(summary.overdueItems.length > 0
      ? [`Просрочено этапов roadmap: ${summary.overdueItems.length}`]
      : []),
    ...(summary.items.some((item) => item.status === "blocked")
      ? ["Есть заблокированные этапы roadmap"]
      : []),
    ...laggingMetrics.map(
      (metric) =>
        `KPI «${metric.name}» отстаёт: ${metric.currentValue}/${metric.targetValue} ${metric.unit}`,
    ),
    ...(!summary.roadmap
      ? ["Дорожная карта не создана — прогресс сложно контролировать"]
      : []),
  ];

  const recommendations = [
    summary.currentItem
      ? `Сфокусируйтесь на этапе «${summary.currentItem.title}» и закройте его задачи`
      : "Задайте или активируйте текущий этап roadmap",
    summary.overdueTasks.length > 0
      ? "Разберите просроченные задачи: переназначьте срок или статус"
      : "Держите ритм обновления статусов задач еженедельно",
    summary.metrics.length > 0
      ? "Обновите текущие значения KPI в workspace"
      : "Добавьте KPI проекта (клиенты, партнёры, сделки)",
    "После корректировок снова запустите проверку прогресса",
  ];

  const next_steps = [
    summary.upcomingTasks[0]
      ? `Ближайшая задача: ${summary.upcomingTasks[0].title}`
      : "Добавьте задачи к текущему этапу roadmap",
    "Зафиксируйте проверку прогресса в workspace (кнопка)",
    "При необходимости обновите статусы этапов и milestones",
  ];

  const report: ProgressReport = {
    projectTitle: project.title,
    summary: summary.roadmap
      ? `Прогресс «${project.title}»: ${summary.percentComplete}% этапов roadmap. Текущий этап — ${
          summary.currentItem?.title ?? "не определён"
        }.`
      : `У проекта «${project.title}» пока нет активной дорожной карты. Создайте roadmap в workspace.`,
    completed_items,
    delayed_items,
    risks:
      risks.length > 0
        ? risks
        : ["Критических отклонений по срокам не видно"],
    recommendations,
    next_steps,
    percentComplete: summary.percentComplete,
    currentStage: summary.currentItem?.title ?? null,
  };

  try {
    const supabase = createClient();
    await supabase.from("project_activity").insert({
      project_id: projectId,
      actor_id: input.userId,
      activity_type: "project_progress_checked",
      title: "Лия: проверка прогресса проекта",
      body: report.summary,
      metadata: { source: "lia", scenario: "check_progress" },
    });
  } catch {
    // мягкий сбой истории не блокирует ответ
  }

  await trackAnalyticsEvent({
    eventType: "project_progress_checked",
    userId: input.userId,
    entityType: "project",
    entityId: projectId,
    metadata: { source: "lia", percentComplete: report.percentComplete },
  });

  return {
    content: [
      "Проверка прогресса проекта завершена.",
      "",
      report.summary,
      "",
      "Ниже — ProgressReport. Лия не изменяет данные проекта — только анализирует и предлагает.",
      "",
      `_${LIA_DISCLAIMER}_`,
    ].join("\n"),
    metadata: {
      scenario: "check_progress",
      progressReport: report,
      disclaimer: LIA_DISCLAIMER,
    },
    results: [
      {
        type: "project",
        id: project.id,
        title: project.title,
        summary: project.summary,
        href: `/dashboard/projects/${project.id}/workspace`,
      },
    ],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleRealizeProject(input: {
  userMessage: string;
  projectId?: string | null;
  userId: string;
}): Promise<LiaEngineResult> {
  const projectId =
    input.projectId || extractProjectIdFromMessage(input.userMessage);

  if (!projectId) {
    return {
      content: [
        "Сценарий «Помоги реализовать проект».",
        "",
        "Укажите проект: откройте кабинет проекта и нажмите «Помоги реализовать проект»,",
        "или пришлите UUID проекта в формате `projectId: <uuid>`.",
        "",
        `_${LIA_DISCLAIMER}_`,
      ].join("\n"),
      metadata: {
        scenario: "realize_project",
        disclaimer: LIA_DISCLAIMER,
      },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  const guidance = await buildRealizeProjectGuidance(
    projectId,
    input.userId,
  );

  if ("error" in guidance) {
    return {
      content: `${guidance.error}\n\n_${LIA_DISCLAIMER}_`,
      metadata: {
        scenario: "realize_project",
        disclaimer: LIA_DISCLAIMER,
      },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  return {
    content: guidance.content,
    metadata: {
      scenario: "realize_project",
      results: guidance.results,
      projectId: guidance.projectId,
      disclaimer: LIA_DISCLAIMER,
    },
    results: guidance.results,
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

async function handleCheckReliability(
  userMessage: string,
): Promise<LiaEngineResult> {
  const {
    buildReliabilityReport,
    LIA_RELIABILITY_DISCLAIMER,
  } = await import("@/lib/reputation/check-reliability");
  const { getUserReputationBundle } = await import(
    "@/lib/reputation/queries"
  );
  const { hasSupabaseEnv } = await import("@/lib/supabase/env");
  const { createClient } = await import("@/lib/supabase/server");

  const entityId = extractEntityIdFromMessage(userMessage);
  if (!entityId) {
    return {
      content: [
        "Чтобы проверить надёжность участника, укажите UUID профиля.",
        "",
        "Пример: «Проверь надёжность участника id: <uuid>»",
        "Или откройте публичный профиль `/profile/[id]` и скопируйте id из адреса.",
        "",
        "Лия покажет факты, документы и историю — без окончательного вердикта.",
        "",
        `_${LIA_RELIABILITY_DISCLAIMER}_`,
      ].join("\n"),
      metadata: {
        scenario: "check_reliability",
        disclaimer: LIA_RELIABILITY_DISCLAIMER,
      },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  let displayName = "Участник";
  let platformVerified = false;
  let documentsVerified = 0;
  let documentsPending = 0;

  if (hasSupabaseEnv()) {
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, verification_status")
        .eq("id", entityId)
        .maybeSingle();
      if (profile) {
        displayName = profile.full_name || displayName;
        platformVerified = profile.verification_status === "verified";
      }
      const [{ count: verifiedCount }, { count: pendingCount }] =
        await Promise.all([
          supabase
            .from("documents")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", entityId)
            .eq("status", "verified"),
          supabase
            .from("documents")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", entityId)
            .eq("status", "pending"),
        ]);
      documentsVerified = verifiedCount ?? 0;
      documentsPending = pendingCount ?? 0;
    } catch {
      // факты без документов
    }
  }

  const bundle = await getUserReputationBundle(entityId);
  const report = buildReliabilityReport({
    displayName,
    reputation: bundle?.profile ?? null,
    reviews: bundle?.reviews ?? [],
    history: bundle?.history ?? [],
    badges: bundle?.badges ?? [],
    platformVerified,
    documentsVerified,
    documentsPending,
  });

  const content = [
    report.summary,
    "",
    "**Факты**",
    ...report.facts.map((fact) => `• ${fact}`),
    "",
    "**Документы**",
    report.documentsNote,
    "",
    "**История**",
    report.historyNote,
    "",
    "**Ориентир (не вердикт)**",
    report.recommendation,
    "",
    `Публичный профиль: [/profile/${entityId}](/profile/${entityId})`,
    "",
    `_${report.disclaimer}_`,
  ].join("\n");

  return {
    content,
    metadata: {
      scenario: "check_reliability",
      disclaimer: report.disclaimer,
      entityId,
      profileHref: `/profile/${entityId}`,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}

export async function runLiaEngine(input: {
  userMessage: string;
  scenario?: LiaScenarioId | null;
  history: LiaMessage[];
  projectId?: string | null;
  userId?: string | null;
}): Promise<LiaEngineResult> {
  const scenario = detectScenario(input.userMessage, input.scenario ?? null);

  if (scenario === "business_idea") {
    return handleBusinessIdea(input.userMessage, input.history);
  }

  if (scenario === "business_audit") {
    return handleBusinessAudit(input.userMessage, input.history);
  }

  if (scenario === "develop_strategy") {
    return handleDevelopStrategy(input.userMessage, input.history);
  }

  if (
    scenario === "find_investments" ||
    scenario === "find_property" ||
    scenario === "find_expert"
  ) {
    return handleSearchScenario(scenario, input.userMessage);
  }

  if (scenario === "solution") {
    return handleSolution(input.userMessage);
  }

  if (scenario === "realize_project") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить сопровождение проекта.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "realize_project", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleRealizeProject({
      userMessage: input.userMessage,
      projectId: input.projectId,
      userId: input.userId,
    });
  }

  if (scenario === "check_progress") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы проверить прогресс проекта.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "check_progress", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleCheckProgress({
      userMessage: input.userMessage,
      projectId: input.projectId,
      userId: input.userId,
    });
  }

  if (scenario === "evaluate_outcome") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы оценить результат проекта.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "evaluate_outcome", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleEvaluateOutcome({
      userMessage: input.userMessage,
      projectId: input.projectId,
      userId: input.userId,
    });
  }

  if (scenario === "pilot_insight") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить анализ препятствий пилота.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "pilot_insight", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handlePilotInsight({
      userMessage: input.userMessage,
      projectId: input.projectId,
      userId: input.userId,
    });
  }

  if (scenario === "product_improvement") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить анализ улучшений ЦКР.\n\n_${LIA_DISCLAIMER}_`,
        metadata: {
          scenario: "product_improvement",
          disclaimer: LIA_DISCLAIMER,
        },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleProductImprovement({ userId: input.userId });
  }

  if (scenario === "product_fix_review") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить ProductFixImprovementReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: {
          scenario: "product_fix_review",
          disclaimer: LIA_DISCLAIMER,
        },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleProductFixReview({ userId: input.userId });
  }

  if (scenario === "beta_analysis") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить анализ запуска ЦКР.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "beta_analysis", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleBetaAnalysis({ userId: input.userId });
  }

  if (scenario === "beta_review") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить обзор beta.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "beta_review", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleBetaReview({ userId: input.userId });
  }

  if (scenario === "launch_readiness") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы оценить готовность к запуску.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "launch_readiness", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleLaunchReadiness({ userId: input.userId });
  }

  if (scenario === "launch_guide") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить персональный LaunchGuide.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "launch_guide", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleLaunchGuide({ userId: input.userId });
  }

  if (scenario === "launch_status") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить LaunchStatusReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "launch_status", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleLaunchStatus({ userId: input.userId });
  }

  if (scenario === "launch_goals") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить LaunchGoalReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "launch_goals", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleLaunchGoalsAnalysis({ userId: input.userId });
  }

  if (scenario === "closed_wave") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить ClosedWaveReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "closed_wave", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleClosedWaveAnalysis({ userId: input.userId });
  }

  if (scenario === "wave_review") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить WaveReviewReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "wave_review", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleWaveReviewAnalysis({ userId: input.userId });
  }

  if (scenario === "launch_decision") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить LaunchDecisionAIReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "launch_decision", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleLaunchDecisionAnalysis({ userId: input.userId });
  }

  if (scenario === "ecosystem") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить EcosystemReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "ecosystem", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleEcosystemAnalysis({ userId: input.userId });
  }

  if (scenario === "ecosystem_value") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить EcosystemValueReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "ecosystem_value", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleEcosystemValueAnalysis({ userId: input.userId });
  }

  if (scenario === "first_users") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить FirstUsersReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "first_users", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleFirstUsersAnalysis({ userId: input.userId });
  }

  if (scenario === "first_users_review") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить FirstUsersReviewReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: {
          scenario: "first_users_review",
          disclaimer: LIA_DISCLAIMER,
        },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleFirstUsersReviewAnalysis({ userId: input.userId });
  }

  if (scenario === "beta_expansion") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить BetaExpansionReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: {
          scenario: "beta_expansion",
          disclaimer: LIA_DISCLAIMER,
        },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleBetaExpansionAnalysis({ userId: input.userId });
  }

  if (scenario === "open_beta_readiness") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить OpenBetaReadinessReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: {
          scenario: "open_beta_readiness",
          disclaimer: LIA_DISCLAIMER,
        },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleOpenBetaReadinessAnalysis({ userId: input.userId });
  }

  if (scenario === "open_beta") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить OpenBetaReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "open_beta", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleOpenBetaAnalysis({ userId: input.userId });
  }

  if (scenario === "open_beta_growth") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить RetentionReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "open_beta_growth", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleOpenBetaGrowthAnalysis({ userId: input.userId });
  }

  if (scenario === "public_launch_decision") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить PublicLaunchDecisionReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: {
          scenario: "public_launch_decision",
          disclaimer: LIA_DISCLAIMER,
        },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handlePublicLaunchDecisionAnalysis({ userId: input.userId });
  }

  if (scenario === "public_launch") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить PublicLaunchReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "public_launch", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handlePublicLaunchAnalysis({ userId: input.userId });
  }

  if (scenario === "live_launch") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить LiveLaunchReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "live_launch", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleLiveLaunchAnalysis({ userId: input.userId });
  }

  if (scenario === "growth") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить GrowthReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: { scenario: "growth", disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleGrowthAnalysis({ userId: input.userId });
  }

  if (scenario === "project_acquisition") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить ProjectAcquisitionReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: {
          scenario: "project_acquisition",
          disclaimer: LIA_DISCLAIMER,
        },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleProjectAcquisitionAnalysis({ userId: input.userId });
  }

  if (scenario === "partnership_network") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить PartnershipReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: {
          scenario: "partnership_network",
          disclaimer: LIA_DISCLAIMER,
        },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handlePartnershipNetworkAnalysis({ userId: input.userId });
  }

  if (scenario === "revenue_opportunity") {
    if (!input.userId) {
      return {
        content: `Войдите в аккаунт, чтобы получить RevenueOpportunityReport.\n\n_${LIA_DISCLAIMER}_`,
        metadata: {
          scenario: "revenue_opportunity",
          disclaimer: LIA_DISCLAIMER,
        },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    return handleRevenueOpportunityAnalysis({ userId: input.userId });
  }

  if (scenario === "org_find_projects") {
    const results = await searchProjects(input.userMessage, 5);
    const intro =
      "Подходящие проекты для организации в каталоге ЦКР (рекомендация, не заявка):";
    if (results.length === 0) {
      return {
        content: [
          intro,
          "",
          "Точных совпадений пока нет. Уточните отрасль и регион или откройте /partner.",
          "",
          "Лия не создаёт заявки автоматически.",
          "",
          `_${LIA_DISCLAIMER}_`,
        ].join("\n"),
        metadata: { scenario, results: [], disclaimer: LIA_DISCLAIMER },
        results: [],
        projectDraft: null,
        solutionDraft: null,
        catalogDraft: null,
      };
    }
    const list = results
      .map(
        (item, index) =>
          `${index + 1}. [${item.title}](${item.href}) — ${item.summary}`,
      )
      .join("\n");
    return {
      content: `${intro}\n\n${list}\n\nКабинет организации: /partner\n\n_${LIA_DISCLAIMER}_`,
      metadata: { scenario, results, disclaimer: LIA_DISCLAIMER },
      results,
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  if (scenario === "org_offer_opportunities") {
    return {
      content: [
        "Какие возможности организация может предложить экосистеме ЦКР:",
        "",
        "1. Возможности: услуги, оборудование, помещения, партнёрство — раздел /partner/offers",
        "2. Инвестиционные предложения — если организация готова вкладывать капитал",
        "3. Участие в проектах — создайте или откликнитесь через кабинет организации",
        "4. Оформите партнёрство (strategic / supplier / investment / technology / expert)",
        "",
        "Лия только рекомендует формат — публикация и заявки выполняются вручную.",
        "",
        `_${LIA_DISCLAIMER}_`,
      ].join("\n"),
      metadata: { scenario, disclaimer: LIA_DISCLAIMER },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
    };
  }

  if (scenario === "check_reliability") {
    return handleCheckReliability(input.userMessage);
  }

  const [projects, opportunities, investments, experts] = await Promise.all([
    searchProjects(input.userMessage, 2),
    searchOpportunities(input.userMessage, 2),
    searchInvestments(input.userMessage, 2),
    searchExperts(input.userMessage, 2),
  ]);
  const results = [
    ...projects,
    ...opportunities,
    ...investments,
    ...experts,
  ];

  const provider = getLiaProvider();
  const { getLiaMarketSnapshot } = await import("@/lib/analytics/lia-context");
  const [generated, marketSnapshot] = await Promise.all([
    provider.generate({
      userMessage: input.userMessage,
      scenario: null,
      history: input.history,
    }),
    getLiaMarketSnapshot(),
  ]);

  const links =
    results.length > 0
      ? `\n\nНашла связанные объекты ЦКР:\n${results
          .map((item) => `- [${item.title}](${item.href})`)
          .join("\n")}`
      : "\n\nТочных совпадений в каталогах пока нет. Уточните отрасль, регион или выберите быстрый сценарий.";

  return {
    content: `${generated.content}${links}\n\n_${LIA_DISCLAIMER}_`,
    metadata: {
      ...generated.metadata,
      results,
      disclaimer: LIA_DISCLAIMER,
      provider: generated.provider,
      /** Факты рынка для будущего анализа — без автовыводов */
      marketSnapshot,
    },
    results,
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}
