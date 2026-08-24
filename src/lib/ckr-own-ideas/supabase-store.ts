/**
 * DB-backed OwnIdeaStore. Tables: ckr_own_ideas, ckr_own_idea_runs.
 * Inject a session client (RLS is_admin) for owner UI, or service role for E2E.
 */
import type { OwnIdeaAdmin } from "@/lib/ckr-own-ideas/persist";
import {
  persistOwnIdea,
  persistOwnIdeaRun,
  rowToIdea,
  rowToRun,
} from "@/lib/ckr-own-ideas/persist";
import type { OwnIdeaStore } from "@/lib/ckr-own-ideas/store";
import type { CkrOwnIdea, OwnIdeaRunMetrics } from "@/types/ckr-own-ideas";

function throwWrite(op: string, error: { message?: string } | null) {
  if (!error) return;
  throw new Error(`OwnIdeaStore ${op} failed: ${error.message || "db error"}`);
}

export class SupabaseOwnIdeaStore implements OwnIdeaStore {
  readonly kind = "supabase" as const;

  constructor(private readonly db: OwnIdeaAdmin) {}

  async list(): Promise<CkrOwnIdea[]> {
    const { data, error } = await this.db
      .from("ckr_own_ideas")
      .select("*")
      .order("updated_at", { ascending: false });
    throwWrite("list", error);
    return (data || []).map((row) => rowToIdea(row as Record<string, unknown>));
  }

  async get(id: string): Promise<CkrOwnIdea | undefined> {
    const { data, error } = await this.db
      .from("ckr_own_ideas")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    throwWrite("get", error);
    return data ? rowToIdea(data as Record<string, unknown>) : undefined;
  }

  async findByFingerprint(fingerprint: string): Promise<CkrOwnIdea | undefined> {
    const { data, error } = await this.db
      .from("ckr_own_ideas")
      .select("*")
      .eq("fingerprint", fingerprint)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    throwWrite("findByFingerprint", error);
    return data ? rowToIdea(data as Record<string, unknown>) : undefined;
  }

  async upsert(idea: CkrOwnIdea): Promise<void> {
    await persistOwnIdea(this.db, idea);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.db.from("ckr_own_ideas").delete().eq("id", id);
    throwWrite("remove", error);
  }

  async saveRun(metrics: OwnIdeaRunMetrics): Promise<void> {
    await persistOwnIdeaRun(this.db, metrics);
  }

  async listRuns(): Promise<OwnIdeaRunMetrics[]> {
    const { data, error } = await this.db
      .from("ckr_own_idea_runs")
      .select("*")
      .order("started_at", { ascending: false });
    throwWrite("listRuns", error);
    return (data || []).map((row) => rowToRun(row as Record<string, unknown>));
  }

  async lastRun(): Promise<OwnIdeaRunMetrics | null> {
    const runs = await this.listRuns();
    return runs[0] ?? null;
  }

  async reset(): Promise<void> {
    throw new Error("SupabaseOwnIdeaStore.reset is forbidden — use exact-ID cleanup");
  }
}

export function createSupabaseOwnIdeaStore(client: OwnIdeaAdmin): OwnIdeaStore {
  return new SupabaseOwnIdeaStore(client);
}
