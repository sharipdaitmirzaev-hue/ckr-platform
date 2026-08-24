/**
 * Request-scoped OwnIdeaStore. Production default is Supabase (RLS is_admin).
 * Memory is only for unit tests / explicit local fixtures.
 */
import { createClient } from "@/lib/supabase/server";
import {
  getOwnIdeaStoreOverride,
  memoryOwnIdeaStore,
  resolveOwnIdeaStoreMode,
  type OwnIdeaStore,
} from "@/lib/ckr-own-ideas/store";
import { createSupabaseOwnIdeaStore } from "@/lib/ckr-own-ideas/supabase-store";

export function getOwnIdeaStore(): OwnIdeaStore {
  const override = getOwnIdeaStoreOverride();
  if (override) return override;
  if (resolveOwnIdeaStoreMode() === "memory") return memoryOwnIdeaStore;
  return createSupabaseOwnIdeaStore(createClient());
}
