"use server";

import type { AnalyticsEventType } from "@/config/analytics";
import { trackAnalyticsEvent } from "@/lib/analytics/track";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * Публичные события сайта ЦКР (этапы 49 / 65 / 66).
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
    | "website_view"
    | "service_view"
    | "project_view"
    | "case_view"
    | "contact_started"
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
      channel: "ckr_website",
      ...(input.metadata ?? {}),
    },
  });
}
