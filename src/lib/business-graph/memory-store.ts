/**
 * In-memory Business Graph store for Stage 3A tests / dry-run.
 * Supabase persistence requires applying prepared migration (not done yet).
 */

import type {
  BusinessAlias,
  BusinessEdge,
  BusinessGraphEvent,
  BusinessNode,
  BusinessNodeSource,
} from "@/types/business-graph";

export type BusinessGraphMemoryStore = {
  nodes: Map<string, BusinessNode>;
  edges: Map<string, BusinessEdge>;
  aliases: Map<string, BusinessAlias>;
  nodeSources: Map<string, BusinessNodeSource>;
  events: BusinessGraphEvent[];
};

const globalStore = globalThis as unknown as {
  __ckrBusinessGraphStore?: BusinessGraphMemoryStore;
};

function empty(): BusinessGraphMemoryStore {
  return {
    nodes: new Map(),
    edges: new Map(),
    aliases: new Map(),
    nodeSources: new Map(),
    events: [],
  };
}

export function getBusinessGraphMemoryStore(): BusinessGraphMemoryStore {
  if (!globalStore.__ckrBusinessGraphStore) {
    globalStore.__ckrBusinessGraphStore = empty();
  }
  return globalStore.__ckrBusinessGraphStore;
}

export function resetBusinessGraphMemoryStore(): void {
  globalStore.__ckrBusinessGraphStore = empty();
}
