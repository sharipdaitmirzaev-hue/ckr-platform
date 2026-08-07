"use client";

import { trackLaunchFunnelEventAction } from "@/features/analytics/actions";
import { useEffect, useRef } from "react";

/** Beacon просмотра главной (этап 65). */
export function HomepageViewTracker() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void trackLaunchFunnelEventAction({
      eventType: "homepage_view",
      path: "/",
    });
  }, []);

  return null;
}
