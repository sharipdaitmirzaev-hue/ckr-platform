import { createHeaderSafeFetch } from "@/lib/http/header-safe-fetch";
import {
  SUPABASE_COOKIE_ENCODE,
  SUPABASE_COOKIE_ENCODING,
} from "@/lib/supabase/cookie-options";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey, {
    cookieEncoding: SUPABASE_COOKIE_ENCODING,
    global: {
      fetch: createHeaderSafeFetch(),
    },
    cookies: {
      encode: SUPABASE_COOKIE_ENCODE,
    },
  });
}
