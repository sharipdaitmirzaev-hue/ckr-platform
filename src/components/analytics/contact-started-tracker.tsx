"use client";

import { trackLaunchFunnelEventAction } from "@/features/analytics/actions";
import { useEffect, useRef } from "react";

/** Beacon открытия /contacts (этап 66). */
export function ContactStartedTracker() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void trackLaunchFunnelEventAction({
      eventType: "contact_started",
      path: "/contacts",
    });
  }, []);

  return null;
}
