import { LegalReviewBanner } from "@/components/legal/legal-review-banner";
import { Container } from "@/components/ui/container";
import { LEGAL_PAGES } from "@/config/legal";
import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  title: string;
  children: ReactNode;
};

export function LegalPageShell({ title, children }: Props) {
  return (
    <section className="border-b border-border py-16 sm:py-20">
      <Container className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">
          Правовая информация
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <div className="mt-6">
          <LegalReviewBanner />
        </div>
        <div className="prose-ckr mt-10 space-y-5 text-sm leading-relaxed text-muted sm:text-base">
          {children}
        </div>
        <nav className="mt-12 border-t border-border pt-6" aria-label="Юридические страницы">
          <ul className="flex flex-wrap gap-4 text-sm">
            {LEGAL_PAGES.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className="text-accent hover:underline">
                  {page.short}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </section>
  );
}
