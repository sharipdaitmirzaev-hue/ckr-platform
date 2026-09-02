/**
 * Stage 4Q — Собственные идеи ЦКР.
 * Internal analytic object. OWNER_ONLY. Not a project until owner creates one.
 */

export const OWN_IDEA_ELEMENT_KINDS = [
  "ASSET",
  "DEMAND",
  "SUPPLY",
  "CAPITAL",
  "LOCATION",
  "TEAM",
  "MARKET",
  "PERMIT",
  "OTHER",
] as const;
export type OwnIdeaElementKind = (typeof OWN_IDEA_ELEMENT_KINDS)[number];

export const OWN_IDEA_RATINGS = [
  "promising",
  "needs_check",
  "missing_data",
  "weak",
] as const;
export type OwnIdeaRating = (typeof OWN_IDEA_RATINGS)[number];

export const OWN_IDEA_OWNER_STATES = [
  "DRAFT",
  "REVIEW",
  "ACCEPTED",
  "RESEARCH",
  "DEFERRED",
  "REJECTED",
  "PROJECT_CREATED",
] as const;
export type OwnIdeaOwnerState = (typeof OWN_IDEA_OWNER_STATES)[number];

export const OWN_IDEA_CLAIM_KINDS = ["FACT", "INFERENCE", "UNKNOWN"] as const;
export type OwnIdeaClaimKind = (typeof OWN_IDEA_CLAIM_KINDS)[number];

/** Stage 4Q.3 — page class for an external result. Only DETAIL may become an idea FACT. */
export const OWN_IDEA_PAGE_TYPES = [
  "DETAIL",
  "LISTING",
  "CATEGORY",
  "SEARCH_RESULTS",
  "MIRROR",
  "LANDING",
  "UNKNOWN",
] as const;
export type OwnIdeaPageType = (typeof OWN_IDEA_PAGE_TYPES)[number];

export const OWN_IDEA_GEO_COMPAT = [
  "SAME_REGION",
  "NEAR_REGION",
  "CROSS_REGION_EXPLICIT",
  "INCOMPATIBLE",
  "UNKNOWN",
] as const;
export type OwnIdeaGeoCompatibility = (typeof OWN_IDEA_GEO_COMPAT)[number];

export const OWN_IDEA_FINANCE_KINDS = [
  "INTERNAL_CAPITAL",
  "LOAN",
  "LEASING",
  "INVESTOR",
  "GRANT",
  "SUBSIDY",
] as const;
export type OwnIdeaFinanceKind = (typeof OWN_IDEA_FINANCE_KINDS)[number];

export const OWN_IDEA_SOURCE_QUALITY = [
  "OFFICIAL_PRIMARY",
  "OFFICIAL_DETAIL",
  "AGGREGATOR_DETAIL",
  "OTHER",
] as const;
export type OwnIdeaSourceQuality = (typeof OWN_IDEA_SOURCE_QUALITY)[number];

export type OwnIdeaGeo = {
  country: "ru" | null;
  federalDistrict: string | null;
  subject: string | null;
  city: string | null;
  raw: string | null;
};

export const OWN_IDEA_TRUST = [
  "ckr_internal",
  "official",
  "government_open",
  "regional_portal",
  "company_website",
  "trusted_secondary",
  "general_web",
  "search_snippet",
  "owner_edit",
] as const;
export type OwnIdeaTrust = (typeof OWN_IDEA_TRUST)[number];

export const OWN_IDEA_EVENTS = [
  "idea_created",
  "signal_added",
  "resource_found",
  "resource_missing",
  "economics_updated",
  "owner_reviewed",
  "owner_rejected",
  "owner_requested_research",
  "owner_accepted",
  "owner_deferred",
  "owner_asked_refine",
  "owner_created_project",
  "rediscovery_updated",
] as const;
export type OwnIdeaEventType = (typeof OWN_IDEA_EVENTS)[number];

export type OwnIdeaVerificationStatus = "VERIFIED" | "UNVERIFIED" | "REJECTED";

/** Stage 4Q.4 — one extracted field with explicit provenance. Absence is omitted, never invented. */
export type OwnIdeaFactField = {
  field: string;
  value: string | number | null;
  sourceUrl: string | null;
  canonicalUrl: string | null;
  sourceDomain: string | null;
  fetchedAt: string | null;
  publishedAt: string | null;
  sourceType: string;
  confidence: number;
  verificationStatus: OwnIdeaVerificationStatus;
  kind: OwnIdeaClaimKind;
};

export type OwnIdeaProvenance = {
  kind: OwnIdeaClaimKind;
  sourceType: string;
  sourceUrl: string | null;
  sourceLabel: string;
  fetchedAt: string | null;
  verifiedAt: string | null;
  trustLevel: OwnIdeaTrust;
  corroborating?: Array<{ sourceLabel: string; sourceUrl: string | null }>;
  fields?: OwnIdeaFactField[];
  sourceDomain?: string | null;
  verificationStatus?: OwnIdeaVerificationStatus;
  confidence?: number;
};

export type OwnIdeaMoney = {
  amount: number | null;
  currency: "RUB";
  kind: OwnIdeaClaimKind;
  note?: string;
  provenance?: OwnIdeaProvenance;
};

