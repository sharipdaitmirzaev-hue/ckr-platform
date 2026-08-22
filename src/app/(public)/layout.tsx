import { PublicPageViewTracker } from "@/components/analytics/public-page-view-tracker";
import { PublicChrome } from "@/components/layout/public-chrome";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();

  return (
    <>
      <PublicPageViewTracker />
      <PublicChrome isAuthenticated={Boolean(current)}>{children}</PublicChrome>
    </>
  );
}
