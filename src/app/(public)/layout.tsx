import { DemoBanner } from "@/components/demo/demo-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <SiteHeader isAuthenticated={Boolean(current)} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
