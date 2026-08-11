/**
 * Server-only Supabase admin client for Business Graph persistence.
 */

import { createHeaderSafeFetch } from "@/lib/http/header-safe-fetch";
import {
  getSupabaseEnv,
  getSupabaseSecretKey,
  hasSupabaseSecretEnv,
} from "@/lib/supabase/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function canUseSupabaseBusinessGraph(): boolean {
  return hasSupabaseSecretEnv();
}

export function createBusinessGraphAdminClient(): SupabaseClient {
  if (!hasSupabaseSecretEnv()) {
    throw new Error(
      "Business Graph supabase store требует NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  const { url } = getSupabaseEnv();
  const key = getSupabaseSecretKey()!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createHeaderSafeFetch() },
  });
}
