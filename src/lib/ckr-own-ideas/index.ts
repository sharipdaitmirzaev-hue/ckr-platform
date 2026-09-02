export { CKR_OWN_IDEAS_BUDGETS, CKR_OWN_IDEAS_FORBIDDEN } from "@/config/ckr-own-ideas";
export { applyOwnerAction, runOwnIdeaBuilder } from "@/lib/ckr-own-ideas/builder";
export { pairFits, signalsFit, titleOverlap } from "@/lib/ckr-own-ideas/fit";
export {
  buildOwnIdeaCatalog,
  isGenericFinancingPage,
  isPlaceholderSource,
  oiCandidateToSignal,
  resolveOwnIdeaCatalogMode,
} from "@/lib/ckr-own-ideas/live-catalog";
export {
  computeRoughEconomics,
  formatMoneyRu,
  formatPaybackMonths,
  hasGuaranteedProfitWording,
  isNegativeEconomics,
} from "@/lib/ckr-own-ideas/economics";
export {
  ideaFingerprintFromComponents,
  ideaFingerprintFromSignals,
} from "@/lib/ckr-own-ideas/fingerprint";
export { FINANCING_SAFE_WORDING, searchFinancing } from "@/lib/ckr-own-ideas/financing";
export {
  landTourismCatalog,
  missingFinancingCatalog,
  negativeEconomicsCatalog,
  procurementCatalog,
  tractorEarthworksCatalog,
  internalCapitalCatalog,
} from "@/lib/ckr-own-ideas/fixtures";
export { assertNoAutoActions, assertOwnerOnly, forbiddenFlags } from "@/lib/ckr-own-ideas/guards";
export {
  classifyOwnIdeaPageType,
  geoCompatibility,
  industryCompatibility,
  isExpiredOpportunity,
  normalizeOwnIdeaGeo,
  pairCompatibility,
  passesMinIdeaGate,
  validateDetailFields,
} from "@/lib/ckr-own-ideas/quality-gate";
export { rateOwnIdea } from "@/lib/ckr-own-ideas/rating";
export {
  createOwnIdeaRunBudget,
  snapshotBudget,
  totalExternalCalls,
} from "@/lib/ckr-own-ideas/run-budget";
export { findMissingResource, searchInternalFirst } from "@/lib/ckr-own-ideas/search";
export { ideaToRow, rowToIdea } from "@/lib/ckr-own-ideas/mappers";
export {
  getOwnIdeaStore,
  hasOwnIdeasSecretEnv,
  isOwnIdeasProductionEnv,
  memoryOwnIdeaStore,
  resolveOwnIdeaStoreMode,
} from "@/lib/ckr-own-ideas/store";
export { createSupabaseOwnIdeaStore } from "@/lib/ckr-own-ideas/supabase-store";