export type OwnIdeaComponent = {
  id: string;
  kind: OwnIdeaElementKind;
  title: string;
  origin: "INTERNAL_CKR" | "EXTERNAL";
  identityKey: string | null;
  officialId: string | null;
  canonicalUrl: string | null;
  amount: OwnIdeaMoney | null;
  found: boolean;
  requiresCheck: boolean;
  provenance: OwnIdeaProvenance;
  pageType?: OwnIdeaPageType;
  financeKind?: OwnIdeaFinanceKind | null;
  financeAvailability?: "KNOWN" | "UNKNOWN";
};

export type OwnIdeaMissing = {
  kind: OwnIdeaElementKind;
  reason: string;
  searchedInternal: boolean;
  searchedExternal: boolean;
};

export type OwnIdeaEconomics = {
  capex: OwnIdeaMoney;
  workingCapital: OwnIdeaMoney;
  financing: OwnIdeaMoney;
  revenue: OwnIdeaMoney;
  variableCosts: OwnIdeaMoney;
  fixedCosts: OwnIdeaMoney;
  financingCost: OwnIdeaMoney;
  profit: OwnIdeaMoney;
  marginPct: OwnIdeaMoney;
  paybackMonths: OwnIdeaMoney;
  scenarios: {
    conservative: OwnIdeaMoney;
    base: OwnIdeaMoney;
    optimistic: OwnIdeaMoney;
  } | null;
  unknownCount: number;
  disclaimer: string;
};

export type OwnIdeaEvent = {
  id: string;
  type: OwnIdeaEventType;
  at: string;
  actor: "system" | "owner";
  note: string;
};

export type CkrOwnIdea = {
  id: string;
  title: string;
  essence: string;
  whyNoticed: string;
  rating: OwnIdeaRating;
  ownerState: OwnIdeaOwnerState;
  visibility: "OWNER_ONLY";
  components: OwnIdeaComponent[];
  missing: OwnIdeaMissing[];
  economics: OwnIdeaEconomics;
  risks: string[];
  nextChecks: string[];
  fingerprint: string;
  ownerLockedFields: string[];
  projectId: string | null;
  runId: string;
  marker: string | null;
  createdAt: string;
  updatedAt: string;
  events: OwnIdeaEvent[];
};

export type OwnIdeaRunMetrics = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  queries: number;
  results: number;
  enrichments: number;
  sources: string[];
  ideasGenerated: number;
  ideasRejected: number;
  ideasUpdated: number;
  internalSearches: number;
  externalCalls: number;
  depthReached: number;
  stopReason: string;
  costEstimate: number | null;
  clientRequestUsed: false;
  autoPublish: false;
  autoOutreach: false;
  matchingEdges: false;
  scheduler: false;
  persistStatus?: "running" | "ok" | "partial" | "failed";
  persistError?: string | null;
  ideasPersisted?: number;
  catalogMode?: "live" | "empty" | "injected" | "fixture";
  pairsRejected?: number;
  realSignals?: number;
  rejectedSignals?: number;
  /** Stage 4Q.3 — transparent per-layer budget (hard cap is the sum, not per layer). */
  catalogSearches?: number;
  builderSearches?: number;
  catalogExternalCalls?: number;
  builderExternalCalls?: number;
  totalExternalCalls?: number;
  /** Stage 4Q.4 — discovery → DETAIL acquisition (snippet is not a FACT). */
  discoveryCandidates?: number;
  detailResolutionAttempts?: number;
  officialDetailsResolved?: number;
  aggregatorCandidates?: number;
  aggregatorToOfficialResolved?: number;
  detailValidationRejected?: number;
  liveFacts?: number;
  budgetExhausted?: boolean;
};

export type OwnIdeaSignal = {
  id: string;
  kind: OwnIdeaElementKind;
  title: string;
  origin: "INTERNAL_CKR" | "EXTERNAL";
  identityKey?: string | null;
  officialId?: string | null;
  canonicalUrl?: string | null;
  amount?: number | null;
  claimKind?: OwnIdeaClaimKind;
  sourceType?: string;
  sourceLabel?: string;
  sourceUrl?: string | null;
  trustLevel?: OwnIdeaTrust;
  region?: string | null;
  industry?: string | null;
  tags?: string[];
  pageType?: OwnIdeaPageType;
  customer?: string | null;
  publishedAt?: string | null;
  deadlineAt?: string | null;
  status?: string | null;
  objectTitle?: string | null;
  location?: string | null;
  provider?: string | null;
  applicability?: string | null;
  freshness?: string | null;
  priceUnknown?: boolean;
  sourceQuality?: OwnIdeaSourceQuality;
  financeKind?: OwnIdeaFinanceKind | null;
  financeAvailability?: "KNOWN" | "UNKNOWN";
  geo?: OwnIdeaGeo;
  crossRegionJustified?: boolean;
  /** Required when crossRegionJustified — logistic/economic transferability. */
  crossRegionReason?: string | null;
  factFields?: OwnIdeaFactField[];
  sourceDomain?: string | null;
  fetchedAt?: string | null;
  verificationStatus?: OwnIdeaVerificationStatus;
  confidence?: number;
  /** True only after official/page resolution — never for a raw Serper snippet. */
  detailResolved?: boolean;
};

export type OwnIdeaCatalog = {
  signals: OwnIdeaSignal[];
  internalResources: OwnIdeaSignal[];
  externalResources: OwnIdeaSignal[];
};
