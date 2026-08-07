import {
  filterReadableAuthCookies,
  sanitizeCookieValue,
  SUPABASE_COOKIE_ENCODE,
  SUPABASE_COOKIE_ENCODING,
} from "@/lib/supabase/cookie-options";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type SessionResult = {
  response: NextResponse;
  user: User | null;
  supabase: SupabaseClient | null;
};

export async function updateSession(
  request: NextRequest,
): Promise<SessionResult> {
  let supabaseResponse = NextResponse.next({ request });

  if (!hasSupabaseEnv()) {
    return { response: supabaseResponse, user: null, supabase: null };
  }

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookieEncoding: SUPABASE_COOKIE_ENCODING,
    cookies: {
      encode: SUPABASE_COOKIE_ENCODE,
      getAll() {
        return filterReadableAuthCookies(request.cookies.getAll());
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, sanitizeCookieValue(name, value));
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(
            name,
            sanitizeCookieValue(name, value),
            options,
          );
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user, supabase };
}
