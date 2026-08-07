import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type SystemLogLevel = "info" | "warning" | "error";

export type SystemLogInput = {
  level: SystemLogLevel;
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
};

/**
 * Запись в system_logs (+ console для локальной диагностики).
 * Не бросает наружу — логирование не должно ломать основной сценарий.
 */
export async function writeSystemLog(input: SystemLogInput): Promise<void> {
  const payload = {
    level: input.level,
    source: input.source.slice(0, 120),
    message: input.message.slice(0, 2000),
    metadata: input.metadata ?? {},
  };

  if (input.level === "error") {
    console.error(`[${payload.source}]`, payload.message, payload.metadata);
  } else if (input.level === "warning") {
    console.warn(`[${payload.source}]`, payload.message, payload.metadata);
  } else if (process.env.NODE_ENV !== "production") {
    console.info(`[${payload.source}]`, payload.message);
  }

  if (!hasSupabaseEnv()) return;

  try {
    const supabase = createClient();
    await supabase.rpc("write_system_log", {
      p_level: payload.level,
      p_source: payload.source,
      p_message: payload.message,
      p_metadata: payload.metadata,
    });
  } catch {
    // ignore
  }
}

export async function logApiError(input: {
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await writeSystemLog({
    level: "error",
    source: input.source,
    message: input.message,
    metadata: input.metadata,
  });
}

export async function logSystemEvent(input: {
  source: string;
  message: string;
  level?: SystemLogLevel;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await writeSystemLog({
    level: input.level ?? "info",
    source: input.source,
    message: input.message,
    metadata: input.metadata,
  });
}
