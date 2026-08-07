import { Logo } from "@/components/brand/logo";
import { PageNextStep } from "@/components/marketing/page-next-step";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/config/brand";
import { CKR_ABOUT, CKR_HOW_IT_WORKS } from "@/config/ckr-website";
import { siteConfig } from "@/config/site";
import { PAGE_NEXT_STEPS } from "@/config/website-final";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "О ЦКР",
  description: `${brand.name} — ${brand.fullName}. Миссия, принципы и роли участников экосистемы.`,
  openGraph: {
    title: `О ЦКР · ${siteConfig.name}`,
    description: CKR_ABOUT.mission,
    url: "/about",
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.name,
  },
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial"
        />
        <div
          aria-hidden
          className="ckr-grid-overlay pointer-events-none absolute inset-0 bg-hero-grid opacity-30"
        />
        <Container className="relative py-16 sm:py-20">
          <div className="max-w-3xl">
            <Logo size="lg" href="" />
            <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {brand.name} — {brand.fullName}
            </h1>
            <div aria-hidden className="mt-8 h-px w-28 origin-left bg-accent" />
            <p className="mt-8 font-display text-xl font-semibold text-accent sm:text-2xl">
              {brand.tagline}
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {CKR_ABOUT.mission}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/lia?scenario=business_audit" size="lg">
                Начать с аудита
              </ButtonLink>
              <ButtonLink href="/services" variant="outline" size="lg">
                Услуги
              </ButtonLink>
              <ButtonLink href="/contacts" variant="outline" size="lg">
                Контакты
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-border py-16 sm:py-20">
        <Container className="max-w-3xl space-y-10">
          <SectionHeading eyebrow="Миссия" title="Зачем существует ЦКР" />
          <p className="text-base leading-relaxed text-muted">
            {CKR_ABOUT.mission}
          </p>
          <SectionHeading eyebrow="Идея" title="Почему создан ЦКР" />
          <p className="text-base leading-relaxed text-muted">
            {CKR_ABOUT.idea}
          </p>
        </Container>
      </section>

      <section className="border-b border-border py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Принципы"
            title="На чём строится работа"
          />
          <ul className="mt-10 grid gap-8 sm:grid-cols-2">
            {CKR_ABOUT.principles.map((item, index) => (
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

      <section className="border-b border-border py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Как работаем"
            title="Путь участника"
            description={CKR_HOW_IT_WORKS.map((s) => s.title).join(" → ")}
          />
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CKR_HOW_IT_WORKS.map((item) => (
              <li key={item.step} className="border-l border-accent/40 pl-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  {item.step}
                </p>
                <h3 className="mt-2 font-display text-lg text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{item.text}</p>
              </li>
            ))}
          </ol>
          <ul className="mt-10 list-disc space-y-2 pl-5 text-sm text-muted">
            {CKR_ABOUT.howWeWork.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Роли"
            title="Участники экосистемы"
          />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {CKR_ABOUT.roles.map((role) => (
              <div key={role.title} className="border-t border-border pt-5">
                <h3 className="font-display text-xl text-foreground">
                  {role.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {role.text}
                </p>
                <Link
                  href={role.href}
                  className="mt-4 inline-flex text-sm text-accent hover:underline"
                >
                  Подробнее →
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Badge variant="soft">Кейс</Badge>
            <p className="mt-4 max-w-2xl text-sm text-muted">
              Первый production-кейс — ТИНДА. Реальные результаты отделены от
              планируемых шагов.
            </p>
            <div className="mt-6">
              <ButtonLink href="/cases" variant="outline">
                Смотреть кейсы
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
      <PageNextStep {...PAGE_NEXT_STEPS.about} />
    </>
  );
}
