"use client";

import { adminNavItems } from "@/config/admin";
import { isStaffAdminPath } from "@/config/staff";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminSidebarProps = {
  isPlatformAdmin?: boolean;
};

function canShowNavItem(href: string, isPlatformAdmin: boolean) {
  if (isPlatformAdmin) return true;
  if (href === "/operator" || href === "/partner") return true;
  return isStaffAdminPath(href);
}

export function AdminSidebar({ isPlatformAdmin = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const items = adminNavItems.filter((item) =>
    canShowNavItem(item.href, isPlatformAdmin),
  );

  return (
    <aside className="rounded-sm border border-border bg-surface p-3 md:p-4">
      <p className="px-2 pb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted">
        {isPlatformAdmin ? "Панель администратора" : "Панель оператора"}
      </p>
      <nav className="flex flex-col gap-1" aria-label="Админ-навигация">
        {items.map((item) => {
          const active =
            item.href === "/admin/dashboard"
              ? pathname === "/admin" ||
                pathname === "/admin/dashboard" ||
                pathname.startsWith("/admin/dashboard/")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
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
      </nav>
    </aside>
  );
}
