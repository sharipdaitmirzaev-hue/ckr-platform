/**
 * Stage 4C — Controlled Publish: LIA OI → user-safe marketplace opportunities.
 * Private intelligence ≠ public opportunity. Not Matching Engine.
 */

import type { PublishStatus } from "@/types";

/** Owner-facing publication workflow on LIA OI rows. */
export const LIA_PUBLICATION_STATES = [
  "none",
  "queued",
  "rejected",
  "published",
  "change_review",
  "archived",
] as const;
export type LiaPublicationState = (typeof LIA_PUBLICATION_STATES)[number];

export const LIA_PUBLICATION_ACTIONS = [
  "queue",
  "approve_publish",
  "reject",
  "edit_draft",
  "request_recheck",
  "apply_changes",
  "reject_changes",
  "archive",
  "rediscovery_update",
] as const;
export type LiaPublicationAction = (typeof LIA_PUBLICATION_ACTIONS)[number];

/** Marketplace opportunity categories added for published LIA intelligence. */
export const LIA_PUBLISH_OPPORTUNITY_TYPES = [
  "support_program",
  "procurement",
  "auction_asset",
] as const;
export type LiaPublishOpportunityType =
  (typeof LIA_PUBLISH_OPPORTUNITY_TYPES)[number];

/** Explicit allowlist — only these fields may leave OWNER_ONLY OI. */
export const PUBLIC_OPPORTUNITY_SAFE_FIELDS = [
  "title",
  "description",
  "type",
  "industry",
  "region",
  "city",
  "price",
  "amountKind",
  "currency",
  "deadlineAt",
  "officialUrl",
  "canonicalUrl",
  "sourceLabel",
  "fingerprint",
  "publishedAt",
] as const;
export type PublicOpportunitySafeField =
  (typeof PUBLIC_OPPORTUNITY_SAFE_FIELDS)[number];

/** Critical fields that require owner review on rediscovery delta. */
export const CRITICAL_PUBLIC_FIELDS = [
  "title",
  "price",
  "deadlineAt",
  "statusHint",
  "region",
  "type",
] as const;
export type CriticalPublicField = (typeof CRITICAL_PUBLIC_FIELDS)[number];

export type PublicOpportunityDraft = {
  title: string;
  description: string;
  /** Marketplace opportunity.type (support_program|procurement|auction_asset|…). */
  type: string;
  industry: string | null;
  region: string;
  city: string;
  price: number | null;
  amountKind: string | null;
  currency: string;
  deadlineAt: string | null;
  officialUrl: string | null;
  canonicalUrl: string | null;
  sourceLabel: string;
  fingerprint: string | null;
  publishedAt: string | null;
  /** Internal provenance — not shown to end users as raw id. */
  sourceType: "lia_oi";
  sourceId: string;
  /** User-facing badge: «Найдено Лией» / «Внешняя возможность». */
  discoveryBadge: "Найдено Лией" | "Внешняя возможность";
  /** Why Lia considers useful — owner review only. */
  ownerWhyUseful: string[];
  dataQualityScore: number | null;
  matchingReadiness: string | null;
  confirmedFields: string[];
  unknownFields: string[];
  /** FACT closed / cancelled / expired from official source. */
  lifecycleHint: "active" | "closed" | "cancelled" | "expired" | "unknown";
};

export type PendingPublicChange = {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  critical: boolean;
  detectedAt: string;
};

export type PublicationEvent = {
  id: string;
  liaOiId: string;
  marketplaceOpportunityId: string | null;
  actorUserId: string | null;
  action: LiaPublicationAction;
  reason: string | null;
  beforeSnapshot: Record<string, unknown>;
  afterSnapshot: Record<string, unknown>;
  publicProjection: Record<string, unknown>;
  createdAt: string;
};

export type MarketplacePublishedOpportunity = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  type: string;
  region: string;
  city: string;
  price: number | null;
  currency: string;
  status: PublishStatus;
  sourceType: "lia_oi";
  sourceId: string;
  sourceUrl: string | null;
  canonicalUrl: string | null;
  sourceLabel: string;
  sourcePublishedAt: string | null;
  fingerprint: string | null;
  amountKind: string | null;
  deadlineAt: string | null;
  dataQualityScore: number | null;
  matchingReadiness: string | null;
  ownerEditedFields: string[];
  pendingSourceChanges: PendingPublicChange[] | null;
  publishedFromLiaAt: string | null;
  publishedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicationQueueItem = {
  liaOiId: string;
  publicationState: LiaPublicationState;
  marketplaceOpportunityId: string | null;
  draft: PublicOpportunityDraft;
  lockedFields: string[];
  pendingChanges: PendingPublicChange[];
  opportunityType: string | null;
  status: string;
  firstSeenAt: string;
  lastSeenAt: string;
  sourcesSummary: string[];
  officialUrl: string | null;
  /** Stage 4D — owner quality labels (computed). */
  publishabilityTier?: string | null;
  publishabilityScore?: number | null;
  qualityLabelRu?: string | null;
  pageType?: string | null;
  region?: string | null;
  industry?: string | null;
};

export type QualityGateResult = {
  ok: boolean;
  reasons: string[];
};
