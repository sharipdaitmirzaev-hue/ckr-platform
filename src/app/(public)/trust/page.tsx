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
    "Как работает ЦКР: роли, репутация, история и прозрачность для серьёзных решений.",
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
            {brand.tagline} Прозрачный контур, роли, репутация и понятная
            ответственность сторон.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/lia?scenario=business_audit" size="lg">
              Начать с аудита
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="outline" size="lg">
              Как работает
            </ButtonLink>
            <ButtonLink href="/register" variant="outline" size="lg">
              Регистрация
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

      <section className="border-b border-border py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Роли"
            title="Кто участвует в экосистеме"
            description="Четыре стороны одной задачи — с понятными путями."
          />
          <ul className="mt-10 grid gap-8 sm:grid-cols-2">
            {TRUST_PAGE.roles.map((role) => (
              <li key={role.title} className="border-l border-accent/40 pl-5">
                <h3 className="font-display text-xl text-foreground">
                  {role.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {role.text}
                </p>
                <Link
                  href={role.href}
                  className="mt-3 inline-flex text-sm text-accent hover:underline"
                >
                  Подробнее →
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-b border-border py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Репутация" title="Как строится доверие" />
            <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted sm:text-base">
              {TRUST_PAGE.reputation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="История" title="Как развивалась платформа" />
            <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted sm:text-base">
              {TRUST_PAGE.history.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-6">
              <ButtonLink href="/cases" variant="outline" size="sm">
                Кейс ТИНДА
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Прозрачность"
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
        </Container>
      </section>

      <PublicLiaEntry compact />
    </>
  );
}
