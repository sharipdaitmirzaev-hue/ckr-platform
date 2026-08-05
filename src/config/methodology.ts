/**
 * Методология сопровождения проектов ЦКР (этап 32).
 * Документация: docs/ckr-methodology.md
 */

export const CKR_METHODOLOGY_STAGES = [
  "diagnosis",
  "strategy",
  "resource_search",
  "deal_preparation",
  "realization",
  "result_control",
] as const;

export type CkrMethodologyStage = (typeof CKR_METHODOLOGY_STAGES)[number];

export const ckrMethodologyStageLabels: Record<CkrMethodologyStage, string> = {
  diagnosis: "Диагностика",
  strategy: "Стратегия",
  resource_search: "Поиск ресурсов",
  deal_preparation: "Подготовка сделки",
  realization: "Реализация",
  result_control: "Контроль результата",
};

export const ckrMethodologyStageNumbers: Record<CkrMethodologyStage, number> = {
  diagnosis: 1,
  strategy: 2,
  resource_search: 3,
  deal_preparation: 4,
  realization: 5,
  result_control: 6,
};

export type CkrMethodologyStageDef = {
  id: CkrMethodologyStage;
  number: number;
  title: string;
  goal: string;
  activities: string[];
  liaHints: string[];
  outputs: string[];
};

export const CKR_METHODOLOGY: CkrMethodologyStageDef[] = [
  {
    id: "diagnosis",
    number: 1,
    title: "Диагностика",
    goal: "Понять текущую ситуацию, ресурсы, проблемы и цели.",
    activities: [
      "Заполнить профиль организации / проекта",
      "Пройти сценарий Лии «Аудит бизнеса»",
      "Зафиксировать сильные/слабые стороны",
    ],
    liaHints: ["business_audit", "check_reliability"],
    outputs: ["BusinessAuditReport", "карточка проекта (черновик)"],
  },
  {
    id: "strategy",
    number: 2,
    title: "Стратегия",
    goal: "Сформировать направления роста и план действий.",
    activities: [
      "Выбрать шаблон проекта ЦКР",
      "Запустить «Разработать стратегию развития»",
      "Согласовать цели и горизонт",
    ],
    liaHints: ["develop_strategy", "business_idea"],
    outputs: ["StrategyReport", "RoadmapDraft"],
  },
  {
    id: "resource_search",
    number: 3,
    title: "Поиск ресурсов",
    goal: "Найти капитал, партнёров, возможности и экспертизу.",
    activities: [
      "Анализ / find_solutions Лии",
      "CRM-сегменты customers / suppliers / partners",
      "Подбор инвестиций, возможностей, экспертов",
    ],
    liaHints: ["find_investments", "find_property", "find_expert", "solution"],
    outputs: ["подборка объектов ЦКР", "InvestmentProposalDraft"],
  },
  {
    id: "deal_preparation",
    number: 4,
    title: "Подготовка сделки",
    goal: "Оформить заявки и перейти к сделке без автодействий.",
    activities: [
      "Заявки applications",
      "Создать сделку из accepted application",
      "Документы и участники workspace",
    ],
    liaHints: ["realize_project"],
    outputs: ["deal (negotiation)", "BusinessPlanDraft (структура)"],
  },
  {
    id: "realization",
    number: 5,
    title: "Реализация",
    goal: "Вести этапы workspace и сопровождать исполнение.",
    activities: [
      "Milestones: in_progress / completed",
      "Активность проекта",
      "Связь с оператором / CRM задачами",
    ],
    liaHints: ["realize_project"],
    outputs: ["обновлённый roadmap", "статус сделки active"],
  },
  {
    id: "result_control",
    number: 6,
    title: "Контроль результата",
    goal: "Оценить итог, репутацию и следующие циклы роста.",
    activities: [
      "Завершение milestones / deal completed",
      "Отзывы и reputation",
      "Feedback / pilot issues",
    ],
    liaHints: ["check_reliability"],
    outputs: ["completed project/deal", "уроки для следующего цикла"],
  },
];

export function getMethodologyStage(
  id: string | null | undefined,
): CkrMethodologyStageDef | null {
  if (!id) return null;
  return CKR_METHODOLOGY.find((item) => item.id === id) ?? null;
}
