import { hasSupabaseSecretEnv } from "@/lib/supabase/env";

export type NeedProfileStoreMode = "memory" | "supabase";

export function resolveNeedProfileStoreMode(
  override?: string | null,
): NeedProfileStoreMode {
  const raw = (override ?? process.env.NEED_PROFILE_STORE ?? "memory")
    .trim()
    .toLowerCase();
  if (raw === "supabase") {
    if (!hasSupabaseSecretEnv()) {
      throw new Error(
        "NEED_PROFILE_STORE=supabase требует NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
    return "supabase";
  }
  return "memory";
}
