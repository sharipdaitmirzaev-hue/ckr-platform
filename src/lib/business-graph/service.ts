/**
 * BusinessGraphService — Stage 3A foundation.
 * memory (default) | supabase via BUSINESS_GRAPH_STORE.
 */

import {
  investmentOfferToNodeInput,
  oiCandidateToNodeInput,
  projectToNodeInput,
} from "@/lib/business-graph/bridge";
import { bgId, normalizeAlias } from "@/lib/business-graph/id";
import {
  buildGraphFingerprint,
  resolveIdentity,
  shouldMerge,
} from "@/lib/business-graph/identity";
import { MemoryBusinessGraphRepository } from "@/lib/business-graph/memory-repository";
import {
  resolveBusinessGraphStoreMode,
  type BusinessGraphStoreMode,
} from "@/lib/business-graph/mode";
import type { BusinessGraphRepository } from "@/lib/business-graph/repository";
import { createBusinessGraphAdminClient } from "@/lib/business-graph/supabase-client";
import { SupabaseBusinessGraphRepository } from "@/lib/business-graph/supabase-repository";
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

export class BusinessGraphService {
  constructor(private readonly repo: BusinessGraphRepository) {}

  get modeHint(): string {
    return this.repo instanceof SupabaseBusinessGraphRepository
      ? "supabase"
      : "memory";
  }

  async resetForTests(): Promise<void> {
    await this.repo.resetForTests?.();
  }

  async getNode(id: string): Promise<BusinessNode | null> {
    return this.repo.getNode(id);
  }

  async findNodes(filter: {
    nodeType?: string;
    region?: string;
    q?: string;
    visibility?: string;
    limit?: number;
  }): Promise<BusinessNode[]> {
    return this.repo.findNodes(filter);
  }

  async getEdges(filter?: {
    nodeId?: string;
    relationshipType?: string;
    currentOnly?: boolean;
  }): Promise<BusinessEdge[]> {
    return this.repo.findEdges({
      nodeId: filter?.nodeId,
      relationshipType: filter?.relationshipType,
      currentOnly: filter?.currentOnly,
    });
  }

  async getNeighbors(nodeId: string): Promise<{
    outgoing: Array<{ edge: BusinessEdge; node: BusinessNode }>;
    incoming: Array<{ edge: BusinessEdge; node: BusinessNode }>;
  }> {
    const edges = await this.repo.findEdges({ nodeId, currentOnly: true });
    const outgoing = [];
    const incoming = [];
    for (const edge of edges) {
      if (edge.sourceNodeId === nodeId) {
        const node = await this.repo.getNode(edge.targetNodeId);
        if (node) outgoing.push({ edge, node });
      } else if (edge.targetNodeId === nodeId) {
        const node = await this.repo.getNode(edge.sourceNodeId);
        if (node) incoming.push({ edge, node });
      }
    }
    return { outgoing, incoming };
  }

  private async pushEvent(
    partial: Omit<BusinessGraphEvent, "id" | "createdAt">,
  ): Promise<BusinessGraphEvent> {
    const event: BusinessGraphEvent = {
      id: bgId(),
      createdAt: now(),
      ...partial,
    };
    await this.repo.appendEvent(event);
    return event;
  }

