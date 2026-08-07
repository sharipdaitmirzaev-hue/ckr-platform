import type { AnalyticsEventType } from "@/config/analytics";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Однократная метка controlled beta (first_* / onboarding_*).
 * Не бросает наружу.
 */
export async function trackBetaMilestone(input: {
  eventType: AnalyticsEventType;
  userId: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!hasSupabaseEnv() || !input.userId) return;

  try {
    const supabase = createClient();
    const { count } = await supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId)
      .eq("event_type", input.eventType);

    if ((count ?? 0) > 0) return;

    const { error } = await supabase.from("analytics_events").insert({
      user_id: input.userId,
      event_type: input.eventType,
      entity_type: input.entityType ?? "user",
      entity_id: input.entityId ?? input.userId,
      metadata: {
        ...(input.metadata ?? {}),
        channel: "controlled_beta",
      },
    });

    if (error) {
      console.error("[beta] milestone failed:", error.message);
    }
  } catch (error) {
    console.error("[beta] milestone exception:", error);
  }
}
