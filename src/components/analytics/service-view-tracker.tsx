"use client";

import { trackLaunchFunnelEventAction } from "@/features/analytics/actions";
import { useEffect, useRef } from "react";

type Props = { category?: string | null };

/** Beacon просмотра /services (этап 65). */
export function ServiceViewTracker({ category = null }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void trackLaunchFunnelEventAction({
      eventType: "service_viewed",
      path: "/services",
      metadata: { category },
    });
  }, [category]);

  return null;
}