  async createOrUpdateNode(input: CreateNodeInput): Promise<{
    node: BusinessNode;
    created: boolean;
  }> {
    const fingerprint = buildGraphFingerprint(input);
    const ts = now();

    // Fast path: exact source / internal / fingerprint lookups
    if (input.sourceType && input.sourceId) {
      const bySource = await this.repo.findNodes({
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        limit: 1,
      });
      if (bySource[0]) {
        return this.updateExistingNode(bySource[0], input, fingerprint, ts);
      }
    }
    if (input.internalEntityType && input.internalEntityId) {
      const byInternal = await this.repo.findNodes({
        internalEntityType: input.internalEntityType,
        internalEntityId: input.internalEntityId,
        limit: 1,
      });
      if (byInternal[0]) {
        return this.updateExistingNode(byInternal[0], input, fingerprint, ts);
      }
    }
    if (fingerprint) {
      const byFp = await this.repo.findNodes({ fingerprint, limit: 1 });
      if (byFp[0]) {
        return this.updateExistingNode(byFp[0], input, fingerprint, ts);
      }
    }

    const existing = await this.repo.listNodesForIdentity(500);
    const match = resolveIdentity(existing, input);
    if (shouldMerge(match) && match) {
      return this.updateExistingNode(match.node, input, fingerprint, ts, match.reason);
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
    await this.repo.upsertNode(node);
    await this.pushEvent({
      eventType: "NODE_CREATED",
      nodeId: node.id,
      payload: { nodeType: node.nodeType },
      actorKind: "SYSTEM",
    });
    return { node, created: true };
  }

  private async updateExistingNode(
    prev: BusinessNode,
    input: CreateNodeInput,
    fingerprint: string | null,
    ts: string,
    reason = "update",
  ): Promise<{ node: BusinessNode; created: boolean }> {
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
      dataConfidence: Math.max(prev.dataConfidence, input.dataConfidence ?? 0),
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
    await this.repo.upsertNode(updated);
    await this.pushEvent({
      eventType: "NODE_UPDATED",
      nodeId: updated.id,
      payload: { reason },
      actorKind: "SYSTEM",
    });
    return { node: updated, created: false };
  }

  async createOrUpdateEdge(input: CreateEdgeInput): Promise<{
    edge: BusinessEdge;
    created: boolean;
  }> {
    const source = await this.repo.getNode(input.sourceNodeId);
    const target = await this.repo.getNode(input.targetNodeId);
    if (!source || !target) throw new Error("source_or_target_node_missing");
    if (input.sourceNodeId === input.targetNodeId) {
      throw new Error("self_edge_forbidden");
    }

    const existingList = await this.repo.findEdges({
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      relationshipType: input.relationshipType,
      currentOnly: true,
      statuses: ["PROPOSED", "ACTIVE", "CONFIRMED"],
    });
    const existing = existingList[0];
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
      if (
        existing.provenanceType === "FACT" &&
        input.provenanceType &&
        input.provenanceType !== "FACT"
      ) {
        updated.provenanceType = "FACT";
      }
      await this.repo.upsertEdge(updated);
      await this.pushEvent({
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
    await this.repo.upsertEdge(edge);
    await this.pushEvent({
      eventType: "EDGE_CREATED",
      edgeId: edge.id,
      nodeId: edge.sourceNodeId,
      payload: { relationshipType: edge.relationshipType },
      actorKind: edge.createdByKind,
    });
    return { edge, created: true };
  }

  async addAlias(
    nodeId: string,
    alias: string,
    source?: string,
  ): Promise<BusinessAlias> {
    if (!(await this.repo.getNode(nodeId))) throw new Error("node_missing");
    const normalizedAlias = normalizeAlias(alias);
    const existing = await this.repo.findAlias(nodeId, normalizedAlias);
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
    await this.repo.upsertAlias(row);
    await this.pushEvent({
      eventType: "ALIAS_ADDED",
      nodeId,
      payload: { alias },
      actorKind: "SYSTEM",
    });
    return row;
  }

  async addNodeSource(
    nodeId: string,
    source: Omit<BusinessNodeSource, "id" | "nodeId" | "createdAt">,
  ): Promise<BusinessNodeSource> {
    if (!(await this.repo.getNode(nodeId))) throw new Error("node_missing");
    const row: BusinessNodeSource = {
      id: bgId(),
      nodeId,
      createdAt: now(),
      ...source,
    };
    await this.repo.upsertNodeSource(row);
    return row;
  }

  async getNodeHistory(nodeId: string): Promise<BusinessGraphEvent[]> {
    return this.repo.getNodeHistory(nodeId);
  }

  async listAliases(nodeId: string): Promise<BusinessAlias[]> {
    return this.repo.listAliases(nodeId);
  }

  async listNodeSources(nodeId: string): Promise<BusinessNodeSource[]> {
    return this.repo.listNodeSources(nodeId);
  }

  async confirmEdge(
    edgeId: string,
    userId?: string,
    comment?: string,
  ): Promise<BusinessEdge> {
    return this.setEdgeOwnerStatus(edgeId, "CONFIRMED", userId, comment);
  }

  async rejectEdge(
    edgeId: string,
    userId?: string,
    comment?: string,
  ): Promise<BusinessEdge> {
    return this.setEdgeOwnerStatus(edgeId, "REJECTED", userId, comment);
  }

  async commentEdge(
    edgeId: string,
    userId: string,
    comment: string,
  ): Promise<BusinessEdge> {
    const edge = await this.repo.getEdge(edgeId);
    if (!edge) throw new Error("edge_missing");
    const updated: BusinessEdge = {
      ...edge,
      ownerComment: comment,
      updatedAt: now(),
      createdByUserId: userId || edge.createdByUserId,
    };
    await this.repo.upsertEdge(updated);
    await this.pushEvent({
      eventType: "OWNER_COMMENT",
      edgeId,
      nodeId: edge.sourceNodeId,
      payload: { comment },
      actorKind: "OWNER",
      actorUserId: userId,
    });
    return updated;
  }

  private async setEdgeOwnerStatus(
    edgeId: string,
    status: "CONFIRMED" | "REJECTED",
    userId?: string,
    comment?: string,
  ): Promise<BusinessEdge> {
    const edge = await this.repo.getEdge(edgeId);
    if (!edge) throw new Error("edge_missing");
    const updated: BusinessEdge = {
      ...edge,
      status,
      ownerComment: comment ?? edge.ownerComment,
      updatedAt: now(),
      createdByUserId: userId ?? edge.createdByUserId,
    };
    await this.repo.upsertEdge(updated);
    await this.pushEvent({
      eventType: status === "CONFIRMED" ? "EDGE_CONFIRMED" : "EDGE_REJECTED",
      edgeId,
      nodeId: edge.sourceNodeId,
      payload: { comment: comment || null },
      actorKind: "OWNER",
      actorUserId: userId ?? null,
    });
    return updated;
  }

  async archiveEdge(edgeId: string, validTo?: string): Promise<BusinessEdge> {
    const edge = await this.repo.getEdge(edgeId);
    if (!edge) throw new Error("edge_missing");
    const updated: BusinessEdge = {
      ...edge,
      status: "ARCHIVED",
      isCurrent: false,
      validTo: validTo || now(),
      updatedAt: now(),
    };
    await this.repo.upsertEdge(updated);
    await this.pushEvent({
      eventType: "EDGE_UPDATED",
      edgeId,
      nodeId: edge.sourceNodeId,
      payload: { archived: true },
      actorKind: "SYSTEM",
    });
    return updated;
  }

  async bridgeFromOiCandidate(c: LiaOiCandidate): Promise<BusinessNode> {
    const { node } = await this.createOrUpdateNode(oiCandidateToNodeInput(c));
    for (const s of c.sources || []) {
      await this.addNodeSource(node.id, {
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

  async bridgeFromProject(project: {
    id: string;
    title: string;
    summary?: string | null;
    description?: string | null;
    region?: string | null;
    city?: string | null;
    status?: string | null;
  }): Promise<BusinessNode> {
    return (await this.createOrUpdateNode(projectToNodeInput(project))).node;
  }

  async bridgeFromInvestmentOffer(offer: {
    id: string;
    title: string;
    description?: string | null;
    budgetMax?: number | null;
    regions?: string[] | null;
  }): Promise<BusinessNode> {
    return (await this.createOrUpdateNode(investmentOfferToNodeInput(offer)))
      .node;
  }

  async resolveIdentity(input: CreateNodeInput) {
    const existing = await this.repo.listNodesForIdentity(500);
    return resolveIdentity(existing, input);
  }
}

function createRepository(
  mode: BusinessGraphStoreMode,
): BusinessGraphRepository {
  if (mode === "supabase") {
    return new SupabaseBusinessGraphRepository(createBusinessGraphAdminClient());
  }
  return new MemoryBusinessGraphRepository();
}

let singleton: BusinessGraphService | null = null;
let singletonMode: BusinessGraphStoreMode | null = null;

export function getBusinessGraphService(
  modeOverride?: BusinessGraphStoreMode,
): BusinessGraphService {
  const mode = modeOverride ?? resolveBusinessGraphStoreMode();
  if (!singleton || singletonMode !== mode) {
    singleton = new BusinessGraphService(createRepository(mode));
    singletonMode = mode;
  }
  return singleton;
}

/** Test helper: force a fresh memory service. */
export function createMemoryBusinessGraphService(): BusinessGraphService {
  return new BusinessGraphService(new MemoryBusinessGraphRepository());
}

export function setBusinessGraphServiceForTests(
  service: BusinessGraphService | null,
): void {
  singleton = service;
  singletonMode = service ? "memory" : null;
}
