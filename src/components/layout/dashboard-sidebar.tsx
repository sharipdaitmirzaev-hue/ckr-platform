"use client";

import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

type DashboardSidebarProps = {
  isAdmin?: boolean;
  items: NavItem[];
  accessLabel?: string;
};

export function DashboardSidebar({
  isAdmin = false,
  items,
  accessLabel,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="rounded-sm border border-border bg-surface p-3 md:p-4">
      <p className="px-2 pb-1 text-xs font-medium uppercase tracking-[0.18em] text-muted">
        Личный кабинет
      </p>
      {accessLabel ? (
        <p className="px-2 pb-3 text-[11px] text-muted">{accessLabel}</p>
      ) : (
        <div className="pb-2" />
      )}
      <nav className="flex flex-col gap-1" aria-label="Навигация кабинета">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "rounded-sm px-3 py-2.5 text-sm transition-colors duration-200",
                active
                  ? "bg-accent-muted text-accent"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {isAdmin ? (
        <>
          <p className="mt-5 px-2 pb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Админ
          </p>
          <nav className="flex flex-col gap-1" aria-label="Админ">
            <Link
              href="/admin/owner"
              className={cn(
                "rounded-sm px-3 py-2.5 text-sm transition-colors duration-200",
                pathname.startsWith("/admin/owner")
                  ? "bg-accent-muted text-accent"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              Кабинет владельца
            </Link>
            <Link
              href="/admin/owner/inbox"
              className={cn(
                "rounded-sm px-3 py-2.5 text-sm transition-colors duration-200",
                pathname.startsWith("/admin/owner/inbox")
                  ? "bg-accent-muted text-accent"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              Заявки
            </Link>
          </nav>
        </>
      ) : null}
    </aside>
  );
}
