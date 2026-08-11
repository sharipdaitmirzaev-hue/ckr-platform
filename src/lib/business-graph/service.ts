/**
 * BusinessGraphService — Stage 3A foundation (memory store).
 * Supabase backend activates only after migration apply (not done).
 */

import {
  oiCandidateToNodeInput,
  projectToNodeInput,
  investmentOfferToNodeInput,
} from "@/lib/business-graph/bridge";
import { bgId, normalizeAlias } from "@/lib/business-graph/id";
import {
  buildGraphFingerprint,
  resolveIdentity,
  shouldMerge,
} from "@/lib/business-graph/identity";
import {
  getBusinessGraphMemoryStore,
  resetBusinessGraphMemoryStore,
} from "@/lib/business-graph/memory-store";
import type {
  BusinessAlias,
  BusinessEdge,
  BusinessGraphEvent,
  BusinessNode,
  BusinessNodeSource,
  CreateEdgeInput,
  CreateNodeInput,
} from "@/types/business-graph";
import type { LiaOiCandidate } from "@/types/lia-oi";

function now(): string {
  return new Date().toISOString();
}

function pushEvent(
  partial: Omit<BusinessGraphEvent, "id" | "createdAt">,
): BusinessGraphEvent {
  const store = getBusinessGraphMemoryStore();
  const event: BusinessGraphEvent = {
    id: bgId(),
    createdAt: now(),
    ...partial,
  };
  store.events.push(event);
  return event;
}

export class BusinessGraphService {
  resetForTests(): void {
    resetBusinessGraphMemoryStore();
  }

  getNode(id: string): BusinessNode | null {
    return getBusinessGraphMemoryStore().nodes.get(id) ?? null;
  }

