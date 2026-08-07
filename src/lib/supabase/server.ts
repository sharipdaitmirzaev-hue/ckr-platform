import {
  filterReadableAuthCookies,
  sanitizeCookieValue,
  SUPABASE_COOKIE_ENCODE,
  SUPABASE_COOKIE_ENCODING,
} from "@/lib/supabase/cookie-options";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookieEncoding: SUPABASE_COOKIE_ENCODING,
    cookies: {
      encode: SUPABASE_COOKIE_ENCODE,
      getAll() {
        return filterReadableAuthCookies(cookieStore.getAll());
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, sanitizeCookieValue(name, value), options);
          });
        } catch {
          // setAll может вызываться из Server Component — игнорируем.
        }
      },
    },
  });
}
