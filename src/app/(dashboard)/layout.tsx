import { Logo } from "@/components/brand/logo";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Container } from "@/components/ui/container";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between">
          <Logo size="sm" />
          <Link
            href="/"
            className="text-sm text-muted transition-colors hover:text-accent"
          >
            На сайт
          </Link>
        </Container>
      </header>

      <Container className="grid gap-6 py-8 md:grid-cols-[240px_1fr] lg:gap-8">
        <DashboardSidebar />
        <div>{children}</div>
      </Container>
    </div>
  );
}