  findNodes(filter: {
    nodeType?: string;
    region?: string;
    q?: string;
    limit?: number;
  }): BusinessNode[] {
    const store = getBusinessGraphMemoryStore();
    let list = Array.from(store.nodes.values()).filter(
      (n) => n.status !== "MERGED",
    );
    if (filter.nodeType) {
      list = list.filter((n) => n.nodeType === filter.nodeType);
    }
    if (filter.region) {
      list = list.filter(
        (n) => (n.region || "").toLowerCase() === filter.region!.toLowerCase(),
      );
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q),
      );
    }
    return list.slice(0, filter.limit ?? 50);
  }

  getEdges(filter?: {
    nodeId?: string;
    relationshipType?: string;
    currentOnly?: boolean;
  }): BusinessEdge[] {
    const store = getBusinessGraphMemoryStore();
    let list = Array.from(store.edges.values());
    if (filter?.nodeId) {
      list = list.filter(
        (e) =>
          e.sourceNodeId === filter.nodeId || e.targetNodeId === filter.nodeId,
      );
    }
    if (filter?.relationshipType) {
      list = list.filter((e) => e.relationshipType === filter.relationshipType);
    }
    if (filter?.currentOnly !== false) {
      list = list.filter((e) => e.isCurrent);
    }
    return list;
  }

  getNeighbors(nodeId: string): {
    outgoing: Array<{ edge: BusinessEdge; node: BusinessNode }>;
    incoming: Array<{ edge: BusinessEdge; node: BusinessNode }>;
  } {
    const store = getBusinessGraphMemoryStore();
    const edges = this.getEdges({ nodeId, currentOnly: true });
    const outgoing = [];
    const incoming = [];
    for (const edge of edges) {
      if (edge.sourceNodeId === nodeId) {
        const node = store.nodes.get(edge.targetNodeId);
        if (node) outgoing.push({ edge, node });
      } else if (edge.targetNodeId === nodeId) {
        const node = store.nodes.get(edge.sourceNodeId);
        if (node) incoming.push({ edge, node });
      }
    }
    return { outgoing, incoming };
  }

  createOrUpdateNode(input: CreateNodeInput): {
    node: BusinessNode;
    created: boolean;
  } {
    const store = getBusinessGraphMemoryStore();
    const existing = Array.from(store.nodes.values());
    const match = resolveIdentity(existing, input);
    const fingerprint = buildGraphFingerprint(input);
    const ts = now();

    if (shouldMerge(match) && match) {
      const prev = match.node;
      const updated: BusinessNode = {
        ...prev,
        title: input.title || prev.title,
        description: input.description ?? prev.description,
        sourceUrl: input.sourceUrl ?? prev.sourceUrl,
        region: input.region ?? prev.region,
        city: input.city ?? prev.city,
        structuredData: {
          ...prev.structuredData,
          ...(input.structuredData || {}),
        },
        dataConfidence: Math.max(
          prev.dataConfidence,
          input.dataConfidence ?? 0,
        ),
        dataQualityScore: Math.max(
          prev.dataQualityScore,
          input.dataQualityScore ?? 0,
        ),
        opportunityAttractiveness:
          input.opportunityAttractiveness ?? prev.opportunityAttractiveness,
      fingerprint: prev.fingerprint || fingerprint || null,
      sourceType: input.sourceType ?? prev.sourceType,
      sourceId: input.sourceId ?? prev.sourceId,
      internalEntityType: input.internalEntityType ?? prev.internalEntityType,
      internalEntityId: input.internalEntityId ?? prev.internalEntityId,
      lastSeenAt: ts,
      updatedAt: ts,
    };
    store.nodes.set(updated.id, updated);
      pushEvent({
        eventType: "NODE_UPDATED",
        nodeId: updated.id,
        payload: { reason: match.reason },
        actorKind: "SYSTEM",
      });
      return { node: updated, created: false };
    }

    const node: BusinessNode = {
      id: bgId(),
      nodeType: input.nodeType,
      title: input.title,
      description: input.description || "",
      sourceType: input.sourceType ?? null,
      sourceId: input.sourceId ?? null,
      sourceUrl: input.sourceUrl ?? null,
      internalEntityType: input.internalEntityType ?? null,
      internalEntityId: input.internalEntityId ?? null,
      country: input.country || "RU",
      region: input.region ?? null,
      city: input.city ?? null,
      locationData: input.locationData || {},
      status: input.status || "ACTIVE",
      visibility: input.visibility || "OWNER_ONLY",
      structuredData: input.structuredData || {},
      dataConfidence: input.dataConfidence ?? 0,
      dataQualityScore: input.dataQualityScore ?? 0,
      opportunityAttractiveness: input.opportunityAttractiveness ?? null,
      fingerprint: fingerprint ?? null,
      mergedIntoId: null,
      createdAt: ts,
      updatedAt: ts,
      firstSeenAt: ts,
      lastSeenAt: ts,
    };
    store.nodes.set(node.id, node);
    pushEvent({
      eventType: "NODE_CREATED",
      nodeId: node.id,
      payload: { nodeType: node.nodeType },
      actorKind: "SYSTEM",
    });
    return { node, created: true };
  }

  createOrUpdateEdge(input: CreateEdgeInput): {
    edge: BusinessEdge;
    created: boolean;
  } {
    const store = getBusinessGraphMemoryStore();
    if (!store.nodes.has(input.sourceNodeId) || !store.nodes.has(input.targetNodeId)) {
      throw new Error("source_or_target_node_missing");
    }
    if (input.sourceNodeId === input.targetNodeId) {
      throw new Error("self_edge_forbidden");
    }

    const existing = Array.from(store.edges.values()).find(
      (e) =>
        e.isCurrent &&
        e.sourceNodeId === input.sourceNodeId &&
        e.targetNodeId === input.targetNodeId &&
        e.relationshipType === input.relationshipType &&
        (e.status === "PROPOSED" ||
          e.status === "ACTIVE" ||
          e.status === "CONFIRMED"),
    );
    const ts = now();

    if (existing) {
      const updated: BusinessEdge = {
        ...existing,
        confidence: Math.max(existing.confidence, input.confidence ?? 0),
        strength: input.strength ?? existing.strength,
        provenanceType: input.provenanceType || existing.provenanceType,
        reasoningSummary:
          input.reasoningSummary || existing.reasoningSummary,
        matchClass: input.matchClass ?? existing.matchClass,
        source: input.source ?? existing.source,
        sourceUrl: input.sourceUrl ?? existing.sourceUrl,
        updatedAt: ts,
      };
      // Never upgrade UNKNOWN/INFERENCE to FACT silently via merge of weaker
      if (
        existing.provenanceType === "FACT" &&
        input.provenanceType &&
        input.provenanceType !== "FACT"
      ) {
        updated.provenanceType = "FACT";
      }
      store.edges.set(updated.id, updated);
      pushEvent({
        eventType: "EDGE_UPDATED",
        edgeId: updated.id,
        nodeId: updated.sourceNodeId,
        payload: {},
        actorKind: input.createdByKind || "SYSTEM",
      });
      return { edge: updated, created: false };
    }

    const edge: BusinessEdge = {
      id: bgId(),
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      relationshipType: input.relationshipType,
      confidence: input.confidence ?? 50,
      strength: input.strength ?? null,
      status: input.status || "PROPOSED",
      matchClass: input.matchClass ?? null,
      provenanceType: input.provenanceType || "UNKNOWN",
      reasoningSummary: input.reasoningSummary || "",
      source: input.source ?? null,
      sourceUrl: input.sourceUrl ?? null,
      createdByKind: input.createdByKind || "SYSTEM",
      createdByUserId: input.createdByUserId ?? null,
      validFrom: input.validFrom ?? ts,
      validTo: input.validTo ?? null,
      isCurrent: input.isCurrent ?? true,
      ownerComment: null,
      createdAt: ts,
      updatedAt: ts,
    };
    store.edges.set(edge.id, edge);
    pushEvent({
      eventType: "EDGE_CREATED",
      edgeId: edge.id,
      nodeId: edge.sourceNodeId,
      payload: { relationshipType: edge.relationshipType },
      actorKind: edge.createdByKind,
    });
    return { edge, created: true };
  }

  addAlias(nodeId: string, alias: string, source?: string): BusinessAlias {
    const store = getBusinessGraphMemoryStore();
    if (!store.nodes.has(nodeId)) throw new Error("node_missing");
    const normalizedAlias = normalizeAlias(alias);
    const existing = Array.from(store.aliases.values()).find(
      (a) => a.nodeId === nodeId && a.normalizedAlias === normalizedAlias,
    );
    if (existing) return existing;
    const row: BusinessAlias = {
      id: bgId(),
      nodeId,
      alias,
      normalizedAlias,
      source: source ?? null,
      confidence: 70,
      createdAt: now(),
    };
    store.aliases.set(row.id, row);
    pushEvent({
      eventType: "ALIAS_ADDED",
      nodeId,
      payload: { alias },
      actorKind: "SYSTEM",
    });
    return row;
  }

  addNodeSource(
    nodeId: string,
    source: Omit<BusinessNodeSource, "id" | "nodeId" | "createdAt">,
  ): BusinessNodeSource {
    const store = getBusinessGraphMemoryStore();
    if (!store.nodes.has(nodeId)) throw new Error("node_missing");
    const row: BusinessNodeSource = {
      id: bgId(),
      nodeId,
      createdAt: now(),
      ...source,
    };
    store.nodeSources.set(row.id, row);
    return row;
  }

  getNodeHistory(nodeId: string): BusinessGraphEvent[] {
    return getBusinessGraphMemoryStore()
      .events.filter((e) => e.nodeId === nodeId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  listAliases(nodeId: string): BusinessAlias[] {
    return Array.from(getBusinessGraphMemoryStore().aliases.values()).filter(
      (a) => a.nodeId === nodeId,
    );
  }

  listNodeSources(nodeId: string): BusinessNodeSource[] {
    return Array.from(
      getBusinessGraphMemoryStore().nodeSources.values(),
    ).filter((s) => s.nodeId === nodeId);
  }

  confirmEdge(edgeId: string, userId?: string, comment?: string): BusinessEdge {
    return this.setEdgeOwnerStatus(edgeId, "CONFIRMED", userId, comment);
  }

  rejectEdge(edgeId: string, userId?: string, comment?: string): BusinessEdge {
    return this.setEdgeOwnerStatus(edgeId, "REJECTED", userId, comment);
  }

  private setEdgeOwnerStatus(
    edgeId: string,
    status: "CONFIRMED" | "REJECTED",
    userId?: string,
    comment?: string,
  ): BusinessEdge {
    const store = getBusinessGraphMemoryStore();
    const edge = store.edges.get(edgeId);
    if (!edge) throw new Error("edge_missing");
    const updated: BusinessEdge = {
      ...edge,
      status,
      ownerComment: comment ?? edge.ownerComment,
      updatedAt: now(),
      createdByUserId: userId ?? edge.createdByUserId,
    };
    store.edges.set(edgeId, updated);
    pushEvent({
      eventType: status === "CONFIRMED" ? "EDGE_CONFIRMED" : "EDGE_REJECTED",
      edgeId,
      nodeId: edge.sourceNodeId,
      payload: { comment: comment || null },
      actorKind: "OWNER",
      actorUserId: userId ?? null,
    });
    return updated;
  }

  /** Close temporal edge without deleting history. */
  archiveEdge(edgeId: string, validTo?: string): BusinessEdge {
    const store = getBusinessGraphMemoryStore();
    const edge = store.edges.get(edgeId);
    if (!edge) throw new Error("edge_missing");
    const updated: BusinessEdge = {
      ...edge,
      status: "ARCHIVED",
      isCurrent: false,
      validTo: validTo || now(),
      updatedAt: now(),
    };
    store.edges.set(edgeId, updated);
    pushEvent({
      eventType: "EDGE_UPDATED",
      edgeId,
      nodeId: edge.sourceNodeId,
      payload: { archived: true },
      actorKind: "SYSTEM",
    });
    return updated;
  }

  bridgeFromOiCandidate(c: LiaOiCandidate): BusinessNode {
    const { node } = this.createOrUpdateNode(oiCandidateToNodeInput(c));
    for (const s of c.sources || []) {
      this.addNodeSource(node.id, {
        sourceType: "lia_oi_source",
        sourceId: s.id,
        sourceUrl: s.url,
        title: s.name,
        snippet: null,
        isPrimary: false,
        meta: { category: s.category, isStub: s.isStub },
      });
    }
    return node;
  }

  bridgeFromProject(project: {
    id: string;
    title: string;
    summary?: string | null;
    description?: string | null;
    region?: string | null;
    city?: string | null;
    status?: string | null;
  }): BusinessNode {
    return this.createOrUpdateNode(projectToNodeInput(project)).node;
  }

  bridgeFromInvestmentOffer(offer: {
    id: string;
    title: string;
    description?: string | null;
    budgetMax?: number | null;
    regions?: string[] | null;
  }): BusinessNode {
    return this.createOrUpdateNode(investmentOfferToNodeInput(offer)).node;
  }

  resolveIdentity(input: CreateNodeInput) {
    const existing = Array.from(getBusinessGraphMemoryStore().nodes.values());
    return resolveIdentity(existing, input);
  }
}

let singleton: BusinessGraphService | null = null;

export function getBusinessGraphService(): BusinessGraphService {
  if (!singleton) singleton = new BusinessGraphService();
  return singleton;
}
