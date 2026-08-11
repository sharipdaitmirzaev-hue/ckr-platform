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

type Fetch = typeof fetch;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Transient undici/network failures during sequential OI writes. */
function createRetryingFetch(baseFetch: Fetch, attempts = 4): Fetch {
  return async (input, init) => {
    let lastError: unknown;
    for (let i = 0; i < attempts; i += 1) {
      try {
        const res = await baseFetch(input, init);
        if (res.status >= 500 && i < attempts - 1) {
          await sleep(150 * 2 ** i);
          continue;
        }
        return res;
      } catch (error) {
        lastError = error;
        const msg = error instanceof Error ? error.message : String(error);
        const retryable =
          msg.includes("fetch failed") ||
          msg.includes("ECONNRESET") ||
          msg.includes("ETIMEDOUT") ||
          msg.includes("socket");
        if (!retryable || i === attempts - 1) throw error;
        await sleep(150 * 2 ** i);
      }
    }
    throw lastError;
  };
}

export function createOiAdminClient(): SupabaseClient {
  if (!hasSupabaseSecretEnv()) {
    throw new Error(
      "LIA_OI_STORE=supabase требует NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY (или SUPABASE_SECRET_KEY).",
    );
  }
  const { url } = getSupabaseEnv();
  const key = getSupabaseSecretKey()!;
  const safeFetch = createHeaderSafeFetch();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createRetryingFetch(safeFetch) },
  });
}
