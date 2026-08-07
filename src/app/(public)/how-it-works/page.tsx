import { PublicLiaEntry } from "@/components/marketing/public-lia-entry";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  HOW_IT_WORKS_SECTIONS,
  HOW_IT_WORKS_STEPS,
  MARKETPLACE_JOURNEY,
} from "@/config/marketplace";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Как работает ЦКР",
  description:
    "Что такое ЦКР, как работает Лия, как создаются проекты, находятся ресурсы и появляются сделки.",
  openGraph: {
    title: "Как работает ЦКР",
    description:
      "Путь от идеи до реализации в экосистеме предпринимателей, инвесторов, экспертов и организаций.",
    url: "/how-it-works",
    type: "website",
    locale: siteConfig.ogLocale,
  },
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border py-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial opacity-80"
        />
        <Container className="relative max-w-3xl">
          <Badge variant="accent">Marketplace</Badge>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Как работает ЦКР
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            {MARKETPLACE_JOURNEY.join(" → ")}. Публичный интерфейс уже созданной
            платформы — без новых сущностей ради каталога.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/register" size="lg">
              Регистрация
            </ButtonLink>
            <ButtonLink href="/lia" variant="outline" size="lg">
              Спросить Лию
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="border-b border-border py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Путь"
            title="Шесть шагов экосистемы"
          />
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <li key={item.step} className="border-l border-accent/40 pl-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  {item.step}
                </p>
                <h3 className="mt-3 font-display text-xl text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="space-y-12">
          {HOW_IT_WORKS_SECTIONS.map((section) => (
            <div key={section.title} className="max-w-3xl border-l border-accent/40 pl-5">
              <h2 className="font-display text-2xl text-foreground">
                {section.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted">
                {section.text}
              </p>
            </div>
          ))}
        </Container>
      </section>

      <PublicLiaEntry />
    </>
  );
}
