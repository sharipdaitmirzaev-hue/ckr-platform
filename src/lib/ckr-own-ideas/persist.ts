/**
 * Staging E2E persist helpers. Production owner UI uses supabase-store.
 */
import {
  createOwnIdeasAdminClient,
  createSupabaseOwnIdeaStore,
} from "@/lib/ckr-own-ideas/supabase-store";
import type { CkrOwnIdea, OwnIdeaRunMetrics } from "@/types/ckr-own-ideas";

export const ownIdeasAdminClient = createOwnIdeasAdminClient;

export async function persistOwnIdea(
  admin: ReturnType<typeof createOwnIdeasAdminClient>,
  idea: CkrOwnIdea,
) {
  await createSupabaseOwnIdeaStore(admin).upsert(idea);
}

export async function persistOwnIdeaRun(
  admin: ReturnType<typeof createOwnIdeasAdminClient>,
  metrics: OwnIdeaRunMetrics,
) {
  await createSupabaseOwnIdeaStore(admin).saveRun(metrics);
}

export async function deleteOwnIdeaExact(
  admin: ReturnType<typeof createOwnIdeasAdminClient>,
  id: string,
) {
  await createSupabaseOwnIdeaStore(admin).remove(id);
}

export async function deleteOwnIdeaRunExact(
  admin: ReturnType<typeof createOwnIdeasAdminClient>,
  id: string,
) {
  const q = admin as unknown as {
    from: (t: string) => { delete: () => { eq: (c: string, v: string) => Promise<unknown> } };
  };
  await q.from("ckr_own_idea_runs").delete().eq("id", id);
}
