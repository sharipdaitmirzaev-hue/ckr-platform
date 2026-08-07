import { platformVersion } from "@/config/version";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public health check for Nginx / systemd / uptime monitors.
 * Не возвращает секреты и внутренние ошибки провайдеров.
 */
export async function GET() {
  const supabaseConfigured = hasSupabaseEnv();
  const body = {
    ok: true,
    service: "ckr-platform",
    version: platformVersion.version,
    channel: platformVersion.channel,
    node: process.version,
    supabaseConfigured,
    timestamp: new Date().toISOString(),
  };

  return Response.json(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
