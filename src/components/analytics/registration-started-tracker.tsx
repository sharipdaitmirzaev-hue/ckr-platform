"use client";

import { trackLaunchFunnelEventAction } from "@/features/analytics/actions";
import { useEffect, useRef } from "react";

/** Один раз при открытии формы регистрации. */
export function RegistrationStartedTracker() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void trackLaunchFunnelEventAction({
      eventType: "registration_started",
      path: "/register",
    });
  }, []);

  return null;
}
