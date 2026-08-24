/**
 * Supabase-backed OwnIdeaStore. Production / staging SoT.
 * Each method hits the DB — a new instance is a process-restart equivalent.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ideaToRow,
  rowToIdea,
  rowToRun,
  runToRow,
  type OwnIdeaRow,
  type OwnIdeaRunRow,
} from "@/lib/ckr-own-ideas/mappers";
import type { OwnIdeaStore } from "@/lib/ckr-own-ideas/store";

type Admin = SupabaseClient;

function fromTable(admin: Admin, name: "ckr_own_ideas" | "ckr_own_idea_runs") {
  return (admin as unknown as { from: (t: string) => Query }).from(name);
}

type Result = { data: unknown; error: { message: string } | null };

type Query = PromiseLike<Result> & {
  select: (cols?: string) => Query;
  eq: (col: string, val: string) => Query;
  order: (col: string, opts: { ascending: boolean }) => Query;
  limit: (n: number) => Query;
  maybeSingle: () => Promise<Result>;
  upsert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  delete: () => Query;
};

export function createOwnIdeasAdminClient(): Admin {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.CKR_STAGING_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.CKR_STAGING_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase URL/service role for own ideas store");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createSupabaseOwnIdeaStore(admin?: Admin): OwnIdeaStore {
  const client = admin ?? createOwnIdeasAdminClient();

  return {
    async list() {
      const { data, error } = await fromTable(client, "ckr_own_ideas")
        .select("*")
        .eq("visibility", "OWNER_ONLY")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return ((data as OwnIdeaRow[]) || []).map(rowToIdea);
    },

    async get(id) {
      const { data, error } = await fromTable(client, "ckr_own_ideas")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      const idea = rowToIdea(data as OwnIdeaRow);
      if (idea.visibility !== "OWNER_ONLY") return undefined;
      return idea;
    },

    async getByFingerprint(fingerprint) {
      const { data, error } = await fromTable(client, "ckr_own_ideas")
        .select("*")
        .eq("fingerprint", fingerprint)
        .limit(1);
      if (error) throw error;
      const row = ((data as OwnIdeaRow[]) || [])[0];
      return row ? rowToIdea(row) : undefined;
    },

    async upsert(idea) {
      const { error } = await fromTable(client, "ckr_own_ideas").upsert(
        ideaToRow(idea) as unknown as Record<string, unknown>,
      );
      if (error) throw error;
    },

    async remove(id) {
      const { error } = await fromTable(client, "ckr_own_ideas").delete().eq("id", id);
      if (error) throw error;
    },

    async saveRun(metrics) {
      const { error } = await fromTable(client, "ckr_own_idea_runs").upsert(
        runToRow(metrics) as unknown as Record<string, unknown>,
      );
      if (error) throw error;
    },

    async lastRun() {
      const { data, error } = await fromTable(client, "ckr_own_idea_runs")
        .select("*")
        .order("finished_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const row = ((data as OwnIdeaRunRow[]) || [])[0];
      return row ? rowToRun(row) : null;
    },

    async listRuns() {
      const { data, error } = await fromTable(client, "ckr_own_idea_runs")
        .select("*")
        .order("finished_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return ((data as OwnIdeaRunRow[]) || []).map(rowToRun);
    },

    async reset() {
      throw new Error("Supabase own-ideas store does not support reset(); use exact-ID cleanup");
    },
  };
}
