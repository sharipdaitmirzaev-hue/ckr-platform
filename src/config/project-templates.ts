export const PROJECT_TEMPLATE_IDS = ["business_development"] as const;

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
  sections: ProjectTemplateSection[];
  suggestedMilestones: string[];
};

/** Шаблон развития действующего бизнеса (кейс ТИНДА). */
export const BUSINESS_DEVELOPMENT_TEMPLATE: ProjectTemplate = {
  id: "business_development",
  label: "Развитие бизнеса",
  description:
    "Шаблон для действующей организации: ситуация, ресурсы, продажи, партнёры, финансы, масштаб.",
  defaultTitle: "Развитие бизнеса",
  defaultSummary:
    "Проект развития действующего бизнеса: усиление продаж, партнёрская сеть и масштабирование.",
  category: "trade",
  stage: "operating",
  sections: [
    {
      key: "current_situation",
      title: "Текущая ситуация",
      placeholder: "Опишите текущую модель бизнеса и рынок.",
    },
    {
      key: "resources",
      title: "Ресурсы",
      placeholder: "Команда, активы, клиенты, инфраструктура.",
    },
    {
      key: "problems",
      title: "Проблемы",
      placeholder: "Ограничения роста, узкие места, риски.",
    },
    {
      key: "goals",
      title: "Цели",
      placeholder: "Чего хотите достичь за 6–12 месяцев.",
    },
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
  ],
  suggestedMilestones: [
    "Подготовка",
    "Продажи",
    "Партнёры",
    "Финансы",
    "Масштабирование",
  ],
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  BUSINESS_DEVELOPMENT_TEMPLATE,
];

export function getProjectTemplate(
  id: string | null | undefined,
): ProjectTemplate | null {
  if (!id) return null;
  return PROJECT_TEMPLATES.find((item) => item.id === id) ?? null;
}

export function buildTemplateDescription(template: ProjectTemplate): string {
  return template.sections
    .map((section) => `## ${section.title}\n\n${section.placeholder}`)
    .join("\n\n");
}

export function isProjectTemplateId(value: string): value is ProjectTemplateId {
  return (PROJECT_TEMPLATE_IDS as readonly string[]).includes(value);
}
