import type { CkrOwnIdea, OwnIdeaRunMetrics } from "@/types/ckr-own-ideas";

export type OwnIdeaStore = {
  list(): Promise<CkrOwnIdea[]>;
  get(id: string): Promise<CkrOwnIdea | undefined>;
  findByFingerprint(fingerprint: string): Promise<CkrOwnIdea | undefined>;
  upsert(idea: CkrOwnIdea): Promise<void>;
  remove(id: string): Promise<void>;
  saveRun(metrics: OwnIdeaRunMetrics): Promise<void>;
  lastRun(): Promise<OwnIdeaRunMetrics | null>;
  listRuns(): Promise<OwnIdeaRunMetrics[]>;
  reset(): Promise<void>;
};

const ideas = new Map<string, CkrOwnIdea>();
const runs: OwnIdeaRunMetrics[] = [];
let testOverride: OwnIdeaStore | undefined;

export const memoryOwnIdeaStore: OwnIdeaStore = {
  async list() {
    return [...ideas.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(id) {
    return ideas.get(id);
  },
  async findByFingerprint(fingerprint) {
    return [...ideas.values()].find((idea) => idea.fingerprint === fingerprint);
  },
  async upsert(idea) {
    ideas.set(idea.id, idea);
  },
  async remove(id) {
    ideas.delete(id);
  },
  async saveRun(metrics) {
    const idx = runs.findIndex((run) => run.runId === metrics.runId);
    if (idx >= 0) runs[idx] = metrics;
    else runs.unshift(metrics);
  },
  async lastRun() {
    return runs[0] ?? null;
  },
  async listRuns() {
    return [...runs];
  },
  async reset() {
    ideas.clear();
    runs.length = 0;
  },
};

export function isProductionOwnIdeaRuntime() {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.CKR_ENVIRONMENT !== "staging"
  );
}

export function resolveOwnIdeaStoreMode(): "memory" | "supabase" {
  const explicit = (process.env.CKR_OWN_IDEA_STORE || "").trim().toLowerCase();
  if (explicit === "memory") {
    if (isProductionOwnIdeaRuntime()) {
      throw new Error("CKR_OWN_IDEA_STORE=memory is forbidden in production");
    }
    return "memory";
  }
  return "supabase";
}

export function setOwnIdeaStoreForTests(store?: OwnIdeaStore) {
  testOverride = store;
}

export function getOwnIdeaStoreOverride() {
  return testOverride;
}
