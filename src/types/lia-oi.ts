/** LIA Opportunity Intelligence — domain types (stage 1). */

export const LIA_OI_PROVENANCE_KINDS = [
  "FACT",
  "INFERENCE",
  "ESTIMATE",
  "UNKNOWN",
] as const;
export type LiaOiProvenanceKind = (typeof LIA_OI_PROVENANCE_KINDS)[number];

export const LIA_OI_STATUSES = [
  "NEW",
  "REVIEWING",
  "INTERESTING",
  "DEEP_RESEARCH",
  "SAVED",
  "PROJECT_CREATED",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
] as const;
export type LiaOiStatus = (typeof LIA_OI_STATUSES)[number];

export const LIA_OI_PRIORITY_LEVELS = [
  "NORMAL",
  "INTERESTING",
  "HIGH_PRIORITY",
  "URGENT",
] as const;
export type LiaOiPriority = (typeof LIA_OI_PRIORITY_LEVELS)[number];

export const LIA_OI_SOURCE_CATEGORIES = [
  "INTERNAL_CKR",
  "PUBLIC_WEB",
  "CLASSIFIEDS",
  "REAL_ESTATE",
  "PROCUREMENT",
  "GOVERNMENT",
  "AUCTIONS",
  "BUSINESS",
  "NEWS_SIGNALS",
  "SUPPORT_PROGRAMS",
  "MARKET_DATA",
  "STUB_DEMO",
] as const;
export type LiaOiSourceCategory = (typeof LIA_OI_SOURCE_CATEGORIES)[number];

export const LIA_OI_FEEDBACK_EVENTS = [
  "INTERESTED",
  "SAVE",
  "REJECT",
  "DEEP_RESEARCH",
  "CREATE_PROJECT",
  "PUBLISH",
] as const;
export type LiaOiFeedbackEvent = (typeof LIA_OI_FEEDBACK_EVENTS)[number];

export const LIA_OI_ASSIGNMENT_KINDS = [
  "DEEP_CHECK",
  "FIND_OWNER",
  "CHECK_MARKET",
  "FIND_COMPETITORS",
  "FIND_BUYERS",
  "FIND_SUPPLIERS",
  "FIND_INVESTOR",
  "FIND_SIMILAR",
  "CHECK_SUPPORT",
  "BUILD_PROJECT",
  "PREPARE_OFFER",
  "CKR_ANGLE",
  "CUSTOM",
] as const;
export type LiaOiAssignmentKind = (typeof LIA_OI_ASSIGNMENT_KINDS)[number];

export type LiaOiClaim = {
  field: string;
  value: string;
  kind: LiaOiProvenanceKind;
  sourceName?: string;
  sourceUrl?: string;
  note?: string;
};

export type LiaOiScoreBreakdown = {
  market: number;
  economics: number;
  location: number;
  demand: number;
  competition: number;
  execution: number;
  legal: number;
  sourceConfidence: number;
  dataCompleteness: number;
  strategicFit: number;
};

export type LiaOiScore = {
  overall: number;
  confidence: number;
  breakdown: LiaOiScoreBreakdown;
  explanation: string[];
  priority: LiaOiPriority;
};

export type LiaOiSourceRef = {
  id: string;
  category: LiaOiSourceCategory;
  name: string;
  url: string;
  publishedAt?: string;
  isStub: boolean;
};

export type LiaOiCandidate = {
  id: string;
  type: string;
  title: string;
  description: string;
  summary: string;
  whyInteresting: string[];
  recommendation: string;
  nextStep: string;
  status: LiaOiStatus;
  country: string;
  region?: string;
  city?: string;
  industry?: string;
  subindustry?: string;
  askingPrice?: number | null;
  investmentRequired?: number | null;
  revenue?: number | null;
  profit?: number | null;
  paybackPeriod?: string | null;
  assetType?: string;
  area?: string;
  landArea?: string;
  contactsPublic?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  sources: LiaOiSourceRef[];
  claims: LiaOiClaim[];
  risks: string[];
  unknowns: string[];
  toVerify: string[];
  score: LiaOiScore;
  matchHints: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  canonicalKey: string;
  rawStubIds: string[];
  searchRequestId?: string;
};

export type LiaOiSearchIntent =
  | "investment_search"
  | "business_for_sale"
  | "land_or_site"
  | "buyers_or_demand"
  | "hotel_or_tourism"
  | "equipment"
  | "general_opportunity";

export type LiaOiSearchPlan = {
  id: string;
  rawQuery: string;
  intent: LiaOiSearchIntent;
  country: string;
  regions: string[];
  budgetMin?: number | null;
  budgetMax?: number | null;
  industries: string[];
  assetTypes: string[];
  hypotheses: string[];
  queries: string[];
  createdAt: string;
};

export type LiaOiSearchRequest = {
  id: string;
  query: string;
  plan: LiaOiSearchPlan;
  createdAt: string;
  createdBy: string;
  candidateIds: string[];
  stubMode: true;
};

export type LiaOiFeedback = {
  id: string;
  candidateId: string;
  event: LiaOiFeedbackEvent;
  reason?: string;
  createdAt: string;
  createdBy: string;
};

export type LiaOiAssignment = {
  id: string;
  candidateId: string;
  kind: LiaOiAssignmentKind;
  instruction: string;
  status: "queued" | "done";
  resultSummary: string;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
};

export type LiaOiReportKind =
  | "daily_digest"
  | "search_result"
  | "cycle_summary"
  | "high_priority"
  | "hypotheses";

export type LiaOiReport = {
  id: string;
  kind: LiaOiReportKind;
  title: string;
  body: string;
  stats: Record<string, number>;
  candidateIds: string[];
  createdAt: string;
  stubMode: true;
};

export type LiaOiHypothesis = {
  id: string;
  title: string;
  summary: string;
  supportingCandidateIds: string[];
  missingPieces: string[];
  investmentScale?: string;
  createdAt: string;
  status: "DRAFT";
};

export type LiaOiTodayStats = {
  signalsScanned: number;
  newAfterDedup: number;
  analyzed: number;
  worthAttention: number;
  highPriority: number;
  newHypotheses: number;
  stubMode: true;
  generatedAt: string;
};
