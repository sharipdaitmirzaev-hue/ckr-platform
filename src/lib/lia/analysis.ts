import { LIA_DISCLAIMER } from "@/config/lia";
import {
  buildExternalSearchQueries,
  searchSolutionsBundle,
} from "@/lib/lia/search";
import type { Project } from "@/types";
import type {
  ExternalSearchResult,
  InternalMatch,
  SolutionDraft,
  SolutionReport,
} from "@/types/lia";

const RESOURCE_PATTERNS: {
  key: string;
  label: string;
  pattern: RegExp;
}[] = [
  { key: "investment", label: "инвестиции", pattern: /инвест|капитал|финанс|бюджет|сумм/i },
  { key: "land", label: "земля", pattern: /земл|участок|land/i },
  { key: "premises", label: "помещение", pattern: /помещен|площад|аренд|недвиж|цех|склад/i },
  { key: "equipment", label: "оборудование", pattern: /оборуд|станк|техник|лини/i },
  { key: "specialists", label: "специалисты", pattern: /специалист|команд|кадр|сотрудник|эксперт/i },
  { key: "partners", label: "партнёры", pattern: /партн|investor|поставщик|дистриб/i },
  { key: "documents", label: "документы", pattern: /документ|лиценз|разрешен|сертиф/i },
  { key: "idea", label: "бизнес-идея", pattern: /идея|концепц|модель/i },
];

