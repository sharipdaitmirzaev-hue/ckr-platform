import type { UserFeedbackEventType } from "@/config/beta";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type TrackUserFeedbackInput = {
  eventType: UserFeedbackEventType;
  userId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  rating?: number | null;
  comment?: string;
};

/** Запись оценки ключевого действия. Не ломает основной сценарий. */
export async function trackUserFeedbackEvent(
  input: TrackUserFeedbackInput,
): Promise<void> {
  if (!hasSupabaseEnv()) return;
  try {
    const supabase = createClient();
    const { error } = await supabase.from("user_feedback_events").insert({
      user_id: input.userId ?? null,
      event_type: input.eventType,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      rating: input.rating ?? null,
      comment: input.comment ?? "",
    });
    if (error) {
      console.error("[beta] feedback event failed:", error.message);
    }
  } catch (error) {
    console.error("[beta] feedback event exception:", error);
  }
}
