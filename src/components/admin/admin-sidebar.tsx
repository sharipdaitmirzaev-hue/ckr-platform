"use client";

import { adminStageArchiveNav } from "@/config/admin";
import {
  operatorPrimaryNav,
  operatorSystemNav,
  type NavItem,
} from "@/config/navigation";
import { isStaffAdminPath } from "@/config/staff";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type AdminSidebarProps = {
  isPlatformAdmin?: boolean;
};

function canShowNavItem(href: string, isPlatformAdmin: boolean) {
  if (href === "/admin/owner" || href.startsWith("/admin/owner/")) {
    return isPlatformAdmin;
  }
  if (isPlatformAdmin) return true;
  if (href === "/operator" || href === "/partner") return true;
  return isStaffAdminPath(href);
}

function isActive(pathname: string, href: string) {
  if (href === "/admin/owner") {
    return pathname === "/admin" || pathname === "/admin/owner";
  }
  if (href === "/operator/tasks") {
    return pathname.startsWith("/operator/tasks") || pathname === "/operator";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  return (
    <>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
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
            <span className="block">{item.label}</span>
            {item.description ? (
              <span className="mt-0.5 block text-xs text-muted/80">
                {item.description}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}

export function AdminSidebar({ isPlatformAdmin = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const [systemOpen, setSystemOpen] = useState(false);

  const primary = operatorPrimaryNav.filter((item) =>
    canShowNavItem(item.href, isPlatformAdmin),
  );
  const system = [
    ...operatorSystemNav,
    ...(isPlatformAdmin ? adminStageArchiveNav : []),
  ].filter((item) => canShowNavItem(item.href, isPlatformAdmin));

  const mobilePrimary = [
    { label: "Заявки", href: "/admin/owner/inbox" },
    { label: "Поиск", href: "/admin/owner/discovery" },
    { label: "Задачи", href: "/operator/tasks" },
    { label: "Компании", href: "/admin/owner/companies" },
  ].filter((item) => canShowNavItem(item.href, isPlatformAdmin));

  return (
    <>
      <aside className="hidden rounded-sm border border-border bg-surface p-3 md:block md:p-4">
        <p className="px-2 pb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted">
          {isPlatformAdmin ? "Работа ЦКР" : "Панель оператора"}
        </p>
        <nav className="flex flex-col gap-1" aria-label="Основная навигация">
          <NavLinks items={primary} pathname={pathname} />
        </nav>

        {system.length > 0 ? (
          <div className="mt-4 border-t border-border pt-3">
            <button
              type="button"
              className="w-full rounded-sm px-3 py-2 text-left text-sm text-muted hover:bg-foreground/5 hover:text-foreground"
              onClick={() => setSystemOpen((v) => !v)}
              aria-expanded={systemOpen}
            >
              Ещё → Система {systemOpen ? "▴" : "▾"}
            </button>
            {systemOpen ? (
              <nav
                className="mt-1 flex flex-col gap-1"
                aria-label="Системные инструменты"
              >
                <NavLinks items={system} pathname={pathname} />
              </nav>
            ) : null}
          </div>
        ) : null}
      </aside>

      {/* Mobile operator nav — UX B */}
      <nav
        aria-label="Мобильная навигация сотрудника"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur-md md:hidden"
      >
        {mobilePrimary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 py-3 text-center text-[11px]",
              isActive(pathname, item.href) ? "text-accent" : "text-muted",
            )}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/admin/owner"
          className={cn(
            "flex-1 py-3 text-center text-[11px]",
            pathname.startsWith("/admin") &&
              !mobilePrimary.some((i) => isActive(pathname, i.href))
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
