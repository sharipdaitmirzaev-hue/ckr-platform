/**
 * Stage 4O — Opportunity Discovery & Intelligence (domain contracts).
 * Compute layer only. No Matching Engine. No Scheduler.
 */

/** Discovery modes — same adapters, different entry UX. */
export const DISCOVERY_MODES = ["REQUEST_DRIVEN", "MARKET_DRIVEN"] as const;
export type DiscoveryMode = (typeof DISCOVERY_MODES)[number];

/**
 * Extensible source / opportunity categories (text catalog, not PG enum).
 */
export const DISCOVERY_SOURCE_CATEGORIES = [
  "PROCUREMENT",
  "SUPPORT",
  "BUSINESS_FOR_SALE",
  "INVESTMENT_PROJECT",
  "PROPERTY",
  "LAND",
  "EQUIPMENT",
  "SUPPLIER_REQUEST",
  "BUYER_DEMAND",
  "PARTNERSHIP",
  "COMPANY",
  "EXPERT",
  "INFRASTRUCTURE",
  "CAPITAL",
  "MARKET_SIGNAL",
  "OTHER",
] as const;
export type DiscoverySourceCategory =
  (typeof DISCOVERY_SOURCE_CATEGORIES)[number];

/** Underlying entity — never dump everything into opportunities. */
export const DISCOVERY_ENTITY_TYPES = [
  "organization",
  "need_profile",
  "project",
  "opportunity",
  "investment_offer",
  "expert_profile",
  "lia_oi",
  "external_signal",
] as const;
export type DiscoveryEntityType = (typeof DISCOVERY_ENTITY_TYPES)[number];

export const DISCOVERY_ORIGIN = ["INTERNAL_CKR", "EXTERNAL"] as const;
export type DiscoveryOrigin = (typeof DISCOVERY_ORIGIN)[number];

export const PROVENANCE_TRUST = [
  "ckr_internal",
  "official",
  "government_open",
  "regional_portal",
  "company_website",
  "trusted_secondary",
  "general_web",
  "search_snippet",
] as const;
export type ProvenanceTrust = (typeof PROVENANCE_TRUST)[number];

export const PROVENANCE_KIND = ["FACT", "INFERENCE", "UNKNOWN"] as const;
export type ProvenanceKind = (typeof PROVENANCE_KIND)[number];

/** Owner-facing suitability — never claim MATCH. */
export const SUITABILITY_LABELS = [
  "SUITABLE",
  "POSSIBLE",
  "NEEDS_CHECK",
  "WEAK",
  "NOT_SUITABLE",
] as const;
export type SuitabilityLabel = (typeof SUITABILITY_LABELS)[number];

export const DATA_REALNESS = [
  "REAL",
  "SEED",
  "SMOKE",
  "STUB",
  "DEMO",
  "UNKNOWN",
] as const;
export type DataRealness = (typeof DATA_REALNESS)[number];

/**
 * Per-request candidate review (owner). Derived from events when possible;
 * no new table in Stage 4O MVP.
 */
export const CANDIDATE_REVIEW_STATES = [
  "NEW",
  "CHECKING",
  "NEED_CLIENT_INFO",
  "SUITABLE",
  "NOT_SUITABLE",
  "SHARED",
  "ACTED_ON",
] as const;
export type CandidateReviewState = (typeof CANDIDATE_REVIEW_STATES)[number];

export const CLIENT_FEEDBACK_ACTIONS = [
  "INTERESTED",
  "NOT_SUITABLE",
  "WANT_DETAILS",
] as const;
export type ClientFeedbackAction = (typeof CLIENT_FEEDBACK_ACTIONS)[number];

