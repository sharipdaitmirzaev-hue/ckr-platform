import type { CkrMethodologyStage } from "@/config/methodology";

export const PROJECT_TEMPLATE_IDS = [
  "new_business",
  "business_development",
  "investment_project",
  "business_optimization",
] as const;

export type ProjectTemplateId = (typeof PROJECT_TEMPLATE_IDS)[number];

export type ProjectTemplateSection = {
  key: string;
  title: string;
  placeholder: string;
};

export type ProjectTemplate = {
  id: ProjectTemplateId;
  label: string;
  description: string;
  defaultTitle: string;
  defaultSummary: string;
  category: string;
  stage: "idea" | "startup" | "operating" | "expansion";
  /** Цели шаблона */
  goals: string[];
  /** Этапы реализации (workspace) */
  stages: string[];
  /** Необходимые данные для старта */
  requiredData: string[];
  /** Рекомендуемые действия в ЦКР */
  recommendedActions: string[];
  /** Стартовый этап методологии */
  methodologyStart: CkrMethodologyStage;
  sections: ProjectTemplateSection[];
  /** @deprecated используйте stages */
  suggestedMilestones: string[];
};

const sharedSections = (
  extras: ProjectTemplateSection[] = [],
): ProjectTemplateSection[] => [
  {
    key: "goals",
    title: "Цели",
    placeholder: "Чего хотите достичь за выбранный горизонт.",
  },
  {
    key: "current_situation",
    title: "Текущая ситуация",
    placeholder: "Контекст рынка и исходная позиция.",
  },
  {
    key: "resources",
    title: "Ресурсы",
    placeholder: "Что уже есть: команда, активы, клиенты, капитал.",
  },
  {
    key: "problems",
    title: "Проблемы и ограничения",
    placeholder: "Узкие места и риски.",
  },
  ...extras,
];

export const NEW_BUSINESS_TEMPLATE: ProjectTemplate = {
  id: "new_business",
  label: "Новый бизнес",
  description:
    "Запуск с нуля: идея, проверка гипотез, первые ресурсы и выход на рынок.",
  defaultTitle: "Новый бизнес-проект",
  defaultSummary:
    "Создание нового бизнеса: продукт, рынок, команда и первые продажи.",
  category: "services",
  stage: "idea",
  goals: [
    "Сформулировать ценностное предложение",
    "Собрать минимальный набор ресурсов для запуска",
    "Выйти на первых клиентов / пилот",
  ],
  stages: [
    "Диагностика идеи",
    "MVP / прототип",
    "Первые продажи",
    "Партнёры и капитал",
    "Запуск",
  ],
  requiredData: [
    "Отрасль и регион",
    "Описание идеи и ЦА",
    "Что уже есть / чего не хватает",
    "Оценка инвестиций",
  ],
  recommendedActions: [
    "Лия: «Помоги создать бизнес-проект»",
    "Лия: анализ / find_solutions",
    "Создать заявки к возможностям и инвесторам",
    "Workspace: этапы запуска",
  ],
  methodologyStart: "diagnosis",
  sections: sharedSections([
    {
      key: "product",
      title: "Продукт / услуга",
      placeholder: "Что предлагаете рынку.",
    },
    {
      key: "market",
      title: "Рынок и клиенты",
      placeholder: "Сегменты, спрос, конкуренты.",
    },
  ]),
  suggestedMilestones: [
    "Диагностика идеи",
    "MVP / прототип",
    "Первые продажи",
    "Партнёры и капитал",
    "Запуск",
  ],
};

export const BUSINESS_DEVELOPMENT_TEMPLATE: ProjectTemplate = {
  id: "business_development",
  label: "Развитие бизнеса",
  description:
    "Действующая организация: рост продаж, партнёры, финансы, масштаб (кейс ТИНДА).",
  defaultTitle: "Развитие бизнеса",
  defaultSummary:
    "Проект развития действующего бизнеса: усиление продаж, партнёрская сеть и масштабирование.",
  category: "trade",
  stage: "operating",
  goals: [
    "Усилить продажи и юнит-экономику",
    "Расширить партнёрскую и поставщицкую сеть",
    "Подготовить масштабирование в новые регионы",
  ],
  stages: [
    "Подготовка",
    "Продажи",
    "Партнёры",
    "Финансы",
    "Масштабирование",
  ],
  requiredData: [
    "Текущая модель и регион",
    "Ресурсы и команда",
    "Проблемы роста",
    "Цели на 6–12 месяцев",
    "Потребность в капитале / партнёрах",
  ],
  recommendedActions: [
    "Лия: «Аудит бизнеса»",
    "Лия: «Разработать стратегию развития»",
    "CRM-шаблоны customers / suppliers / partners",
    "Сделка negotiation + этапы workspace",
  ],
  methodologyStart: "diagnosis",
  sections: sharedSections([
    {
      key: "sales",
      title: "Продажи",
      placeholder: "Воронка, сегменты клиентов, каналы.",
    },
    {
      key: "partners",
      title: "Партнёры",
      placeholder: "Поставщики, дистрибуция, стратегические партнёры.",
    },
    {
      key: "finance",
      title: "Финансы",
      placeholder: "Оборот, потребность в капитале, юнит-экономика.",
    },
    {
      key: "scaling",
      title: "Масштабирование",
      placeholder: "Новые регионы, ассортимент, команда.",
    },
  ]),
  suggestedMilestones: [
    "Подготовка",
    "Продажи",
    "Партнёры",
    "Финансы",
    "Масштабирование",
  ],
};

