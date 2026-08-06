import { PublicLiaEntry } from "@/components/marketing/public-lia-entry";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/config/brand";
import { TRUST_PAGE } from "@/config/first-users";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Доверие",
  description:
    "Что такое ЦКР, как работает платформа и на каких принципах строится доверие участников.",
  openGraph: {
    title: `Доверие · ${siteConfig.name}`,
    description: TRUST_PAGE.whatIsCkr.goal,
    url: "/trust",
    type: "website",
    locale: siteConfig.ogLocale,
  },
  alternates: { canonical: "/trust" },
};

export default function TrustPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border py-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial opacity-80"
        />
        <Container className="relative max-w-3xl">
          <Badge variant="accent">Доверие</Badge>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Почему ЦКР можно использовать для серьёзных решений
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            {brand.tagline} Прозрачный контур, проверка участников и понятная
            ответственность сторон.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/register" size="lg">
              Начать
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="outline" size="lg">
              Как работает
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="border-b border-border py-16 sm:py-20">
        <Container className="max-w-3xl space-y-10">
          <SectionHeading eyebrow="Что такое ЦКР" title="Цель и аудитория" />
          <div className="space-y-6 text-base leading-relaxed text-muted">
            <p>
              <span className="font-medium text-foreground">Цель: </span>
              {TRUST_PAGE.whatIsCkr.goal}
            </p>
            <p>
              <span className="font-medium text-foreground">Проблема: </span>
              {TRUST_PAGE.whatIsCkr.problem}
            </p>
            <p>
              <span className="font-medium text-foreground">Для кого: </span>
              {TRUST_PAGE.whatIsCkr.audience}
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-border py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Как работает"
            title="Путь от идеи до реализации"
            description={TRUST_PAGE.journey.join(" → ")}
          />
          <ol className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            {TRUST_PAGE.journey.map((step, index) => (
              <li key={step} className="flex items-center gap-3">
                {index > 0 ? (
                  <span className="hidden text-muted sm:inline">↓</span>
                ) : null}
                <span className="border-l border-accent/40 pl-4 font-display text-xl text-foreground">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-muted">
            Подробнее — на странице{" "}
            <Link href="/how-it-works" className="text-accent hover:underline">
              Как работает ЦКР
            </Link>
            .
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Принципы"
            title="На чём строится доверие"
          />
          <ul className="mt-10 grid gap-8 sm:grid-cols-2">
            {TRUST_PAGE.principles.map((item, index) => (
              <li key={item.title} className="border-l border-accent/40 pl-5">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  0{index + 1}
                </p>
                <h3 className="mt-3 font-display text-xl text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href="/cases" variant="outline">
              Кейсы
            </ButtonLink>
            <ButtonLink href="/about" variant="outline">
              О платформе
            </ButtonLink>
          </div>
        </Container>
      </section>

      <PublicLiaEntry compact />
    </>
  );
}
