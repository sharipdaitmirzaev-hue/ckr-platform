"use client";

import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type DashboardSidebarProps = {
  isAdmin?: boolean;
  items: NavItem[];
  moreItems?: NavItem[];
  accessLabel?: string;
  newRequestHref?: string;
};

export function DashboardSidebar({
  isAdmin = false,
  items,
  moreItems = [],
  accessLabel,
  newRequestHref = "/idea",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <aside className="hidden rounded-sm border border-border bg-surface p-3 md:block md:p-4">
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

        <Link
          href={newRequestHref}
          className="mt-4 flex items-center justify-center rounded-sm bg-accent px-3 py-2.5 text-sm font-medium text-white"
        >
          + Новое обращение
        </Link>

        {moreItems.length > 0 ? (
          <div className="mt-4 border-t border-border pt-3">
            <button
              type="button"
              className="w-full rounded-sm px-3 py-2 text-left text-sm text-muted hover:bg-foreground/5 hover:text-foreground"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
            >
              Ещё / Инструменты {moreOpen ? "▴" : "▾"}
            </button>
            {moreOpen ? (
              <nav className="mt-1 flex flex-col gap-1" aria-label="Инструменты">
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-sm px-3 py-2 text-sm transition-colors",
                      pathname.startsWith(item.href)
                        ? "bg-accent-muted text-accent"
                        : "text-muted hover:bg-foreground/5 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>
        ) : null}

        {isAdmin ? (
          <>
            <p className="mt-5 px-2 pb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Работа ЦКР
            </p>
            <nav className="flex flex-col gap-1" aria-label="Админ">
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
              <Link
                href="/admin/owner"
                className={cn(
                  "rounded-sm px-3 py-2.5 text-sm transition-colors duration-200",
                  pathname === "/admin/owner"
                    ? "bg-accent-muted text-accent"
                    : "text-muted hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                Кабинет сотрудника
              </Link>
            </nav>
          </>
        ) : null}
      </aside>

      {/* Mobile bottom nav — UX B: Главная · Обращения · Возможности · Ещё */}
      <nav
        aria-label="Мобильная навигация"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur-md md:hidden"
      >
        {[
          { label: "Главная", href: "/dashboard" },
          { label: "Обращения", href: "/dashboard/ckr-requests" },
          { label: "Возможности", href: "/dashboard/for-you" },
        ].map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 py-3 text-center text-xs",
                active ? "text-accent" : "text-muted",
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex-1 py-3 text-center text-xs",
            pathname.startsWith("/partner") ||
              pathname.startsWith("/dashboard/settings") ||
              moreItems.some((i) => pathname.startsWith(i.href))
              ? "text-accent"
              : "text-muted",
          )}
        >
          Ещё
        </Link>
      </nav>
    </>
  );
}
