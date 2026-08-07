import type { PilotMetricType } from "@/config/pilot";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type TrackPilotMetricInput = {
  eventType: PilotMetricType;
  userId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Метрика closed pilot → analytics_events.
 * Не бросает наружу — не ломает основной сценарий.
 */
export async function trackPilotMetric(
  input: TrackPilotMetricInput,
): Promise<void> {
  if (!hasSupabaseEnv()) return;

  try {
    const supabase = createClient();
    const { error } = await supabase.from("analytics_events").insert({
      user_id: input.userId ?? null,
      event_type: input.eventType,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: {
        ...(input.metadata ?? {}),
        channel: "closed_pilot",
      },
    });

    if (error) {
      console.error("[pilot] metric failed:", error.message);
    }
  } catch (error) {
    console.error("[pilot] metric exception:", error);
  }
}
