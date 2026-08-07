"use client";

import { trackLaunchFunnelEventAction } from "@/features/analytics/actions";
import { useEffect, useRef } from "react";

type Props = { caseId: string };

/** Beacon просмотра кейса (этап 65). */
export function CaseViewTracker({ caseId }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void trackLaunchFunnelEventAction({
      eventType: "case_viewed",
      path: "/cases",
      metadata: { caseId },
    });
    void trackLaunchFunnelEventAction({
      eventType: "case_view",
      path: "/cases",
      metadata: { caseId },
    });
  }, [caseId]);

  return null;
}
