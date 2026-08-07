import { trackAnalyticsEvent } from "@/lib/analytics/track";

/** Событие активации после Product Fix Sprint (этап 52). */
export async function trackActivationAfterFix(input: {
  userId: string;
  entityType?: string | null;
  entityId?: string | null;
  source?: string;
}): Promise<void> {
  await trackAnalyticsEvent({
    eventType: "activation_after_fix",
    userId: input.userId,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    metadata: {
      source: input.source ?? "first_action",
      sprint: "product_fix",
    },
  });
}
