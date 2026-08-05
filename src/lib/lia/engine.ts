import {
  BUSINESS_IDEA_STEPS,
  LIA_DISCLAIMER,
  PROJECT_FLOW_START_PATTERN,
  REALIZE_PROJECT_PATTERN,
} from "@/config/lia";
import { getLiaProvider } from "@/lib/lia/provider";
import { buildRealizeProjectGuidance } from "@/lib/lia/realize";
import {
  searchExperts,
  searchInvestments,
  searchOpportunities,
  searchProjects,
} from "@/lib/lia/search";
import type {
  LiaCatalogDraft,
  LiaMessage,
  LiaMessageMetadata,
  LiaResultLink,
  LiaScenarioId,
  ProjectDraft,
  SolutionDraft,
} from "@/types/lia";

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
  return null;
}

function extractProjectIdFromMessage(message: string) {
  const match = message.match(
    /(?:projectId|project|проект)[:\s]+([0-9a-f-]{36})/i,
  );
  return match?.[1] || null;
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
  const generated = await provider.generate({
    userMessage: input.userMessage,
    scenario: null,
    history: input.history,
  });

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
    },
    results,
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
  };
}
