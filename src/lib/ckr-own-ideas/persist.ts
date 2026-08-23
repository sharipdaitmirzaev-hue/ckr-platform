/**
 * Optional Supabase persist for staging E2E. Never used against production
 * unless OWNER_ONLY RLS + staging guard are in place.
 */
import { createClient } from "@supabase/supabase-js";
import type { CkrOwnIdea, OwnIdeaRunMetrics } from "@/types/ckr-own-ideas";

type Admin = ReturnType<typeof createClient>;

type UntypedTable = {
  upsert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  delete: () => { eq: (col: string, val: string) => Promise<unknown> };
};

function table(admin: Admin, name: "ckr_own_ideas" | "ckr_own_idea_runs"): UntypedTable {
  return (admin as unknown as { from: (t: string) => UntypedTable }).from(name);
}

export function ownIdeasAdminClient(): Admin {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.CKR_STAGING_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CKR_STAGING_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing staging Supabase URL/key");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function persistOwnIdea(admin: Admin, idea: CkrOwnIdea) {
  const { error } = await table(admin, "ckr_own_ideas").upsert({
      id: idea.id,
      title: idea.title,
      essence: idea.essence,
      why_noticed: idea.whyNoticed,
      rating: idea.rating,
      owner_state: idea.ownerState,
      visibility: idea.visibility,
      components: idea.components,
      missing: idea.missing,
      economics: idea.economics,
      risks: idea.risks,
      next_checks: idea.nextChecks,
      fingerprint: idea.fingerprint,
      owner_locked_fields: idea.ownerLockedFields,
      project_id: idea.projectId,
      run_id: idea.runId,
      marker: idea.marker,
      created_at: idea.createdAt,
      updated_at: idea.updatedAt,
      events: idea.events,
    });
  if (error) throw error;
}

export async function persistOwnIdeaRun(admin: Admin, metrics: OwnIdeaRunMetrics) {
  const { error } = await table(admin, "ckr_own_idea_runs").upsert({
      id: metrics.runId,
      started_at: metrics.startedAt,
      finished_at: metrics.finishedAt,
      duration_ms: metrics.durationMs,
      metrics,
    });
  if (error) throw error;
}

export async function deleteOwnIdeaExact(admin: Admin, id: string) {
  await table(admin, "ckr_own_ideas").delete().eq("id", id);
}

export async function deleteOwnIdeaRunExact(admin: Admin, id: string) {
  await table(admin, "ckr_own_idea_runs").delete().eq("id", id);
}
