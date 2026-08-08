import { ensureUserBootstrap } from "@/lib/auth/ensure-user-bootstrap";
import { safeAuthNextPath, getSiteOrigin } from "@/lib/auth/redirects";
import {
  filterReadableAuthCookies,
  sanitizeCookieValue,
  SUPABASE_COOKIE_ENCODE,
  SUPABASE_COOKIE_ENCODING,
} from "@/lib/supabase/cookie-options";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Supabase Auth callback (PKCE / email confirm / password recovery).
 * redirect_to в письме должен указывать сюда (см. emailRedirectTo / redirectTo).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeAuthNextPath(requestUrl.searchParams.get("next"));
  const origin = getSiteOrigin();

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_missing_code`,
    );
  }

  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookieEncoding: SUPABASE_COOKIE_ENCODING,
    cookies: {
      encode: SUPABASE_COOKIE_ENCODE,
      getAll() {
        return filterReadableAuthCookies(cookieStore.getAll());
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, sanitizeCookieValue(name, value), options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed`,
    );
  }

  if (data.user) {
    try {
      await ensureUserBootstrap(supabase, data.user);
    } catch (bootstrapError) {
      console.error("[auth/callback] bootstrap failed:", bootstrapError);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
