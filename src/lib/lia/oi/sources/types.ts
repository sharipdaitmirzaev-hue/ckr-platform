/**
 * Stage 2C — OpportunitySourceAdapter contract.
 * Specialized sources return the common OpportunityCandidate model.
 * Serper remains the general discovery provider (InternetSearchProvider).
 */

import type {
  LiaOiCandidate,
  LiaOiSearchPlan,
  LiaOiSourceCategory,
  LiaOiSourceClass,
} from "@/types/lia-oi";

export type LiaOiSourceHealthStatus = "OK" | "DEGRADED" | "UNAVAILABLE";

export type LiaOiSourceAdapterId =
  | "serper_general"
  | "auction_assets"
  | "procurement"
  | "support_programs";

export type LiaOiOpportunityType =
  | "WEB_LISTING"
  | "AUCTION_ASSET"
  | "PROCUREMENT"
  | "SUPPORT_PROGRAM"
  | "GOVERNMENT_ASSET"
  | "REGIONAL_INVESTMENT"
  | "OTHER";

export type LiaOiSourceBudgets = {
  maxRequestsPerRun: number;
  timeoutMs: number;
  maxRetries: number;
  maxResultsPerRun: number;
};

export type LiaOiSourceAdapterQuery = {
  rawQuery: string;
  plan: LiaOiSearchPlan;
  userId: string;
  /** stub | live from OI mode */
  mode: "stub" | "live";
};

export type LiaOiSourceAdapterResult = {
  adapterId: LiaOiSourceAdapterId;
  label: string;
  health: LiaOiSourceHealthStatus;
  durationMs: number;
  rawCount: number;
  normalizedCount: number;
  candidates: LiaOiCandidate[];
  error?: string | null;
  /** Official domains / registry used */
  official: boolean;
  transport: "fixture" | "serper_site" | "http_api";
};

export type OpportunitySourceAdapter = {
  id: LiaOiSourceAdapterId;
  label: string;
  category: LiaOiSourceCategory;
  sourceClass: LiaOiSourceClass;
  opportunityType: LiaOiOpportunityType;
  official: boolean;
  budgets: LiaOiSourceBudgets;
  /** Whether this adapter should run for the given owner query/plan */
  matches: (query: LiaOiSourceAdapterQuery) => boolean;
  search: (query: LiaOiSourceAdapterQuery) => Promise<LiaOiSourceAdapterResult>;
  healthcheck: () => Promise<LiaOiSourceHealthStatus>;
};

export type LiaOiAdapterRunStat = {
  adapterId: LiaOiSourceAdapterId;
  label: string;
  health: LiaOiSourceHealthStatus;
  durationMs: number;
  rawCount: number;
  normalizedCount: number;
  error?: string | null;
  official: boolean;
  transport: string;
};
