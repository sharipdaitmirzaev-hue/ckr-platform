import { ServiceViewTracker } from "@/components/analytics/service-view-tracker";
import { ServiceCard } from "@/components/billing/service-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  SERVICE_CATEGORIES,
  serviceCategoryLabels,
} from "@/config/monetization";
import { CKR_SERVICE_OFFERS } from "@/config/ckr-website";
import { siteConfig } from "@/config/site";
import { listActiveServices } from "@/lib/monetization/queries";
import { cn } from "@/lib/utils";
import type { ServiceCategory } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Услуги ЦКР",
  description:
    "Услуги ЦКР: аудит бизнеса, развитие проектов, партнёры, экспертиза, инвестиции и проектное управление.",
  openGraph: {
    title: `Услуги · ${siteConfig.name}`,
    description:
      "Публичный каталог услуг ЦКР на базе существующих services.",
    url: "/services",
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.name,
  },
  alternates: { canonical: "/services" },
};

export const dynamic = "force-dynamic";

type ServicesPageProps = {
  searchParams?: { category?: string };
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const category = SERVICE_CATEGORIES.includes(
    searchParams?.category as ServiceCategory,
  )
    ? (searchParams?.category as ServiceCategory)
    : null;

  const services = await listActiveServices(category);

  return (
    <div className="py-14 sm:py-16">
      <ServiceViewTracker category={category} />
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Услуги ЦКР"
            title="Комплексная поддержка бизнеса"
            description="Аудит, развитие проектов, партнёры, экспертиза, инвестиции и проектное управление — без новых модулей."
          />
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/lia?scenario=business_audit">
              Получить аудит
            </ButtonLink>
            <ButtonLink href="/contacts" variant="outline">
              Связаться
            </ButtonLink>
          </div>
        </div>

        <section className="mt-12 border-t border-border pt-10">
          <SectionHeading
            eyebrow="Категории"
            title="Что можно заказать"
            description="Для каждой услуги: описание, кому подходит, результат и CTA."
          />
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {CKR_SERVICE_OFFERS.map((offer) => (
              <article
                key={offer.id}
                className="flex flex-col border-l border-accent/40 pl-5"
              >
                <h3 className="font-display text-xl text-foreground">
                  {offer.label}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {offer.description}
                </p>
                <p className="mt-4 text-sm text-muted">
                  <span className="font-medium text-foreground">Кому: </span>
                  {offer.audience}
                </p>
                <p className="mt-2 text-sm text-muted">
                  <span className="font-medium text-foreground">Результат: </span>
                  {offer.result}
                </p>
                <p className="mt-3 text-xs text-muted">Цена по запросу</p>
                <div className="mt-5">
                  <ButtonLink href={offer.href} size="sm" variant="outline">
                    {offer.cta}
                  </ButtonLink>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-14 border-t border-border pt-8">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Каталог services
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/services"
              className={cn(
                "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                !category
                  ? "border-accent/50 bg-accent-muted text-accent"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              Все
            </Link>
            {SERVICE_CATEGORIES.map((item) => (
              <Link
                key={item}
                href={`/services?category=${item}`}
                className={cn(
                  "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                  category === item
                    ? "border-accent/50 bg-accent-muted text-accent"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                {serviceCategoryLabels[item]}
              </Link>
            ))}
          </div>
        </div>

        {services.length === 0 ? (
          <p className="mt-12 text-sm text-muted">
            Записи каталога пока пусты — используйте категории выше или аудит
            Лии.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                ctaHref={
                  service.category === "consulting"
                    ? "/lia?scenario=business_audit"
                    : "/contacts"
                }
                ctaLabel={
                  service.category === "consulting"
                    ? "Начать с аудита"
                    : "Оставить заявку"
                }
              />
            ))}
          </div>
        )}

        <div className="mt-16 border-t border-border pt-10">
          <Badge variant="soft">Цены</Badge>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Фиксированная цена — если задана в каталоге. Иначе «по запросу».
            Реальных платежей на сайте нет.
          </p>
        </div>
      </Container>
    </div>
  );
}
