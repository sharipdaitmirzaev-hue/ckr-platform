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
    cookies: {
      encode: SUPABASE_COOKIE_ENCODE,
    },
  });
}
