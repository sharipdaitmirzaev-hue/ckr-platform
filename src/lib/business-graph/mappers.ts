/** Domain ↔ DB row mappers for business_graph_* tables. */

import type {
  BusinessActorKind,
  BusinessAlias,
  BusinessEdge,
  BusinessEdgeStatus,
  BusinessGraphEvent,
  BusinessGraphEventType,
  BusinessMatchClass,
  BusinessNode,
  BusinessNodeSource,
  BusinessProvenanceType,
  BusinessVisibility,
} from "@/types/business-graph";

export type BusinessNodeRow = {
  id: string;
  node_type: string;
  title: string;
  description: string;
  source_type: string | null;
  source_id: string | null;
  source_url: string | null;
  internal_entity_type: string | null;
  internal_entity_id: string | null;
  country: string;
  region: string | null;
  city: string | null;
  location_data: Record<string, unknown> | null;
  status: string;
  visibility: string;
  structured_data: Record<string, unknown> | null;
  data_confidence: number | string;
  data_quality_score: number | string;
  opportunity_attractiveness: number | string | null;
  fingerprint: string | null;
  merged_into_id: string | null;
  created_at: string;
  updated_at: string;
  first_seen_at: string;
  last_seen_at: string;
};

export type BusinessEdgeRow = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  confidence: number | string;
  strength: number | string | null;
  status: string;
  match_class: string | null;
  provenance_type: string;
  reasoning_summary: string;
  source: string | null;
  source_url: string | null;
  created_by_kind: string;
  created_by_user_id: string | null;
  valid_from: string | null;
  valid_to: string | null;
  is_current: boolean;
  owner_comment: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessAliasRow = {
  id: string;
  node_id: string;
  alias: string;
  normalized_alias: string;
  source: string | null;
  confidence: number | string;
  created_at: string;
};

