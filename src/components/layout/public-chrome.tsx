"use client";

import { DemoBanner } from "@/components/demo/demo-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { usePathname } from "next/navigation";

type PublicChromeProps = {
  isAuthenticated: boolean;
  children: React.ReactNode;
};

/**
 * Stage 4I — first screen is chrome-free: logo/mission/CTAs only.
 * Other public pages keep a light header + footer.
 */
export function PublicChrome({ isAuthenticated, children }: PublicChromeProps) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <SiteHeader isAuthenticated={isAuthenticated} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