function splitResources(text: string): string[] {
  return text
    .split(/[,;\n•·]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .slice(0, 12);
}

function detectLabels(text: string, fallback: string[] = []): string[] {
  const found = RESOURCE_PATTERNS.filter((item) => item.pattern.test(text)).map(
    (item) => item.label,
  );
  return Array.from(new Set([...found, ...fallback]));
}

function extractAvailable(project: Project, extraExisting = ""): string[] {
  const blob = `${project.description}\n${extraExisting}`;
  const fromText = splitResources(extraExisting);
  const detected = detectLabels(blob);

  const available: string[] = [];
  if (project.title || project.summary) available.push("бизнес-идея");
  if (project.region) available.push(`регион: ${project.region}`);
  if (project.category) available.push(`отрасль: ${project.category}`);
  if (project.stage && project.stage !== "idea") {
    available.push(`стадия: ${project.stage}`);
  }
  if (detected.includes("документы")) available.push("документы");
  if (detected.includes("специалисты")) available.push("команда / специалисты");
  if (detected.includes("оборудование")) available.push("оборудование");
  if (detected.includes("земля")) available.push("земля");
  if (detected.includes("помещение")) available.push("помещение");

  for (const item of fromText) {
    if (!available.some((a) => a.toLowerCase().includes(item.toLowerCase()))) {
      available.push(item);
    }
  }

  return Array.from(new Set(available)).slice(0, 10);
}

export function extractMissingResources(
  project: Project,
  extraRequired = "",
): string[] {
  const blob = `${project.description}\n${extraRequired}\nтребуется инвестиции ${project.investmentRequired}`;
  const fromText = splitResources(extraRequired);
  const detected = detectLabels(blob);

  const missing: string[] = [];
  if (project.investmentRequired > 0 || detected.includes("инвестиции")) {
    missing.push("инвестиции");
  }
  for (const label of [
    "земля",
    "помещение",
    "оборудование",
    "специалисты",
    "партнёры",
  ]) {
    if (detected.includes(label)) missing.push(label);
  }

  for (const item of fromText) {
    if (!missing.some((m) => m.toLowerCase().includes(item.toLowerCase()))) {
      missing.push(item);
    }
  }

  if (missing.length === 0) {
    missing.push("инвестиции", "оборудование", "помещение");
  }

  return Array.from(new Set(missing)).slice(0, 10);
}

function buildRecommendations(
  project: Project,
  missing: string[],
  internalCount: number,
  externalCount: number,
): string[] {
  const steps: string[] = [];
  if (missing.some((m) => /помещен|земл/i.test(m))) {
    steps.push("Проверить помещение или участок в каталоге возможностей ЦКР.");
  }
  if (missing.some((m) => /оборуд/i.test(m)) || externalCount > 0) {
    steps.push(
      "Получить коммерческие предложения по оборудованию (внешние источники — только ориентир).",
    );
  }
  if (missing.some((m) => /инвест/i.test(m)) || project.investmentRequired > 0) {
    steps.push("Подготовить финансовую модель и уточнить сумму инвестиций.");
  }
  if (internalCount > 0) {
    steps.push(
      "Связаться с найденными объектами ЦКР через заявки — Лия не создаёт заявки сама.",
    );
  }
  if (missing.some((m) => /специалист|эксперт|партн/i.test(m))) {
    steps.push("Подключить эксперта ЦКР для проверки рисков и документов.");
  }
  if (externalCount > 0) {
    steps.push(
      "Проверить внешние источники вручную: источник, дату и условия — данные неподтверждены.",
    );
  }
  steps.push("Дополнить карточку проекта перед публикацией и модерацией.");
  return Array.from(new Set(steps)).slice(0, 6);
}

function buildRisks(external: ExternalSearchResult[]): string[] {
  const risks = [
    "Рекомендации Лии предварительные и не являются юридической или финансовой консультацией.",
    "Совпадения в каталогах ЦКР требуют ручной проверки совместимости.",
  ];
  if (external.length > 0) {
    risks.push(
      "Внешние источники не верифицированы ЦКР — не доверяйте им автоматически.",
    );
  }
  risks.push(
    "Лия не изменяет данные проекта и не создаёт заявки без вашего подтверждения.",
  );
  return risks;
}

function buildNextSteps(missing: string[]): string[] {
  return [
    "Уточнить недостающие ресурсы в карточке проекта",
    missing[0]
      ? `Сфокусироваться на закрытии потребности: ${missing[0]}`
      : "Собрать пакет документов для проверки",
    "Отправить заявки выбранным инвесторам / экспертам / владельцам возможностей",
    "Повторить анализ Лией после обновления данных проекта",
  ];
}

function parseExistingFromDescription(description: string) {
  const match = description.match(/Что уже есть:\s*([^\n]+)/i);
  return match?.[1]?.trim() || "";
}

function parseRequiredFromDescription(description: string) {
  const match = description.match(/Что требуется:\s*([^\n]+)/i);
  return match?.[1]?.trim() || "";
}

export function buildSolutionDraft(
  project: Project,
  available: string[],
  missing: string[],
  recommendations: string[],
  risks: string[],
  nextSteps: string[],
): SolutionDraft {
  return {
    project_id: project.id,
    summary: [
      `Анализ проекта «${project.title}».`,
      available.length
        ? `Есть: ${available.slice(0, 4).join(", ")}.`
        : "Доступные ресурсы уточняются.",
      missing.length
        ? `Нужно: ${missing.slice(0, 4).join(", ")}.`
        : "Критичных пробелов не видно.",
    ].join(" "),
    available_resources: available,
    missing_resources: missing,
    recommendations,
    risks,
    next_steps: nextSteps,
  };
}

export async function buildSolutionReport(
  project: Project,
  options?: {
    includeExternal?: boolean;
    existingResources?: string;
    requiredResources?: string;
  },
): Promise<SolutionReport> {
  const existing =
    options?.existingResources ||
    parseExistingFromDescription(project.description);
  const required =
    options?.requiredResources ||
    parseRequiredFromDescription(project.description);

  const available = extractAvailable(project, existing);
  const missing = extractMissingResources(project, required);

  // 1) недостающие ресурсы → 2) поисковые запросы → 3) внутренний + внешний поиск
  const searchQueries = buildExternalSearchQueries(project, missing);

  const internalQuery = [
    project.title,
    project.summary,
    project.category,
    project.region,
    missing.join(" "),
    required,
  ]
    .filter(Boolean)
    .join(" ");

  const bundle = await searchSolutionsBundle(internalQuery, {
    region: project.region,
    category: project.category,
    projectTitle: project.title,
    internalLimit: 3,
    externalLimit: 8,
    includeExternal: options?.includeExternal !== false,
    externalQueries: searchQueries,
  });

  const internalCount =
    bundle.investments.length +
    bundle.experts.length +
    bundle.opportunities.length +
    bundle.projects.length;

  const recommendations = buildRecommendations(
    project,
    missing,
    internalCount,
    bundle.external.length,
  );
  const risks = buildRisks(bundle.external);
  const nextSteps = buildNextSteps(missing);
  const solutionDraft = buildSolutionDraft(
    project,
    available,
    missing,
    recommendations,
    risks,
    nextSteps,
  );

  return {
    project: {
      id: project.id,
      title: project.title,
      summary: project.summary,
      region: project.region,
      category: project.category,
      stage: project.stage,
      investment_required: project.investmentRequired,
    },
    available,
    missing,
    searchQueries: bundle.searchQueries,
    externalProvider: bundle.externalProvider,
    internal: {
      projects: bundle.projects,
      opportunities: bundle.opportunities,
      investments: bundle.investments,
      experts: bundle.experts,
    },
    external: bundle.external.map((item) => ({ ...item, trusted: false })),
    recommendations,
    risks,
    next_steps: nextSteps,
    solutionDraft,
    disclaimer: LIA_DISCLAIMER,
  };
}

export function flattenInternalMatches(report: SolutionReport): InternalMatch[] {
  return [
    ...report.internal.investments,
    ...report.internal.experts,
    ...report.internal.opportunities,
    ...report.internal.projects,
  ];
}

export function formatSolutionReportText(report: SolutionReport): string {
  const count = (items: InternalMatch[]) => items.length;
  const lines = [
    `Проект: ${report.project.title}`,
    "",
    "Есть:",
    ...report.available.map((item) => `- ${item}`),
    "",
    "Нужно:",
    ...report.missing.map((item) => `- ${item}`),
    "",
    report.searchQueries?.length
      ? `Поисковые запросы:\n${report.searchQueries.map((q) => `- ${q}`).join("\n")}`
      : "",
    "",
    "Найдено в ЦКР:",
    `- ${count(report.internal.investments)} инвестора(ов);`,
    `- ${count(report.internal.experts)} эксперт(а/ов);`,
    `- ${count(report.internal.opportunities)} возможностей;`,
    `- ${count(report.internal.projects)} похожих проектов.`,
    "",
    "Найдено во внешних источниках:",
    ...report.external.map(
      (item) =>
        `- [${item.title}](${item.url}) · ${item.source} · trust ${(item.trust_score * 100).toFixed(0)}% · не подтверждено`,
    ),
    report.external.length === 0 ? "- результатов нет" : "",
    "",
    "Рекомендации:",
    ...report.recommendations.map((item, i) => `${i + 1}. ${item}`),
    "",
    "Следующие шаги:",
    ...report.next_steps.map((item, i) => `${i + 1}. ${item}`),
    "",
    `_${report.disclaimer}_`,
  ].filter((line) => line !== undefined && line !== "");

  return lines.join("\n");
}
