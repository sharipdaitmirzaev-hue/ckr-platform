import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { requireAdmin } from "@/lib/auth/require-admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted">Админ · {current.user.fullName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/verifications"
              className="text-sm text-accent transition-colors hover:text-foreground"
            >
              Проверки
            </Link>
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
      <Container className="py-8">{children}</Container>
    </div>
  );
}
