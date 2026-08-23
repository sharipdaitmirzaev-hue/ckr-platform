/**
 * Stage 4Q.1 store factory.
 * Production / live owner UI SoT = Supabase.
 * Memory is only for unit tests and explicit local fixtures.
 */
import { createSupabaseOwnIdeaStore } from "@/lib/ckr-own-ideas/supabase-store";
import type { CkrOwnIdea, OwnIdeaRunMetrics } from "@/types/ckr-own-ideas";

export type OwnIdeaStore = {
  list(): Promise<CkrOwnIdea[]>;
  get(id: string): Promise<CkrOwnIdea | undefined>;
  getByFingerprint(fingerprint: string): Promise<CkrOwnIdea | undefined>;
  upsert(idea: CkrOwnIdea): Promise<void>;
  remove(id: string): Promise<void>;
  saveRun(metrics: OwnIdeaRunMetrics): Promise<void>;
  lastRun(): Promise<OwnIdeaRunMetrics | null>;
  listRuns(): Promise<OwnIdeaRunMetrics[]>;
  reset(): Promise<void>;
};

const ideas = new Map<string, CkrOwnIdea>();
const runs: OwnIdeaRunMetrics[] = [];

export const memoryOwnIdeaStore: OwnIdeaStore = {
  async list() {
    return [...ideas.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(id) {
    return ideas.get(id);
  },
  async getByFingerprint(fingerprint) {
    return [...ideas.values()].find((i) => i.fingerprint === fingerprint);
  },
  async upsert(idea) {
    ideas.set(idea.id, idea);
  },
  async remove(id) {
    ideas.delete(id);
  },
  async saveRun(metrics) {
    const idx = runs.findIndex((r) => r.runId === metrics.runId);
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

export function isOwnIdeasProductionEnv(): boolean {
  const env = (process.env.CKR_ENVIRONMENT || "").trim().toLowerCase();
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").toLowerCase();
  return env === "production" || site.includes("ckr-center.ru");
}

export function hasOwnIdeasSecretEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.CKR_STAGING_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.CKR_STAGING_SERVICE_ROLE_KEY;
  return Boolean(url && key);
}

export function resolveOwnIdeaStoreMode(): "supabase" | "memory" {
  const raw = (process.env.CKR_OWN_IDEAS_STORE || "").trim().toLowerCase();
  if (raw === "memory") {
    if (isOwnIdeasProductionEnv()) {
      throw new Error(
        "CKR_OWN_IDEAS_STORE=memory запрещён в production. SoT — ckr_own_ideas.",
      );
    }
    return "memory";
  }
  if (hasOwnIdeasSecretEnv()) return "supabase";
  throw new Error(
    "Собственные идеи ЦКР требуют Supabase store (SUPABASE_SERVICE_ROLE_KEY). Memory не является production/default fallback. Для unit-тестов задайте CKR_OWN_IDEAS_STORE=memory.",
  );
}

export function getOwnIdeaStore(): OwnIdeaStore {
  const mode = resolveOwnIdeaStoreMode();
  if (mode === "memory") return memoryOwnIdeaStore;
  return createSupabaseOwnIdeaStore();
}
