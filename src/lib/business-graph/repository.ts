/** Low-level persistence for Business Graph. */

import type {
  BusinessAlias,
  BusinessEdge,
  BusinessGraphEvent,
  BusinessNode,
  BusinessNodeSource,
} from "@/types/business-graph";

export type FindNodesFilter = {
  nodeType?: string;
  region?: string;
  q?: string;
  sourceType?: string;
  sourceId?: string;
  internalEntityType?: string;
  internalEntityId?: string;
  fingerprint?: string;
  visibility?: string;
  limit?: number;
};

export type FindEdgesFilter = {
  nodeId?: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  relationshipType?: string;
  currentOnly?: boolean;
  statuses?: string[];
};

export interface BusinessGraphRepository {
  resetForTests?(): void | Promise<void>;

  getNode(id: string): Promise<BusinessNode | null>;
  findNodes(filter: FindNodesFilter): Promise<BusinessNode[]>;
  listNodesForIdentity(limit?: number): Promise<BusinessNode[]>;
  upsertNode(node: BusinessNode): Promise<void>;

  getEdge(id: string): Promise<BusinessEdge | null>;
  findEdges(filter: FindEdgesFilter): Promise<BusinessEdge[]>;
  upsertEdge(edge: BusinessEdge): Promise<void>;

  listAliases(nodeId: string): Promise<BusinessAlias[]>;
  findAlias(
    nodeId: string,
    normalizedAlias: string,
  ): Promise<BusinessAlias | null>;
  upsertAlias(alias: BusinessAlias): Promise<void>;

  listNodeSources(nodeId: string): Promise<BusinessNodeSource[]>;
  upsertNodeSource(source: BusinessNodeSource): Promise<void>;

  appendEvent(event: BusinessGraphEvent): Promise<void>;
  getNodeHistory(nodeId: string): Promise<BusinessGraphEvent[]>;
}
