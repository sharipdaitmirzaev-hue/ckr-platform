/** Personalized Feed «Для вас» — Stage 4B types. */

import type { NeedIntentType, NeedProfile } from "@/types/need-profile";

export const FEED_ITEM_TYPES = [
  "project",
  "opportunity",
  "investment_offer",
  "expert",
  "need_profile",
  "lia_oi",
  "business_graph_node",
] as const;
export type FeedItemType = (typeof FEED_ITEM_TYPES)[number];

export const FEED_ACTIONS = [
  "interested",
  "not_interested",
  "saved",
  "open",
  "assigned_to_lia",
  "impression",
] as const;
export type FeedAction = (typeof FEED_ACTIONS)[number];

export type IntentCoverage = "FULL" | "PARTIAL" | "UNSUPPORTED";

export type FeedSourceChannel = "internal" | "external";

export type FeedCandidate = {
  id: string;
  itemType: FeedItemType;
  title: string;
  summary?: string;
  region: string | null;
  regions?: string[];
  industry: string | null;
  industries?: string[];
  price: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  priceKnown: boolean;
  currency: string;
  status: string;
  sourceChannel: FeedSourceChannel;
  sourceLabel: string;
  sourceKey: string;
  href: string;
  fingerprint?: string | null;
  canonicalUrl?: string | null;
  dataQuality: number;
  sourceConfidence: number;
  updatedAt: string | null;
  createdAt: string | null;
  deadlineAt?: string | null;
  rawType?: string | null;
  visibility?: string | null;
  unknownFields: string[];
  confirmedFields: string[];
};

export type ScoreBreakdown = {
  intentCompatibility: number;
  budgetFit: number;
  regionFit: number;
  industryFit: number;
  dataQuality: number;
  freshness: number;
  sourceConfidence: number;
  total: number;
};

export type FeedExplanation = {
  needSummary: string;
  matched: string[];
  toVerify: string[];
  notes: string[];
  why: string;
};

export type FeedRecommendation = {
  recommendationId: string;
  recommendationForNeedProfileId: string;
  needIntentType: NeedIntentType;
  candidate: FeedCandidate;
  score: number;
  breakdown: ScoreBreakdown;
  explanation: FeedExplanation;
};

export type FeedDiagnostics = {
  needProfileId: string | null;
  intentType: NeedIntentType | null;
  coverage: IntentCoverage;
  candidateCount: number;
  filteredCount: number;
  recommendedCount: number;
  unknownPriceCount: number;
  unknownRegionCount: number;
  internalCount: number;
  externalCount: number;
  dedupCount: number;
  scoreDistribution: {
    min: number;
    max: number;
    avg: number;
    buckets: Record<string, number>;
  };
  top: Array<{
    title: string;
    score: number;
    breakdown: ScoreBreakdown;
    explanation: FeedExplanation;
    itemType: FeedItemType;
    sourceLabel: string;
  }>;
};

export type FeedResult = {
  ownerId: string;
  needs: NeedProfile[];
  selectedNeedId: string | null;
  recommendations: FeedRecommendation[];
  diagnostics: FeedDiagnostics;
  coverageByIntent: Record<string, IntentCoverage>;
};

export type FeedFeedbackEvent = {
  id: string;
  userId: string;
  needProfileId: string | null;
  itemType: FeedItemType;
  itemId: string;
  action: FeedAction;
  score: number | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};
