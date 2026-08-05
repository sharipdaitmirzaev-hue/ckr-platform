export type LiaMessageRole = "user" | "assistant" | "system" | "tool";

export type LiaScenarioId =
  | "business_idea"
  | "find_investments"
  | "find_property"
  | "find_expert"
  | "solution";

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

export type ProjectDraft = {
  title: string;
  summary: string;
  description: string;
  category: string;
  region: string;
  investmentRequired: number;
  currency: string;
  stage: string;
  assets?: string;
  needs?: string;
};

export type SolutionDraft = {
  task: string;
  projects: LiaResultLink[];
  opportunities: LiaResultLink[];
  investments: LiaResultLink[];
  experts: LiaResultLink[];
  nextSteps: string[];
  risks: string[];
  missingData: string[];
};

export type LiaMessageMetadata = {
  scenario?: LiaScenarioId | null;
  results?: LiaResultLink[];
  projectDraft?: ProjectDraft | null;
  solutionDraft?: SolutionDraft | null;
  businessIdeaStep?: number;
  businessIdeaAnswers?: Record<string, string>;
  disclaimer?: string;
  provider?: string;
  [key: string]: unknown;
};

export type LiaChatRequest = {
  sessionId?: string | null;
  message: string;
  scenario?: LiaScenarioId | null;
};

export type LiaChatResponse = {
  ok: boolean;
  sessionId: string;
  assistantMessage: LiaMessage;
  results?: LiaResultLink[];
  projectDraft?: ProjectDraft | null;
  solutionDraft?: SolutionDraft | null;
  disclaimer: string;
  error?: string;
};
