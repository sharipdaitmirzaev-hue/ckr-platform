"use client";

import { partnerNav, partnerNavMore } from "@/config/partners";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function PartnerSidebar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <aside className="rounded-sm border border-border bg-surface p-3 md:p-4">
      <p className="px-2 pb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted">
        Моя компания
      </p>
      <nav className="flex flex-col gap-1" aria-label="Навигация компании">
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

      <div className="mt-4 border-t border-border pt-3">
        <button
          type="button"
          className="w-full rounded-sm px-3 py-2 text-left text-sm text-muted hover:bg-foreground/5 hover:text-foreground"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
        >
          Ещё {moreOpen ? "▴" : "▾"}
        </button>
        {moreOpen ? (
          <nav className="mt-1 flex flex-col gap-1" aria-label="Дополнительно">
            {partnerNavMore.map((item) => (
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
            <Link
              href="/lia"
              className="rounded-sm px-3 py-2 text-sm text-muted hover:bg-foreground/5 hover:text-accent"
            >
              Спросить Лию
            </Link>
          </nav>
        ) : null}
      </div>

      <div className="mt-3 border-t border-border pt-3">
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
