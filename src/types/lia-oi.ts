/** LIA Opportunity Intelligence — domain types (stage 1 + 2A + 2A.1 + 2A.2). */

export const LIA_OI_PROVENANCE_KINDS = [
  "FACT",
  "INFERENCE",
  "ESTIMATE",
  "UNKNOWN",
] as const;
export type LiaOiProvenanceKind = (typeof LIA_OI_PROVENANCE_KINDS)[number];

export const LIA_OI_PAGE_TYPES = [
  "DETAIL",
  "LIST",
  "CATEGORY",
  "HOMEPAGE",
  "UNKNOWN",
] as const;
export type LiaOiPageType = (typeof LIA_OI_PAGE_TYPES)[number];

/** Stage 2A.2 — intent содержимого страницы (не путать с pageType). */
export const LIA_OI_CONTENT_INTENTS = [
  "OPPORTUNITY",
  "CATALOG",
  "ARTICLE",
  "NEWS",
  "SOCIAL",
  "GUIDE",
  "UNKNOWN",
] as const;
export type LiaOiContentIntent = (typeof LIA_OI_CONTENT_INTENTS)[number];

export const LIA_OI_BUDGET_FITS = ["FIT", "OVER_BUDGET", "UNKNOWN"] as const;
export type LiaOiBudgetFit = (typeof LIA_OI_BUDGET_FITS)[number];

export const LIA_OI_PRICE_STATUSES = ["KNOWN", "UNKNOWN"] as const;
export type LiaOiPriceStatus = (typeof LIA_OI_PRICE_STATUSES)[number];

export const LIA_OI_PRICE_KINDS = [
  "ASKING_PRICE",
  "INVESTMENT_REQUIRED",
  "ASSET_PRICE",
  "STARTING_AUCTION_PRICE",
  "UNKNOWN",
] as const;
export type LiaOiPriceKind = (typeof LIA_OI_PRICE_KINDS)[number];

export const LIA_OI_RESULT_BUCKETS = [
  "TOP_OPPORTUNITIES",
  "NEEDS_RESEARCH",
  "SOURCE_CATALOGS",
  "REJECTED",
] as const;
export type LiaOiResultBucket = (typeof LIA_OI_RESULT_BUCKETS)[number];

/** Классы источников для source-aware planner (2A.2). */
export const LIA_OI_SOURCE_CLASSES = [
  "READY_BUSINESS",
  "INVESTMENT_PROJECT",
  "COMMERCIAL_REAL_ESTATE",
  "AUCTIONS_ASSETS",
  "PRODUCTION_ASSETS",
  "LAND_SITES",
  "SUPPORT_PROGRAMS",
  "TENDERS",
  "FRANCHISE",
  "OTHER",
] as const;
export type LiaOiSourceClass = (typeof LIA_OI_SOURCE_CLASSES)[number];

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
  /** Итоговый opportunity score (для сортировки ленты). */
  overall: number;
  /** confidence_score */
  confidence: number;
  /** relevance_score — совпадение с запросом/планом */
  relevance: number;
  /** quality_score — качество данных карточки */
  quality: number;
  /** opportunity_score — потенциал как бизнес-возможность */
  opportunity: number;
  breakdown: LiaOiScoreBreakdown;
  explanation: string[];
  /** Краткие причины попадания в TOP. */
  whyTop: string[];
  priority: LiaOiPriority;
};

export type LiaOiSourceRef = {
  id: string;
  category: LiaOiSourceCategory;
  name: string;
  url: string;
  publishedAt?: string;
  discoveredAt?: string;
  isStub: boolean;
};

export type LiaOiHardConstraints = {
  geography: string;
  maxBudgetRub: number | null;
  minBudgetRub: number | null;
};

