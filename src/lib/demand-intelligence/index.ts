/**
 * Stage 4M — Demand Intelligence public API.
 * No Matching Engine. No new DB tables required.
 */

export {
  buildDemandQueryPlan,
  primaryDemandQuery,
  type DemandQueryPlan,
} from "@/lib/demand-intelligence/query-planner";
export {
  evaluateDemandQuality,
  demandTierLabelRu,
  DEMAND_QUALITY_TIERS,
  type DemandQualityTier,
  type DemandQualityResult,
} from "@/lib/demand-intelligence/quality";
export {
  detectProductTags,
  productFitScore,
  expandProductTag,
  PRODUCT_ALIASES,
} from "@/lib/demand-intelligence/product-vocab";
export {
  runDemandDiscoveryForNeed,
  formatDiscoverySummaryRu,
  type DemandDiscoverySummary,
} from "@/lib/demand-intelligence/discovery";
export {
  getDemandWorkbench,
  type DemandWorkbenchItem,
  type DemandWorkbenchResult,
} from "@/lib/demand-intelligence/workbench";
export { buildDemandClientShareMessage } from "@/lib/demand-intelligence/client-copy";
