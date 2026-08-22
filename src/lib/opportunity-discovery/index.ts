/**
 * Stage 4O — Opportunity Discovery public API.
 * No Matching Engine. No Scheduler. No auto-publish. No auto-outreach.
 * No new DB table required for MVP (review via ckr_request_events).
 */

export type {
  OpportunitySearchContext,
  DiscoveryCandidate,
  DiscoveryMode,
  DiscoveryRunResult,
  DiscoveryRunMetrics,
  DiscoverySearchPlan,
  DiscoverySourceCategory,
  DiscoveryEntityType,
  CandidateReviewState,
  ClientFeedbackAction,
  InternalCatalogRow,
  DataRealness,
  SuitabilityLabel,
} from "@/lib/opportunity-discovery/types";

export {
  DISCOVERY_MODES,
  DISCOVERY_SOURCE_CATEGORIES,
  DISCOVERY_ENTITY_TYPES,
  CANDIDATE_REVIEW_STATES,
  CLIENT_FEEDBACK_ACTIONS,
} from "@/lib/opportunity-discovery/types";

export {
  emptySearchContext,
  buildContextFromNeed,
  buildContextFromManual,
  fingerprintSearchContext,
  categoriesForIntent,
  contextToPrimaryQuery,
  contextToQueryTokens,
} from "@/lib/opportunity-discovery/search-context";

export {
  buildSearchPlan,
  buildQueryVariants,
  isInternalSufficient,
  DEFAULT_COST_BUDGET,
} from "@/lib/opportunity-discovery/plan";

export {
  suitabilityLabelRu,
  entityTypeLabelRu,
  sourceCategoryLabelRu,
  trustLabelRu,
  internalProvenance,
  externalProvenance,
  classifyRealness,
  isNoiseRealness,
  clientFacingCandidateCopy,
  rowToBaseCandidate,
} from "@/lib/opportunity-discovery/candidate";

export { scoreInternalRow, investmentQualityHints } from "@/lib/opportunity-discovery/scoring";
export { dedupeCandidates, identityKeys, titlesLookSimilar } from "@/lib/opportunity-discovery/dedup";
export { searchInternalCatalog } from "@/lib/opportunity-discovery/internal";
// loadInternalCatalogFromDb / runInternalSearch — server-only: import from
// @/lib/opportunity-discovery/internal-db (not from this barrel).
export { runExternalSearch, oiCandidateToDiscovery } from "@/lib/opportunity-discovery/external";
export {
  runDiscovery,
  runDiscoverySync,
  formatDiscoveryRunRu,
} from "@/lib/opportunity-discovery/run";
export {
  deriveReviewStateMap,
  applyReviewState,
  mapClientFeedback,
  REVIEW_WITHOUT_MIGRATION_NOTE,
} from "@/lib/opportunity-discovery/review-state";
export {
  OPPORTUNITY_BANK_BUCKETS,
  describeOpportunityBankApproach,
} from "@/lib/opportunity-discovery/bank";
export {
  SOURCE_ADAPTER_CATALOG,
  adaptersForCategories,
  sourceGapSummary,
} from "@/lib/opportunity-discovery/sources";
export {
  proposeCompanyFactsFromText,
  COMPANY_LEARNING_RULE,
} from "@/lib/opportunity-discovery/company-learning";
