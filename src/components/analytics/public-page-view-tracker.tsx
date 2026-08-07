"use client";

import { trackLaunchFunnelEventAction } from "@/features/analytics/actions";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Клиентский beacon просмотра публичных страниц. */
export function PublicPageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    void trackLaunchFunnelEventAction({
      eventType: "public_page_view",
      path: pathname,
    });
  }, [pathname]);

  return null;
}
