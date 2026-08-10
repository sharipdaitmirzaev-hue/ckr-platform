import { platformVersion } from "@/config/version";
import {
  getSupabaseHeaderSafetyReport,
  hasSupabaseEnv,
} from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public health check for Nginx / systemd / uptime monitors.
 * Не возвращает секреты и внутренние ошибки провайдеров.
 */
export async function GET() {
  const supabaseConfigured = hasSupabaseEnv();
  const headerSafety = getSupabaseHeaderSafetyReport();
  const headersOk = headerSafety.urlSafe && headerSafety.anonKeySafe;

  const body = {
    ok: headersOk,
    service: "ckr-platform",
    version: platformVersion.version,
    channel: platformVersion.channel,
    node: process.version,
    supabaseConfigured,
    supabaseHeadersSafe: headersOk,
    // Только индексы/флаги — без значений ключей.
    supabaseHeaderDiagnostics: {
      urlSafe: headerSafety.urlSafe,
      urlBadIndex: headerSafety.urlBadIndex,
      anonKeySafe: headerSafety.anonKeySafe,
      anonKeyBadIndex: headerSafety.anonKeyBadIndex,
      anonKeyLength: headerSafety.anonKeyLength,
      anonKeyKind: headerSafety.anonKeyKind,
    },
    timestamp: new Date().toISOString(),
  };

  return Response.json(body, {
    status: headersOk ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
