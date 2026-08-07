"use server";

import type { AnalyticsEventType } from "@/config/analytics";
import { trackAnalyticsEvent } from "@/lib/analytics/track";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * Публичные события воронки (этапы 49 / 65).
 * Можно вызывать с клиента; не ломает UX при ошибке.
 */
export async function trackLaunchFunnelEventAction(input: {
  eventType: Extract<
    AnalyticsEventType,
    | "public_page_view"
    | "registration_started"
    | "lia_started"
    | "homepage_view"
    | "lia_started_from_public"
    | "service_viewed"
    | "case_viewed"
    | "project_viewed"
  >;
  path?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const current = await getCurrentUser();
  await trackAnalyticsEvent({
    eventType: input.eventType,
    userId: current?.user.id ?? null,
    entityType: input.path ? "page" : null,
    entityId: null,
    metadata: {
      path: input.path ?? null,
      channel: "public_website",
      ...(input.metadata ?? {}),
    },
  });
}
