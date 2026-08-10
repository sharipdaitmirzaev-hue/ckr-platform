import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { LogoutButton } from "@/features/auth/components/logout-button";
import Link from "next/link";

type AdminHeaderProps = {
  fullName: string;
  email: string;
};

export function AdminHeader({ fullName, email }: AdminHeaderProps) {
  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Logo size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              Админ-панель ЦКР
            </p>
            <p className="truncate text-xs text-muted">
              {fullName || email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="hidden text-sm text-accent transition-colors hover:text-foreground sm:inline"
          >
            Обзор
          </Link>
          <Link
            href="/operator"
            className="hidden text-sm text-muted transition-colors hover:text-accent sm:inline"
          >
            Оператор
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted transition-colors hover:text-accent"
          >
            Кабинет
          </Link>
          <Link
            href="/"
            className="hidden text-sm text-muted transition-colors hover:text-accent sm:inline"
          >
            На сайт
          </Link>
          <LogoutButton />
        </div>
      </Container>
    </header>
  );
}
