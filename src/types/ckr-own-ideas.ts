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

export type OwnIdeaProvenance = {
  kind: OwnIdeaClaimKind;
  sourceType: string;
  sourceUrl: string | null;
  sourceLabel: string;
  fetchedAt: string | null;
  verifiedAt: string | null;
  trustLevel: OwnIdeaTrust;
  corroborating?: Array<{ sourceLabel: string; sourceUrl: string | null }>;
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
};

export type OwnIdeaCatalog = {
  signals: OwnIdeaSignal[];
  internalResources: OwnIdeaSignal[];
  externalResources: OwnIdeaSignal[];
};
