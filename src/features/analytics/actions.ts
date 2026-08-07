"use server";

import type { AnalyticsEventType } from "@/config/analytics";
import { trackAnalyticsEvent } from "@/lib/analytics/track";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * Публичные события воронки первых пользователей (этап 49).
 * Можно вызывать с клиента; не ломает UX при ошибке.
 */
export async function trackLaunchFunnelEventAction(input: {
  eventType: Extract<
    AnalyticsEventType,
    | "public_page_view"
    | "registration_started"
    | "lia_started"
  >;
  path?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const current = await getCurrentUser();
    await trackAnalyticsEvent({
      eventType: input.eventType,
      userId: current?.user.id ?? null,
      entityType: input.path ? "page" : null,
      entityId: null,
      metadata: {
        path: input.path ?? null,
        channel: "first_users_launch",
        ...(input.metadata ?? {}),
      },
    });
  } catch (error) {
    // Клиентский beacon не должен ломать UX / registration form.
    console.error("[analytics] funnel action failed:", error);
  }
}