export type OpportunitySearchContext = {
  mode: DiscoveryMode;
  /** Confirmed structured fields only — UNKNOWN stays null/empty. */
  intent: string | null;
  region: string | null;
  city: string | null;
  industry: string | null;
  productsServices: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  amountNeeded: number | null;
  assetType: string | null;
  projectType: string | null;
  desiredPartner: string | null;
  keywords: string[];
  organizationId: string | null;
  organizationContext: string | null;
  knownCapabilities: string[];
  excludedCategories: string[];
  sourcePreferences: DiscoverySourceCategory[];
  requestId: string | null;
  needProfileId: string | null;
  /** Free-text owner query for market-driven / manual. */
  freeText: string | null;
};

export type DiscoveryProvenance = {
  origin: DiscoveryOrigin;
  trust: ProvenanceTrust;
  kind: ProvenanceKind;
  sourceLabelRu: string;
  sourceUrl: string | null;
  adapterId: string | null;
};

export type DiscoveryCandidate = {
  id: string;
  entityType: DiscoveryEntityType;
  sourceCategory: DiscoverySourceCategory;
  sourceEntityId: string;
  title: string;
  summary: string;
  region: string | null;
  industry: string | null;
  amount: number | null;
  deadline: string | null;
  organization: string | null;
  url: string | null;
  href: string;
  confidence: number;
  quality: number;
  suitability: SuitabilityLabel;
  suitabilityLabelRu: string;
  provenance: DiscoveryProvenance;
  whyRelevant: string[];
  unknownFields: string[];
  visibility: "OWNER_ONLY" | "STAFF" | "CLIENT_SHAREABLE";
  reviewState: CandidateReviewState;
  realness: DataRealness;
  pass: "INTERNAL" | "OFFICIAL" | "TRUSTED_SECONDARY" | "GENERAL_WEB";
};

export type DiscoveryPassId =
  | "PASS_1_INTERNAL"
  | "PASS_2_OFFICIAL"
  | "PASS_3_TRUSTED_SECONDARY"
  | "PASS_4_GENERAL_WEB";

export type DiscoverySearchPlan = {
  mode: DiscoveryMode;
  contextFingerprint: string;
  passes: Array<{
    id: DiscoveryPassId;
    labelRu: string;
    enabled: boolean;
    requiresOwnerAction: boolean;
    sources: string[];
  }>;
  primaryQuery: string;
  queryVariants: string[];
  costBudget: DiscoveryCostBudget;
};

export type DiscoveryCostBudget = {
  maxInternalSources: number;
  maxExternalQueries: number;
  maxDetailAttempts: number;
  maxNewCandidates: number;
};

export type DiscoveryRunMetrics = {
  mode: DiscoveryMode;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  internalSources: number;
  externalQueries: number;
  results: number;
  detailAttempts: number;
  detailSuccess: number;
  newCandidates: number;
  duplicates: number;
  good: number;
  acceptable: number;
  weak: number;
  rejected: number;
  real: number;
  seed: number;
  smoke: number;
  stub: number;
  autoPublish: false;
  autoOutreach: false;
  matchingEngine: false;
  scheduler: false;
};

export type DiscoveryRunResult = {
  plan: DiscoverySearchPlan;
  context: OpportunitySearchContext;
  internal: DiscoveryCandidate[];
  external: DiscoveryCandidate[];
  /** Deduped merged list: internal first. */
  candidates: DiscoveryCandidate[];
  metrics: DiscoveryRunMetrics;
  internalSufficient: boolean;
  externalRan: boolean;
  noteRu: string;
};

/** Raw rows for injectable internal catalog (tests + live). */
export type InternalCatalogRow = {
  entityType: DiscoveryEntityType;
  id: string;
  title: string;
  summary?: string | null;
  region?: string | null;
  industry?: string | null;
  amount?: number | null;
  deadline?: string | null;
  organization?: string | null;
  url?: string | null;
  href: string;
  keywords?: string[];
  inn?: string | null;
  ogrn?: string | null;
  domain?: string | null;
  noticeId?: string | null;
  sourceType?: string | null;
  status?: string | null;
  isStub?: boolean;
  fingerprint?: string | null;
};
