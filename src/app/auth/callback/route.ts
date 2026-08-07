import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

/**
 * Обмен code → session для email confirmation и password reset.
 * Redirect URL в Supabase Auth должен указывать на этот путь (через SITE_URL).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const origin = url.origin;

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=auth_callback`,
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
