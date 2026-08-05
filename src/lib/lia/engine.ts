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
  const content = [
    "Аудит бизнеса подготовлен.",
    "",
    report.summary,
    "",
    "Ниже — сильные/слабые стороны, возможности, риски и следующие шаги.",
    "Лия только рекомендует: создайте проект и CRM-сегменты вручную.",
    "",
    "Рекомендуемый шаблон проекта: business_development.",
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
      disclaimer: LIA_DISCLAIMER,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
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