export type BusinessNodeSourceRow = {
  id: string;
  node_id: string;
  source_type: string;
  source_id: string | null;
  source_url: string | null;
  title: string | null;
  snippet: string | null;
  is_primary: boolean;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export type BusinessGraphEventRow = {
  id: string;
  event_type: string;
  node_id: string | null;
  edge_id: string | null;
  payload: Record<string, unknown> | null;
  actor_kind: string;
  actor_user_id: string | null;
  created_at: string;
};

function num(v: number | string | null | undefined, fallback = 0): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function rowToNode(row: BusinessNodeRow): BusinessNode {
  return {
    id: row.id,
    nodeType: row.node_type,
    title: row.title,
    description: row.description || "",
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    internalEntityType: row.internal_entity_type,
    internalEntityId: row.internal_entity_id,
    country: row.country || "RU",
    region: row.region,
    city: row.city,
    locationData: row.location_data || {},
    status: row.status as BusinessNode["status"],
    visibility: row.visibility as BusinessVisibility,
    structuredData: row.structured_data || {},
    dataConfidence: num(row.data_confidence),
    dataQualityScore: num(row.data_quality_score),
    opportunityAttractiveness:
      row.opportunity_attractiveness === null ||
      row.opportunity_attractiveness === undefined
        ? null
        : num(row.opportunity_attractiveness),
    fingerprint: row.fingerprint,
    mergedIntoId: row.merged_into_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
  };
}

export function nodeToRow(node: BusinessNode): BusinessNodeRow {
  return {
    id: node.id,
    node_type: String(node.nodeType),
    title: node.title,
    description: node.description || "",
    source_type: node.sourceType ?? null,
    source_id: node.sourceId ?? null,
    source_url: node.sourceUrl ?? null,
    internal_entity_type: node.internalEntityType ?? null,
    internal_entity_id: node.internalEntityId ?? null,
    country: node.country || "RU",
    region: node.region ?? null,
    city: node.city ?? null,
    location_data: node.locationData || {},
    status: node.status,
    visibility: node.visibility,
    structured_data: node.structuredData || {},
    data_confidence: node.dataConfidence,
    data_quality_score: node.dataQualityScore,
    opportunity_attractiveness: node.opportunityAttractiveness ?? null,
    fingerprint: node.fingerprint ?? null,
    merged_into_id: node.mergedIntoId ?? null,
    created_at: node.createdAt,
    updated_at: node.updatedAt,
    first_seen_at: node.firstSeenAt,
    last_seen_at: node.lastSeenAt,
  };
}

export function rowToEdge(row: BusinessEdgeRow): BusinessEdge {
  return {
    id: row.id,
    sourceNodeId: row.source_node_id,
    targetNodeId: row.target_node_id,
    relationshipType: row.relationship_type,
    confidence: num(row.confidence),
    strength: row.strength === null || row.strength === undefined ? null : num(row.strength),
    status: row.status as BusinessEdgeStatus,
    matchClass: (row.match_class as BusinessMatchClass | null) ?? null,
    provenanceType: row.provenance_type as BusinessProvenanceType,
    reasoningSummary: row.reasoning_summary || "",
    source: row.source,
    sourceUrl: row.source_url,
    createdByKind: row.created_by_kind as BusinessActorKind,
    createdByUserId: row.created_by_user_id,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    isCurrent: Boolean(row.is_current),
    ownerComment: row.owner_comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function edgeToRow(edge: BusinessEdge): BusinessEdgeRow {
  return {
    id: edge.id,
    source_node_id: edge.sourceNodeId,
    target_node_id: edge.targetNodeId,
    relationship_type: String(edge.relationshipType),
    confidence: edge.confidence,
    strength: edge.strength ?? null,
    status: edge.status,
    match_class: edge.matchClass ?? null,
    provenance_type: edge.provenanceType,
    reasoning_summary: edge.reasoningSummary || "",
    source: edge.source ?? null,
    source_url: edge.sourceUrl ?? null,
    created_by_kind: edge.createdByKind,
    created_by_user_id: edge.createdByUserId ?? null,
    valid_from: edge.validFrom ?? null,
    valid_to: edge.validTo ?? null,
    is_current: edge.isCurrent,
    owner_comment: edge.ownerComment ?? null,
    created_at: edge.createdAt,
    updated_at: edge.updatedAt,
  };
}

export function rowToAlias(row: BusinessAliasRow): BusinessAlias {
  return {
    id: row.id,
    nodeId: row.node_id,
    alias: row.alias,
    normalizedAlias: row.normalized_alias,
    source: row.source,
    confidence: num(row.confidence, 50),
    createdAt: row.created_at,
  };
}

export function aliasToRow(alias: BusinessAlias): BusinessAliasRow {
  return {
    id: alias.id,
    node_id: alias.nodeId,
    alias: alias.alias,
    normalized_alias: alias.normalizedAlias,
    source: alias.source ?? null,
    confidence: alias.confidence,
    created_at: alias.createdAt,
  };
}

export function rowToNodeSource(row: BusinessNodeSourceRow): BusinessNodeSource {
  return {
    id: row.id,
    nodeId: row.node_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    title: row.title,
    snippet: row.snippet,
    isPrimary: Boolean(row.is_primary),
    meta: row.meta || {},
    createdAt: row.created_at,
  };
}

export function nodeSourceToRow(s: BusinessNodeSource): BusinessNodeSourceRow {
  return {
    id: s.id,
    node_id: s.nodeId,
    source_type: s.sourceType,
    source_id: s.sourceId ?? null,
    source_url: s.sourceUrl ?? null,
    title: s.title ?? null,
    snippet: s.snippet ?? null,
    is_primary: s.isPrimary,
    meta: s.meta || {},
    created_at: s.createdAt,
  };
}

export function rowToEvent(row: BusinessGraphEventRow): BusinessGraphEvent {
  return {
    id: row.id,
    eventType: row.event_type as BusinessGraphEventType,
    nodeId: row.node_id,
    edgeId: row.edge_id,
    payload: row.payload || {},
    actorKind: row.actor_kind as BusinessActorKind,
    actorUserId: row.actor_user_id,
    createdAt: row.created_at,
  };
}

export function eventToRow(e: BusinessGraphEvent): BusinessGraphEventRow {
  return {
    id: e.id,
    event_type: e.eventType,
    node_id: e.nodeId ?? null,
    edge_id: e.edgeId ?? null,
    payload: e.payload || {},
    actor_kind: e.actorKind,
    actor_user_id: e.actorUserId ?? null,
    created_at: e.createdAt,
  };
}
