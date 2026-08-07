/**
 * Структуры черновиков документов проекта ЦКР.
 * Без генерации файлов — только данные для UI / Лии / будущего экспорта.
 */

/** Черновик бизнес-плана (структура). */
export type BusinessPlanDraft = {
  projectId: string | null;
  title: string;
  executiveSummary: string;
  market: string;
  product: string;
  businessModel: string;
  team: string;
  financials: {
    investmentRequired: number | null;
    currency: string;
    revenueModel: string;
    keyAssumptions: string[];
  };
  risks: string[];
  roadmapRef: string | null;
  createdAt?: string;
};

/** Черновик roadmap проекта. */
export type RoadmapDraftItem = {
  id: string;
  title: string;
  description: string;
  methodologyStage:
    | "diagnosis"
    | "strategy"
    | "resource_search"
    | "deal_preparation"
    | "realization"
    | "result_control";
  status: "planned" | "in_progress" | "completed" | "blocked";
  order: number;
};

export type RoadmapDraft = {
  projectId: string | null;
  title: string;
  horizon: string;
  currentStage:
    | "diagnosis"
    | "strategy"
    | "resource_search"
    | "deal_preparation"
    | "realization"
    | "result_control";
  items: RoadmapDraftItem[];
  notes: string;
  createdAt?: string;
};

/** Черновик инвестиционного предложения (структура). */
export type InvestmentProposalDraft = {
  projectId: string | null;
  title: string;
  askAmount: number | null;
  currency: string;
  instrument: "equity" | "loan" | "partnership" | "other";
  useOfFunds: string[];
  traction: string[];
  offerTerms: string;
  risks: string[];
  contactsNote: string;
  createdAt?: string;
};
