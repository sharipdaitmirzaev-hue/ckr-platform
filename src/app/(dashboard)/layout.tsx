import { Logo } from "@/components/brand/logo";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Container } from "@/components/ui/container";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  resolveCabinetContext,
  resolveDashboardMoreNav,
  resolveDashboardNav,
} from "@/lib/cabinet/access";
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

  const cabinet = await resolveCabinetContext(current.user.id, current.roles);
  const navItems = resolveDashboardNav(cabinet);
  const moreItems = resolveDashboardMoreNav(cabinet);
  const accessLabel =
    cabinet.accessLevel === "basic"
      ? "Базовый кабинет"
      : cabinet.accessLevel === "standard"
        ? "Стандартный доступ"
        : "Расширенный доступ";

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <p className="hidden text-sm text-muted sm:block">
              {current.user.fullName || current.user.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/idea"
              className="hidden rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-white sm:inline"
            >
              + Новое обращение
            </Link>
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
        <DashboardSidebar
          isAdmin={current.roles.includes("admin")}
          items={navItems}
          moreItems={moreItems}
          accessLabel={accessLabel}
        />
        <div>{children}</div>
      </Container>
    </div>
  );
}
