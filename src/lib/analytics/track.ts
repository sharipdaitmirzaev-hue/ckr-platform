import type { AnalyticsEventType } from "@/config/analytics";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type TrackAnalyticsInput = {
  eventType: AnalyticsEventType;
  userId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Запись события аналитики. Не бросает наружу — не ломает основной сценарий.
 */
export async function trackAnalyticsEvent(
  input: TrackAnalyticsInput,
): Promise<void> {
  if (!hasSupabaseEnv()) return;

  try {
    const supabase = createClient();
    const { error } = await supabase.from("analytics_events").insert({
      user_id: input.userId ?? null,
      event_type: input.eventType,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      console.error("[analytics] track failed:", error.message);
    }
  } catch (error) {
    console.error("[analytics] track exception:", error);
  }
}
