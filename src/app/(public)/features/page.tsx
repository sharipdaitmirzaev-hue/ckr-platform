import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/config/brand";
import { productFeatures } from "@/config/product-features";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Функции платформы",
  description:
    "Лия, проекты, инвестиции, эксперты, сделки, сопровождение и аналитика ЦКР.",
  openGraph: {
    title: `Функции · ${siteConfig.name}`,
    description:
      "Возможности платформы ЦКР: от идеи и анализа до реализации и результата.",
    url: "/features",
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.name,
  },
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial"
        />
        <Container className="relative py-16 sm:py-20">
          <div className="max-w-3xl">
            <Logo size="md" href="" />
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-accent">
              {brand.name}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Функции платформы ЦКР
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Всё необходимое для пути{" "}
              <span className="text-foreground">
                {brand.journey.join(" → ")}
              </span>
              — без разрозненных сервисов.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/lia" size="lg">
                Открыть Лию
              </ButtonLink>
              <ButtonLink href="/about" variant="outline" size="lg">
                О платформе
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Возможности ЦКР"
            title="Что умеет платформа"
            description="Ключевые контуры закрытого пилота 1.0 — от навигации Лии до измерения результата."
          />
          <ul className="mt-12 grid gap-8 md:grid-cols-2">
            {productFeatures.map((feature, index) => (
              <li
                key={feature.id}
                className="border-t border-border pt-6"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 font-display text-xl text-foreground">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {feature.text}
                </p>
                <Link
                  href={feature.href}
                  className="mt-4 inline-flex text-sm text-accent transition-colors hover:underline"
                >
                  Перейти →
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Старт"
            title="Начните с проекта или Лии"
            description="Регистрация → онбординг → первый проект. Для демонстрации доступен демо-режим и кейс ТИНДА."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href="/register">Регистрация</ButtonLink>
            <ButtonLink href="/projects" variant="outline">
              Каталог проектов
            </ButtonLink>
            <ButtonLink href="/demo" variant="outline">
              Демо
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
