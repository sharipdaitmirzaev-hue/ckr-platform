"use client";

import { cabinetNav } from "@/config/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CabinetSidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-sm border border-border bg-surface p-3 md:p-4">
      <p className="px-2 pb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted">
        Личный кабинет
      </p>
      <nav className="flex flex-col gap-1" aria-label="Навигация кабинета">
        {cabinetNav.map((item) => {
          const active =
            item.href === "/cabinet"
              ? pathname === "/cabinet"
              : pathname.startsWith(item.href);

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
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
