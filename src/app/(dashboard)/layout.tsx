import { Logo } from "@/components/brand/logo";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Container } from "@/components/ui/container";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { BetaBadge } from "@/features/beta/components/beta-badge";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <BetaBadge />
            <p className="hidden text-sm text-muted sm:block">
              {current.user.fullName || current.user.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-muted transition-colors hover:text-accent"
            >
              На сайт
            </Link>
            <LogoutButton />
          </div>
        </Container>
      </header>

      <Container className="grid gap-6 py-8 md:grid-cols-[240px_1fr] lg:gap-8">
        <DashboardSidebar isAdmin={current.roles.includes("admin")} />
        <div>{children}</div>
      </Container>
    </div>
  );
}