export const INVESTMENT_PROJECT_TEMPLATE: ProjectTemplate = {
  id: "investment_project",
  label: "Инвестиционный проект",
  description:
    "Проект под привлечение капитала: экономика, использование средств, предложение инвестору.",
  defaultTitle: "Инвестиционный проект",
  defaultSummary:
    "Проект привлечения инвестиций: цель раунда, использование средств и ожидаемый эффект.",
  category: "it",
  stage: "startup",
  goals: [
    "Сформировать инвестиционное предложение",
    "Определить объём и структуру капитала",
    "Найти подходящих инвесторов в ЦКР",
  ],
  stages: [
    "Пакет данных",
    "Финансовая модель",
    "Поиск инвесторов",
    "Переговоры",
    "Закрытие раунда",
  ],
  requiredData: [
    "Сумма и тип инвестиций",
    "Использование средств",
    "Текущие метрики / traction",
    "Регион и отрасль",
    "Срок и ожидаемый результат",
  ],
  recommendedActions: [
    "Заполнить InvestmentProposalDraft (структура)",
    "Лия: find_investments / solution",
    "Заявки к investment offers",
    "Сделка типа investment",
  ],
  methodologyStart: "strategy",
  sections: sharedSections([
    {
      key: "use_of_funds",
      title: "Использование средств",
      placeholder: "На что пойдут инвестиции.",
    },
    {
      key: "traction",
      title: "Traction / метрики",
      placeholder: "Выручка, клиенты, рост, юнит-экономика.",
    },
    {
      key: "offer",
      title: "Предложение инвестору",
      placeholder: "Доля / долг / партнёрство, горизонт.",
    },
  ]),
  suggestedMilestones: [
    "Пакет данных",
    "Финансовая модель",
    "Поиск инвесторов",
    "Переговоры",
    "Закрытие раунда",
  ],
};

export const BUSINESS_OPTIMIZATION_TEMPLATE: ProjectTemplate = {
  id: "business_optimization",
  label: "Оптимизация бизнеса",
  description:
    "Повышение эффективности: процессы, затраты, маржа, операционная дисциплина.",
  defaultTitle: "Оптимизация бизнеса",
  defaultSummary:
    "Оптимизация действующего бизнеса: процессы, затраты, маржа и управляемость.",
  category: "services",
  stage: "operating",
  goals: [
    "Снизить операционные потери",
    "Улучшить маржинальность и цикл сделки",
    "Внедрить измеримый контроль результата",
  ],
  stages: [
    "Диагностика процессов",
    "Приоритеты оптимизации",
    "Пилотные изменения",
    "Масштаб внутри компании",
    "Контроль KPI",
  ],
  requiredData: [
    "Текущие процессы и KPI",
    "Узкие места и затраты",
    "Команда и зоны ответственности",
    "Целевые метрики улучшения",
  ],
  recommendedActions: [
    "Лия: «Аудит бизнеса»",
    "CRM: сегменты и задачи оператора",
    "Workspace: этапы оптимизации",
    "Контроль результата и reputation",
  ],
  methodologyStart: "diagnosis",
  sections: sharedSections([
    {
      key: "processes",
      title: "Процессы",
      placeholder: "Как устроены продажи, закупки, операции.",
    },
    {
      key: "kpi",
      title: "KPI",
      placeholder: "Какие показатели хотите улучшить.",
    },
    {
      key: "constraints",
      title: "Ограничения",
      placeholder: "Бюджет, люди, сроки, регуляторика.",
    },
  ]),
  suggestedMilestones: [
    "Диагностика процессов",
    "Приоритеты оптимизации",
    "Пилотные изменения",
    "Масштаб внутри компании",
    "Контроль KPI",
  ],
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  NEW_BUSINESS_TEMPLATE,
  BUSINESS_DEVELOPMENT_TEMPLATE,
  INVESTMENT_PROJECT_TEMPLATE,
  BUSINESS_OPTIMIZATION_TEMPLATE,
];

export function getProjectTemplate(
  id: string | null | undefined,
): ProjectTemplate | null {
  if (!id) return null;
  return PROJECT_TEMPLATES.find((item) => item.id === id) ?? null;
}

export function buildTemplateDescription(template: ProjectTemplate): string {
  const header = [
    `## Цели шаблона (${template.label})`,
    "",
    ...template.goals.map((item) => `- ${item}`),
    "",
    "## Этапы",
    "",
    ...template.stages.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Необходимые данные",
    "",
    ...template.requiredData.map((item) => `- ${item}`),
    "",
    "## Рекомендуемые действия ЦКР",
    "",
    ...template.recommendedActions.map((item) => `- ${item}`),
    "",
  ].join("\n");

  const body = template.sections
    .map((section) => `## ${section.title}\n\n${section.placeholder}`)
    .join("\n\n");

  return `${header}\n${body}`;
}

export function isProjectTemplateId(value: string): value is ProjectTemplateId {
  return (PROJECT_TEMPLATE_IDS as readonly string[]).includes(value);
}
