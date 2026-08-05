import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { BetaBadge } from "@/features/beta/components/beta-badge";
import Link from "next/link";

type OperatorHeaderProps = {
  fullName: string;
  email: string;
  isPlatformAdmin: boolean;
};

export function OperatorHeader({
  fullName,
  email,
  isPlatformAdmin,
}: OperatorHeaderProps) {
  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Logo size="sm" />
          <BetaBadge className="shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              Операционный центр ЦКР
            </p>
            <p className="truncate text-xs text-muted">
              {fullName || email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/operator"
            className="hidden text-sm text-accent transition-colors hover:text-foreground sm:inline"
          >
            Обзор
          </Link>
          <Link
            href="/operator/tasks"
            className="text-sm text-muted transition-colors hover:text-accent"
          >
            Задачи
          </Link>
          {isPlatformAdmin ? (
            <Link
              href="/admin/crm"
              className="hidden text-sm text-muted transition-colors hover:text-accent sm:inline"
            >
              CRM
            </Link>
          ) : null}
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
  );
}
