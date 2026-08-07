import { PricingCard } from "@/components/billing/pricing-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";
import { listActivePlans } from "@/lib/monetization/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тарифы",
  description:
    "Тарифы ЦКР: доступ к возможностям, сопровождение проектов и профессиональные услуги — не доска платных объявлений.",
  openGraph: {
    title: `Тарифы · ${siteConfig.name}`,
    description:
      "Подписки ЦКР для инвесторов, компаний, экспертов и enterprise.",
    url: "/pricing",
    type: "website",
    locale: siteConfig.ogLocale,
  },
  alternates: { canonical: "/pricing" },
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await listActivePlans();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border py-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial opacity-80"
        />
        <Container className="relative max-w-3xl">
          <Badge variant="accent">Монетизация ЦКР</Badge>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Тарифы, связанные с ценностью
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            ЦКР не продаёт «место в ленте». Подписка открывает доступ к
            возможностям, сопровождению проектов, сделкам и услугам платформы.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/dashboard/billing" size="lg">
              Кабинет оплаты
            </ButtonLink>
            <ButtonLink href="/services" variant="outline" size="lg">
              Услуги ЦКР
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Подписки"
            title="Выберите роль и уровень доступа"
            description="Инвестор, компания, эксперт или enterprise — у каждой роли свой путь ценности."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                highlighted={plan.type === "company"}
                ctaHref="/dashboard/billing"
                ctaLabel="Оформить в кабинете"
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Принцип"
            title="Комиссия за успешные сделки"
            description="Помимо подписок ЦКР предусматривает комиссию за сопровождённые сделки — fixed или percent. Статусы: ожидает · оплачена · отменена."
          />
          <p className="mt-6 text-sm leading-relaxed text-muted">
            Платежи (карта, СБП и другие провайдеры) подключим через
            PaymentProvider — сейчас доступна архитектура и mock-режим без
            реальных списаний.
          </p>
        </Container>
      </section>
    </div>
  );
}
