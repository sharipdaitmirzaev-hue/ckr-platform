"use client";

import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { authNav, mainNav } from "@/config/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type SiteHeaderProps = {
  isAuthenticated?: boolean;
};

export function SiteHeader({ isAuthenticated = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-[4.25rem]">
        <Logo size="md" />

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Основная навигация"
        >
          {mainNav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm tracking-wide transition-colors duration-200",
                  active ? "text-accent" : "text-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <ButtonLink
              href={authNav.dashboard.href}
              variant="primary"
              size="sm"
            >
              {authNav.dashboard.label}
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href={authNav.login.href} variant="ghost" size="sm">
                {authNav.login.label}
              </ButtonLink>
              <ButtonLink
                href={authNav.register.href}
                variant="primary"
                size="sm"
              >
                {authNav.register.label}
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border text-foreground md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">Меню</span>
          <span className="flex flex-col gap-1.5">
            <span
              className={cn(
                "block h-px w-4 bg-current transition-transform",
                open && "translate-y-[3.5px] rotate-45",
              )}
            />
            <span
              className={cn(
                "block h-px w-4 bg-current transition-opacity",
                open && "opacity-0",
              )}
            />
            <span
              className={cn(
                "block h-px w-4 bg-current transition-transform",
                open && "-translate-y-[3.5px] -rotate-45",
              )}
            />
          </span>
        </button>
      </Container>

      <div
        id="mobile-nav"
        className={cn(
          "border-t border-border bg-background md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <Container className="flex flex-col gap-1 py-4">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm px-2 py-2.5 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {isAuthenticated ? (
              <ButtonLink href={authNav.dashboard.href} variant="primary">
                {authNav.dashboard.label}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href={authNav.login.href} variant="ghost">
                  {authNav.login.label}
                </ButtonLink>
                <ButtonLink href={authNav.register.href} variant="primary">
                  {authNav.register.label}
                </ButtonLink>
              </>
            )}
          </div>
        </Container>
      </div>
    </header>
  );
}
