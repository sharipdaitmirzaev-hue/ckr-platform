import type { LaunchGoalEventType } from "@/config/launch-goals";
import { launchGoalEventLabels } from "@/config/launch-goals";
import { trackAnalyticsEvent } from "@/lib/analytics/track";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Связка analytics_events + activity_feed + notifications (system)
 * для событий целей / волн запуска.
 */
export async function emitLaunchGoalEvent(input: {
  eventType: LaunchGoalEventType;
  userId?: string | null;
  entityId?: string | null;
  title?: string;
  body?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!hasSupabaseEnv()) return;

  const title =
    input.title ?? launchGoalEventLabels[input.eventType] ?? input.eventType;
  const body = input.body ?? title;
  const link = "/admin/launch";

  try {
    await trackAnalyticsEvent({
      eventType: input.eventType,
      userId: input.userId ?? null,
      entityType: input.eventType.startsWith("launch_wave")
        ? "launch_wave"
        : "launch_goal",
      entityId: input.entityId ?? null,
      metadata: { ...input.metadata, channel: "wave_launch" },
    });
  } catch {
    // мягкий сбой
  }

  if (!input.userId) return;

  try {
    const supabase = createClient();

    await supabase.rpc("log_activity_feed", {
      p_user_id: input.userId,
      p_action_type: input.eventType,
      p_description: body,
      p_project_id: null,
      p_metadata: {
        ...(input.metadata ?? {}),
        entityId: input.entityId ?? null,
        link,
      },
    });

    await supabase.rpc("create_notification", {
      p_user_id: input.userId,
      p_type: "system",
      p_title: title,
      p_body: body,
      p_link: link,
      p_related_type: "system",
      p_related_id: input.entityId ?? null,
    });
  } catch {
    // мягкий сбой — не ломаем основной сценарий
  }
}
