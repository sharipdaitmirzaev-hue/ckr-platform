import {
  getBusinessGraphMemoryStore,
  resetBusinessGraphMemoryStore,
} from "@/lib/business-graph/memory-store";
import type {
  BusinessGraphRepository,
  FindEdgesFilter,
  FindNodesFilter,
} from "@/lib/business-graph/repository";
import type {
  BusinessAlias,
  BusinessEdge,
  BusinessGraphEvent,
  BusinessNode,
  BusinessNodeSource,
} from "@/types/business-graph";

export class MemoryBusinessGraphRepository implements BusinessGraphRepository {
  resetForTests(): void {
    resetBusinessGraphMemoryStore();
  }

  async getNode(id: string): Promise<BusinessNode | null> {
    return getBusinessGraphMemoryStore().nodes.get(id) ?? null;
  }

  async findNodes(filter: FindNodesFilter): Promise<BusinessNode[]> {
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
    if (filter.sourceType) {
      list = list.filter((n) => n.sourceType === filter.sourceType);
    }
    if (filter.sourceId) {
      list = list.filter((n) => n.sourceId === filter.sourceId);
    }
    if (filter.internalEntityType) {
      list = list.filter(
        (n) => n.internalEntityType === filter.internalEntityType,
      );
    }
    if (filter.internalEntityId) {
      list = list.filter(
        (n) => n.internalEntityId === filter.internalEntityId,
      );
    }
    if (filter.fingerprint) {
      list = list.filter((n) => n.fingerprint === filter.fingerprint);
    }
    if (filter.visibility) {
      list = list.filter((n) => n.visibility === filter.visibility);
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

  async listNodesForIdentity(limit = 500): Promise<BusinessNode[]> {
    return Array.from(getBusinessGraphMemoryStore().nodes.values())
      .filter((n) => n.status !== "MERGED")
      .slice(0, limit);
  }

  async upsertNode(node: BusinessNode): Promise<void> {
    getBusinessGraphMemoryStore().nodes.set(node.id, node);
  }

  async getEdge(id: string): Promise<BusinessEdge | null> {
    return getBusinessGraphMemoryStore().edges.get(id) ?? null;
  }

  async findEdges(filter: FindEdgesFilter): Promise<BusinessEdge[]> {
    let list = Array.from(getBusinessGraphMemoryStore().edges.values());
    if (filter.nodeId) {
      list = list.filter(
        (e) =>
          e.sourceNodeId === filter.nodeId || e.targetNodeId === filter.nodeId,
      );
    }
    if (filter.sourceNodeId) {
      list = list.filter((e) => e.sourceNodeId === filter.sourceNodeId);
    }
    if (filter.targetNodeId) {
      list = list.filter((e) => e.targetNodeId === filter.targetNodeId);
    }
    if (filter.relationshipType) {
      list = list.filter(
        (e) => e.relationshipType === filter.relationshipType,
      );
    }
    if (filter.statuses?.length) {
      list = list.filter((e) => filter.statuses!.includes(e.status));
    }
    if (filter.currentOnly !== false) {
      list = list.filter((e) => e.isCurrent);
    }
    return list;
  }

  async upsertEdge(edge: BusinessEdge): Promise<void> {
    getBusinessGraphMemoryStore().edges.set(edge.id, edge);
  }

  async listAliases(nodeId: string): Promise<BusinessAlias[]> {
    return Array.from(getBusinessGraphMemoryStore().aliases.values()).filter(
      (a) => a.nodeId === nodeId,
    );
  }

  async findAlias(
    nodeId: string,
    normalizedAlias: string,
  ): Promise<BusinessAlias | null> {
    return (
      Array.from(getBusinessGraphMemoryStore().aliases.values()).find(
        (a) => a.nodeId === nodeId && a.normalizedAlias === normalizedAlias,
      ) ?? null
    );
  }

  async upsertAlias(alias: BusinessAlias): Promise<void> {
    getBusinessGraphMemoryStore().aliases.set(alias.id, alias);
  }

  async listNodeSources(nodeId: string): Promise<BusinessNodeSource[]> {
    return Array.from(
      getBusinessGraphMemoryStore().nodeSources.values(),
    ).filter((s) => s.nodeId === nodeId);
  }

  async upsertNodeSource(source: BusinessNodeSource): Promise<void> {
    getBusinessGraphMemoryStore().nodeSources.set(source.id, source);
  }

  async appendEvent(event: BusinessGraphEvent): Promise<void> {
    getBusinessGraphMemoryStore().events.push(event);
  }

  async getNodeHistory(nodeId: string): Promise<BusinessGraphEvent[]> {
    return getBusinessGraphMemoryStore()
      .events.filter((e) => e.nodeId === nodeId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
}
