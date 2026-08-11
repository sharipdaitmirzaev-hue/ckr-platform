/**
 * Server-only Supabase admin client for LIA OI persistence.
 * Never expose service_role to the frontend.
 */

import {
  getSupabaseSecretKey,
  getSupabaseEnv,
  hasSupabaseSecretEnv,
} from "@/lib/supabase/env";
import { createHeaderSafeFetch } from "@/lib/http/header-safe-fetch";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function canUseSupabaseOiStore(): boolean {
  return hasSupabaseSecretEnv();
}

export function createOiAdminClient(): SupabaseClient {
  if (!hasSupabaseSecretEnv()) {
    throw new Error(
      "LIA_OI_STORE=supabase требует NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY (или SUPABASE_SECRET_KEY).",
    );
  }
  const { url } = getSupabaseEnv();
  const key = getSupabaseSecretKey()!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createHeaderSafeFetch() },
  });
}
