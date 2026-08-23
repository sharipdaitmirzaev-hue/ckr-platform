export { CKR_OWN_IDEAS_BUDGETS, CKR_OWN_IDEAS_FORBIDDEN } from "@/config/ckr-own-ideas";
export { applyOwnerAction, runOwnIdeaBuilder } from "@/lib/ckr-own-ideas/builder";
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
export { rateOwnIdea } from "@/lib/ckr-own-ideas/rating";
export { findMissingResource, searchInternalFirst } from "@/lib/ckr-own-ideas/search";
export { getOwnIdeaStore, memoryOwnIdeaStore } from "@/lib/ckr-own-ideas/store";
