import { Logo } from "@/components/brand/logo";
import { PartnerSidebar } from "@/components/partners/partner-sidebar";
import { Container } from "@/components/ui/container";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { BetaBadge } from "@/features/beta/components/beta-badge";
import { requirePartnerUser } from "@/lib/auth/require-partner";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await requirePartnerUser();
  const orgName = current.primary?.organization.name;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <BetaBadge />
            <p className="hidden text-sm text-muted sm:block">
              {orgName || "Партнёрская сеть ЦКР"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-muted transition-colors hover:text-accent"
            >
              Кабинет
            </Link>
            <LogoutButton />
          </div>
        </Container>
      </header>

      <Container className="grid gap-6 py-8 md:grid-cols-[240px_1fr] lg:gap-8">
        <PartnerSidebar />
        <div className="min-w-0">{children}</div>
      </Container>
    </div>
  );
}
