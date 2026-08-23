import type { CkrOwnIdea, OwnIdeaRunMetrics } from "@/types/ckr-own-ideas";

export type OwnIdeaStore = {
  list(): CkrOwnIdea[];
  get(id: string): CkrOwnIdea | undefined;
  upsert(idea: CkrOwnIdea): void;
  remove(id: string): void;
  saveRun(metrics: OwnIdeaRunMetrics): void;
  lastRun(): OwnIdeaRunMetrics | null;
  reset(): void;
};

const ideas = new Map<string, CkrOwnIdea>();
const runs: OwnIdeaRunMetrics[] = [];

export const memoryOwnIdeaStore: OwnIdeaStore = {
  list() {
    return [...ideas.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  get(id) {
    return ideas.get(id);
  },
  upsert(idea) {
    ideas.set(idea.id, idea);
  },
  remove(id) {
    ideas.delete(id);
  },
  saveRun(metrics) {
    runs.unshift(metrics);
  },
  lastRun() {
    return runs[0] ?? null;
  },
  reset() {
    ideas.clear();
    runs.length = 0;
  },
};

export function getOwnIdeaStore(): OwnIdeaStore {
  return memoryOwnIdeaStore;
}

export function setOwnIdeaStoreForTests(store?: OwnIdeaStore) {
  if (store) {
    Object.assign(memoryOwnIdeaStore, store);
  }
}
