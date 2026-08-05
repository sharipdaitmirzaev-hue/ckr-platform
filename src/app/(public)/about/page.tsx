import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/config/brand";
import {
  aboutJourneyExtended,
  aboutRoles,
} from "@/config/product-features";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "О платформе",
  description: brand.positioning,
  openGraph: {
    title: `${brand.name} — ${brand.fullName}`,
    description: brand.positioning,
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
            <div
              aria-hidden
              className="mt-8 h-px w-28 origin-left bg-accent"
            />
            <p className="mt-8 font-display text-xl font-semibold text-accent sm:text-2xl">
              {brand.tagline}
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {brand.positioning}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/lia" size="lg">
                Начать с Лией
              </ButtonLink>
              <ButtonLink href="/features" variant="outline" size="lg">
                Функции платформы
              </ButtonLink>
              <ButtonLink href="/register" variant="outline" size="lg">
                Регистрация
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Что такое ЦКР"
            title="Не доска объявлений — путь к результату"
            description="Платформа соединяет предпринимателей, инвесторов, экспертов и организации вокруг реальных бизнес-задач."
          />
          <div className="mt-8 space-y-4 text-base leading-relaxed text-muted">
            <p>
              ЦКР помогает пройти путь от идеи до реализации: оформить проект,
              получить анализ, найти ресурсы и партнёров, провести сделку и
              измерить результат.
            </p>
            <p>
              Лия — ИИ-навигатор платформы — рекомендует следующий шаг, но не
              действует без подтверждения пользователя.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Как работает"
            title={brand.journey.join(" → ")}
            description="Единая логика сопровождения для всех ролей на платформе."
          />
          <ol className="mt-12 grid gap-8 md:grid-cols-5">
            {aboutJourneyExtended.map((item, index) => (
              <li key={item.title} className="border-l border-accent/40 pl-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-display text-lg text-foreground">
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

      <section className="border-t border-border py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Роли"
            title="Для кого создан ЦКР"
            description="Каждая роль закрывает свою сторону одной задачи — реализация проекта."
          />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {aboutRoles.map((role) => (
              <div key={role.title} className="border-t border-border pt-5">
                <h3 className="font-display text-xl text-foreground">
                  {role.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {role.text}
                </p>
                <Link
                  href={role.href}
                  className="mt-4 inline-flex text-sm text-accent transition-colors hover:underline"
                >
                  Подробнее →
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <Container className="max-w-3xl">
          <Badge variant="accent">Первый кейс</Badge>
          <h2 className="mt-4 font-display text-2xl text-foreground sm:text-3xl">
            Первый кейс — ТИНДА
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            ООО ТИНДА — пилот закрытого запуска: оптовая B2B-платформа упакована
            в проект ЦКР, прошла анализ Лии, получила workspace, CRM-сегменты,
            roadmap, KPI и подготовку результатов.
          </p>
          <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-muted">
            <li>Организация и проект в кабинете партнёра</li>
            <li>Сопровождение: этапы, сделки, roadmap</li>
            <li>Измерение: KPI, результаты, эффективность ЦКР</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/demo" variant="outline">
              Демо-режим
            </ButtonLink>
            <ButtonLink href="/features" variant="outline">
              Смотреть функции
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