export type LiaOiSoftPreferences = {
  preferPerspective: boolean;
  preferDataQuality: boolean;
  preferFinancialAttractiveness: boolean;
  notes: string[];
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
  isStub: boolean;
  searchRequestId?: string;
  /** Классификация страницы источника. */
  pageType: LiaOiPageType;
  /** true = каталог/листинг, не конкретная возможность. */
  isCatalogSource: boolean;
  /** Было ли обогащение через safe-fetch. */
  enrichedFromFetch?: boolean;
  /** Stage 2A.2 */
  contentIntent?: LiaOiContentIntent;
  budgetFit?: LiaOiBudgetFit;
  priceStatus?: LiaOiPriceStatus;
  priceKind?: LiaOiPriceKind;
  detailConfidence?: number;
  detailSignals?: string[];
  resultBucket?: LiaOiResultBucket;
  rejectReason?: string;
  missingFields?: string[];
  whyRecommend?: string[];
  sourceClass?: LiaOiSourceClass;
  /** Stage 2B identity */
  fingerprint?: string;
  canonicalUrl?: string;
  sourceObjectId?: string | null;
  /** Owner decision locked — rediscovery must not reset status */
  ownerLocked?: boolean;
  ownerStatusSetAt?: string;
  ownerStatusSetBy?: string;
};

export type LiaOiSearchIntent =
  | "business_opportunities"
  | "investment_opportunities"
  | "investment_search"
  | "business_for_sale"
  | "assets"
  | "real_estate"
  | "land_or_site"
  | "suppliers"
  | "buyers"
  | "buyers_or_demand"
  | "support_programs"
  | "tenders"
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
  /** Stage 2A.2 */
  hardConstraints?: LiaOiHardConstraints;
  softPreferences?: LiaOiSoftPreferences;
  sourceClasses?: LiaOiSourceClass[];
  pass1Queries?: string[];
  pass2Queries?: string[];
};

export type LiaOiSearchRequest = {
  id: string;
  query: string;
  plan: LiaOiSearchPlan;
  createdAt: string;
  createdBy: string;
  candidateIds: string[];
  stubMode: boolean;
  searchMode: "stub" | "live";
  providerLabel?: string;
  stats?: LiaOiPipelineStats;
  /** Stage 2B */
  durationMs?: number;
  errorSummary?: string | null;
};

export type LiaOiFeedback = {
  id: string;
  candidateId: string;
  event: LiaOiFeedbackEvent;
  reason?: string;
  createdAt: string;
  createdBy: string;
};

export const LIA_OI_ASSIGNMENT_STATUSES = [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;
export type LiaOiAssignmentStatus = (typeof LIA_OI_ASSIGNMENT_STATUSES)[number];

export type LiaOiAssignment = {
  id: string;
  candidateId: string;
  kind: LiaOiAssignmentKind;
  instruction: string;
  status: LiaOiAssignmentStatus;
  resultSummary: string;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  errorSummary?: string | null;
};

export type LiaOiOpportunityChange = {
  id: string;
  opportunityId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeKind:
    | "FIELD_UPDATE"
    | "STATUS_CHANGE"
    | "REDISCOVERY"
    | "OWNER_DECISION"
    | "ENRICHMENT";
  sourceRunId?: string | null;
  createdAt: string;
};

export type LiaOiOpportunityEvent = {
  id: string;
  opportunityId: string;
  eventType: string;
  title: string;
  detail?: string | null;
  actorUserId?: string | null;
  searchRunId?: string | null;
  meta?: Record<string, unknown>;
  createdAt: string;
};

export type LiaOiCandidateListFilter = {
  status?: string;
  bucket?: string;
  region?: string;
  industry?: string;
  savedOnly?: boolean;
  rejectedOnly?: boolean;
  minOverall?: number;
  minConfidence?: number;
  budgetFit?: string;
  source?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type LiaOiPaginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  stubMode: boolean;
};

export type LiaOiPipelineStats = {
  queriesRun: number;
  signalsRaw: number;
  filteredOut: number;
  duplicatesRemoved: number;
  afterDedup: number;
  analyzed: number;
  providerErrors: number;
  providerUnavailable: boolean;
  catalogPagesSeen?: number;
  catalogPagesDemoted?: number;
  detailPages?: number;
  pagesFetched?: number;
  pagesFetchFailed?: number;
  /** Stage 2A.2 */
  searchPasses?: number;
  opportunityCount?: number;
  topOpportunities?: number;
  needsResearch?: number;
  sourceCatalogs?: number;
  rejected?: number;
  overBudget?: number;
  unknownPrice?: number;
};

export type LiaOiBucketCounts = {
  TOP_OPPORTUNITIES: number;
  NEEDS_RESEARCH: number;
  SOURCE_CATALOGS: number;
  REJECTED: number;
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
  stubMode: boolean;
  searchMode: "stub" | "live";
  providerLabel: string;
  generatedAt: string;
};
