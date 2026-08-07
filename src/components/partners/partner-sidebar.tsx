"use client";

import { partnerNav } from "@/config/partners";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PartnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-sm border border-border bg-surface p-3 md:p-4">
      <p className="px-2 pb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted">
        Кабинет организации
      </p>
      <nav className="flex flex-col gap-1" aria-label="Навигация партнёра">
        {partnerNav.map((item) => {
          const active =
            item.href === "/partner"
              ? pathname === "/partner"
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
      <div className="mt-5 border-t border-border pt-3">
        <Link
          href="/lia"
          className="block rounded-sm px-3 py-2.5 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-accent"
        >
          Лия для организации
        </Link>
        <Link
          href="/dashboard"
          className="block rounded-sm px-3 py-2.5 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          Личный кабинет
        </Link>
      </div>
    </aside>
  );
}
