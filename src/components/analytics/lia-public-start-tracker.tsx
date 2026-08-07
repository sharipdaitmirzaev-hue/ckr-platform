"use client";

import { trackLaunchFunnelEventAction } from "@/features/analytics/actions";
import { useEffect, useRef } from "react";

type Props = {
  scenario?: string | null;
  fromPublic?: boolean;
};

/** Beacon старта Лии с публичного входа (этап 65). */
export function LiaPublicStartTracker({
  scenario = null,
  fromPublic = true,
}: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (!fromPublic || sent.current) return;
    sent.current = true;
    void trackLaunchFunnelEventAction({
      eventType: "lia_started_from_public",
      path: "/lia",
      metadata: { scenario },
    });
    void trackLaunchFunnelEventAction({
      eventType: "lia_started",
      path: "/lia",
      metadata: { scenario, source: "public" },
    });
  }, [fromPublic, scenario]);

  return null;
}
