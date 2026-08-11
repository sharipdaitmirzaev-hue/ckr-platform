/**
 * BUSINESS_GRAPH_STORE=memory|supabase
 * supabase requires migration applied + service role key.
 */

import { hasSupabaseSecretEnv } from "@/lib/supabase/env";

export type BusinessGraphStoreMode = "memory" | "supabase";

export function resolveBusinessGraphStoreMode(
  override?: string | null,
): BusinessGraphStoreMode {
  const raw = (override ?? process.env.BUSINESS_GRAPH_STORE ?? "memory")
    .trim()
    .toLowerCase();
  if (raw === "supabase") {
    if (!hasSupabaseSecretEnv()) {
      throw new Error(
        "BUSINESS_GRAPH_STORE=supabase требует NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY (или SUPABASE_SECRET_KEY).",
      );
    }
    return "supabase";
  }
  return "memory";
}

export function canUseSupabaseBusinessGraphStore(): boolean {
  return hasSupabaseSecretEnv();
}
