import {
  aliasToRow,
  edgeToRow,
  eventToRow,
  nodeSourceToRow,
  nodeToRow,
  rowToAlias,
  rowToEdge,
  rowToEvent,
  rowToNode,
  rowToNodeSource,
  type BusinessAliasRow,
  type BusinessEdgeRow,
  type BusinessGraphEventRow,
  type BusinessNodeRow,
  type BusinessNodeSourceRow,
} from "@/lib/business-graph/mappers";
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
import type { SupabaseClient } from "@supabase/supabase-js";

function throwWrite(table: string, error: { message: string }) {
  throw new Error(`business_graph_write_failed:${table}:${error.message}`);
}

export class SupabaseBusinessGraphRepository
  implements BusinessGraphRepository
{
  constructor(private readonly db: SupabaseClient) {}

  async getNode(id: string): Promise<BusinessNode | null> {
    const { data, error } = await this.db
      .from("business_graph_nodes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throwWrite("business_graph_nodes", error);
    return data ? rowToNode(data as BusinessNodeRow) : null;
  }

  async findNodes(filter: FindNodesFilter): Promise<BusinessNode[]> {
    let q = this.db
      .from("business_graph_nodes")
      .select("*")
      .neq("status", "MERGED");
    if (filter.nodeType) q = q.eq("node_type", filter.nodeType);
    if (filter.region) q = q.ilike("region", filter.region);
    if (filter.sourceType) q = q.eq("source_type", filter.sourceType);
    if (filter.sourceId) q = q.eq("source_id", filter.sourceId);
    if (filter.internalEntityType) {
      q = q.eq("internal_entity_type", filter.internalEntityType);
    }
    if (filter.internalEntityId) {
      q = q.eq("internal_entity_id", filter.internalEntityId);
    }
    if (filter.fingerprint) q = q.eq("fingerprint", filter.fingerprint);
    if (filter.visibility) q = q.eq("visibility", filter.visibility);
    if (filter.q) {
      q = q.or(`title.ilike.%${filter.q}%,description.ilike.%${filter.q}%`);
    }
    q = q.order("updated_at", { ascending: false }).limit(filter.limit ?? 50);
    const { data, error } = await q;
    if (error) throwWrite("business_graph_nodes", error);
    return (data as BusinessNodeRow[] | null)?.map(rowToNode) ?? [];
  }

  async listNodesForIdentity(limit = 500): Promise<BusinessNode[]> {
    const { data, error } = await this.db
      .from("business_graph_nodes")
      .select("*")
      .neq("status", "MERGED")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throwWrite("business_graph_nodes", error);
    return (data as BusinessNodeRow[] | null)?.map(rowToNode) ?? [];
  }

  async upsertNode(node: BusinessNode): Promise<void> {
    const { error } = await this.db
      .from("business_graph_nodes")
      .upsert(nodeToRow(node), { onConflict: "id" });
    if (error) throwWrite("business_graph_nodes", error);
  }

  async getEdge(id: string): Promise<BusinessEdge | null> {
    const { data, error } = await this.db
      .from("business_graph_edges")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throwWrite("business_graph_edges", error);
    return data ? rowToEdge(data as BusinessEdgeRow) : null;
  }

  async findEdges(filter: FindEdgesFilter): Promise<BusinessEdge[]> {
    let q = this.db.from("business_graph_edges").select("*");
    if (filter.sourceNodeId) q = q.eq("source_node_id", filter.sourceNodeId);
    if (filter.targetNodeId) q = q.eq("target_node_id", filter.targetNodeId);
    if (filter.relationshipType) {
      q = q.eq("relationship_type", filter.relationshipType);
    }
    if (filter.statuses?.length) q = q.in("status", filter.statuses);
    if (filter.currentOnly !== false) q = q.eq("is_current", true);
    if (filter.nodeId) {
      q = q.or(
        `source_node_id.eq.${filter.nodeId},target_node_id.eq.${filter.nodeId}`,
      );
    }
    const { data, error } = await q;
    if (error) throwWrite("business_graph_edges", error);
    return (data as BusinessEdgeRow[] | null)?.map(rowToEdge) ?? [];
  }

  async upsertEdge(edge: BusinessEdge): Promise<void> {
    const { error } = await this.db
      .from("business_graph_edges")
      .upsert(edgeToRow(edge), { onConflict: "id" });
    if (error) throwWrite("business_graph_edges", error);
  }

  async listAliases(nodeId: string): Promise<BusinessAlias[]> {
    const { data, error } = await this.db
      .from("business_graph_aliases")
      .select("*")
      .eq("node_id", nodeId);
    if (error) throwWrite("business_graph_aliases", error);
    return (data as BusinessAliasRow[] | null)?.map(rowToAlias) ?? [];
  }

  async findAlias(
    nodeId: string,
    normalizedAlias: string,
  ): Promise<BusinessAlias | null> {
    const { data, error } = await this.db
      .from("business_graph_aliases")
      .select("*")
      .eq("node_id", nodeId)
      .eq("normalized_alias", normalizedAlias)
      .maybeSingle();
    if (error) throwWrite("business_graph_aliases", error);
    return data ? rowToAlias(data as BusinessAliasRow) : null;
  }

  async upsertAlias(alias: BusinessAlias): Promise<void> {
    const { error } = await this.db
      .from("business_graph_aliases")
      .upsert(aliasToRow(alias), { onConflict: "id" });
    if (error) throwWrite("business_graph_aliases", error);
  }

  async listNodeSources(nodeId: string): Promise<BusinessNodeSource[]> {
    const { data, error } = await this.db
      .from("business_graph_node_sources")
      .select("*")
      .eq("node_id", nodeId);
    if (error) throwWrite("business_graph_node_sources", error);
    return (data as BusinessNodeSourceRow[] | null)?.map(rowToNodeSource) ?? [];
  }

  async upsertNodeSource(source: BusinessNodeSource): Promise<void> {
    const { error } = await this.db
      .from("business_graph_node_sources")
      .upsert(nodeSourceToRow(source), { onConflict: "id" });
    if (error) throwWrite("business_graph_node_sources", error);
  }

  async appendEvent(event: BusinessGraphEvent): Promise<void> {
    const { error } = await this.db
      .from("business_graph_events")
      .insert(eventToRow(event));
    if (error) throwWrite("business_graph_events", error);
  }

  async getNodeHistory(nodeId: string): Promise<BusinessGraphEvent[]> {
    const { data, error } = await this.db
      .from("business_graph_events")
      .select("*")
      .eq("node_id", nodeId)
      .order("created_at", { ascending: true });
    if (error) throwWrite("business_graph_events", error);
    return (data as BusinessGraphEventRow[] | null)?.map(rowToEvent) ?? [];
  }
}
