/** Business Graph — Stage 3A domain types (foundation only). */

export const BUSINESS_NODE_TYPES = [
  "CAPITAL",
  "PROJECT",
  "BUSINESS",
  "ASSET",
  "PROPERTY",
  "EQUIPMENT",
  "SUPPLY",
  "DEMAND",
  "PARTNER",
  "EXPERTISE",
  "SUPPORT",
  "LICENSE",
  "INFRASTRUCTURE",
  "MARKET_SIGNAL",
  "OPPORTUNITY",
  "CONTRACT",
  "COMPANY",
  "PERSON",
  "LOCATION",
] as const;
export type BusinessNodeType = (typeof BUSINESS_NODE_TYPES)[number] | (string & {});

export const BUSINESS_RELATIONSHIP_TYPES = [
  "CAN_FINANCE",
  "CAN_INVEST_IN",
  "CAN_PARTNER_WITH",
  "REQUIRES",
  "REQUIRED_BY",
  "SUPPLIES",
  "BUYS",
  "LOCATED_IN",
  "SUITABLE_FOR",
  "SUPPORTED_BY",
  "DEPENDS_ON",
  "COMPETES_WITH",
  "COMPLEMENTS",
  "CAN_MANAGE",
  "CAN_SELL_TO",
  "CAN_BUY_FROM",
  "RELATED_TO",
  "DERIVED_FROM",
  "CONFIRMS",
  "CONTRADICTS",
  "OWNS",
  "OPERATES",
  "NEEDS",
  "HAS",
  "SERVES",
  "MATCHES",
  "CREATES_DEMAND_FOR",
] as const;
export type BusinessRelationshipType =
  | (typeof BUSINESS_RELATIONSHIP_TYPES)[number]
  | (string & {});

export const BUSINESS_PROVENANCE_TYPES = [
  "FACT",
  "INFERENCE",
  "ESTIMATE",
  "UNKNOWN",
] as const;
export type BusinessProvenanceType =
  (typeof BUSINESS_PROVENANCE_TYPES)[number];

export const BUSINESS_VISIBILITY = [
  "PUBLIC",
  "USER",
  "INTERNAL",
  "OWNER_ONLY",
] as const;
export type BusinessVisibility = (typeof BUSINESS_VISIBILITY)[number];

export const BUSINESS_MATCH_CLASSES = ["HARD", "SOFT", "HYPOTHESIS"] as const;
export type BusinessMatchClass = (typeof BUSINESS_MATCH_CLASSES)[number];

export const BUSINESS_EDGE_STATUSES = [
  "PROPOSED",
  "ACTIVE",
  "CONFIRMED",
  "REJECTED",
  "ARCHIVED",
] as const;
export type BusinessEdgeStatus = (typeof BUSINESS_EDGE_STATUSES)[number];

export const BUSINESS_ACTOR_KINDS = ["SYSTEM", "LIA", "OWNER", "USER"] as const;
export type BusinessActorKind = (typeof BUSINESS_ACTOR_KINDS)[number];

export const BUSINESS_GRAPH_EVENT_TYPES = [
  "NODE_CREATED",
  "NODE_UPDATED",
  "EDGE_CREATED",
  "EDGE_UPDATED",
  "EDGE_CONFIRMED",
  "EDGE_REJECTED",
  "IDENTITY_MERGED",
  "ALIAS_ADDED",
  "OWNER_COMMENT",
] as const;
export type BusinessGraphEventType =
  (typeof BUSINESS_GRAPH_EVENT_TYPES)[number];

export type BusinessNode = {
  id: string;
  nodeType: BusinessNodeType;
  title: string;
  description: string;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceUrl?: string | null;
  internalEntityType?: string | null;
  internalEntityId?: string | null;
  country: string;
  region?: string | null;
  city?: string | null;
  locationData?: Record<string, unknown>;
  status: "ACTIVE" | "ARCHIVED" | "MERGED" | "DRAFT";
  visibility: BusinessVisibility;
  structuredData: Record<string, unknown>;
  /** Authenticity/reliability of source data — NOT opportunity score */
  dataConfidence: number;
  dataQualityScore: number;
  /** Economic attractiveness — separate from confidence */
  opportunityAttractiveness?: number | null;
  fingerprint?: string | null;
  mergedIntoId?: string | null;
  createdAt: string;
  updatedAt: string;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type BusinessEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: BusinessRelationshipType;
  /** Relationship confidence — NOT data confidence */
  confidence: number;
  strength?: number | null;
  status: BusinessEdgeStatus;
  /** Prep for Matching Engine; unused by Stage 3A automation */
  matchClass?: BusinessMatchClass | null;
  provenanceType: BusinessProvenanceType;
  reasoningSummary: string;
  source?: string | null;
  sourceUrl?: string | null;
  createdByKind: BusinessActorKind;
  createdByUserId?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  isCurrent: boolean;
  ownerComment?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessAlias = {
  id: string;
  nodeId: string;
  alias: string;
  normalizedAlias: string;
  source?: string | null;
  confidence: number;
  createdAt: string;
};

export type BusinessNodeSource = {
  id: string;
  nodeId: string;
  sourceType: string;
  sourceId?: string | null;
  sourceUrl?: string | null;
  title?: string | null;
  snippet?: string | null;
  isPrimary: boolean;
  meta: Record<string, unknown>;
  createdAt: string;
};

export type BusinessGraphEvent = {
  id: string;
  eventType: BusinessGraphEventType;
  nodeId?: string | null;
  edgeId?: string | null;
  payload: Record<string, unknown>;
  actorKind: BusinessActorKind;
  actorUserId?: string | null;
  createdAt: string;
};

export type CreateNodeInput = {
  nodeType: BusinessNodeType;
  title: string;
  description?: string;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceUrl?: string | null;
  internalEntityType?: string | null;
  internalEntityId?: string | null;
  country?: string;
  region?: string | null;
  city?: string | null;
  locationData?: Record<string, unknown>;
  status?: BusinessNode["status"];
  visibility?: BusinessVisibility;
  structuredData?: Record<string, unknown>;
  dataConfidence?: number;
  dataQualityScore?: number;
  opportunityAttractiveness?: number | null;
  fingerprint?: string | null;
};

export type CreateEdgeInput = {
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: BusinessRelationshipType;
  confidence?: number;
  strength?: number | null;
  status?: BusinessEdgeStatus;
  matchClass?: BusinessMatchClass | null;
  provenanceType?: BusinessProvenanceType;
  reasoningSummary?: string;
  source?: string | null;
  sourceUrl?: string | null;
  createdByKind?: BusinessActorKind;
  createdByUserId?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  isCurrent?: boolean;
};
