"use client";

import { liaOiOwnerNav } from "@/config/lia-oi";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function LiaOiNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Лия — Центр возможностей"
      className="flex flex-wrap gap-2 border-b border-border pb-4"
    >
      {liaOiOwnerNav.map((item) => {
        const active =
          item.href === "/admin/owner/lia"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm transition-colors",
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
  );
}
