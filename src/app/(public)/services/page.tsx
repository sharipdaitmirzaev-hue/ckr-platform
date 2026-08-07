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
import { PUBLIC_SERVICE_PACKAGES } from "@/config/public-website";
import { siteConfig } from "@/config/site";
import { listActiveServices } from "@/lib/monetization/queries";
import { cn } from "@/lib/utils";
import type { ServiceCategory } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Услуги ЦКР",
  description:
    "Услуги ЦКР: аудит бизнеса, сопровождение проектов, поиск партнёров, экспертиза и инвестиционное сопровождение. Цены фиксированные или по запросу.",
  openGraph: {
    title: `Услуги · ${siteConfig.name}`,
    description:
      "Упакованные услуги ЦКР на базе существующего каталога services.",
    url: "/services",
    type: "website",
    locale: siteConfig.ogLocale,
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
            title="Поддержка проектов без новых модулей"
            description="Аудит, сопровождение, партнёры, экспертиза и инвестиции — существующий каталог services, цены фиксированные или по запросу."
          />
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/lia?scenario=business_audit">
              Получить аудит
            </ButtonLink>
            <ButtonLink href="/pricing" variant="outline">
              Тарифы
            </ButtonLink>
          </div>
        </div>

        <section className="mt-12 border-t border-border pt-10">
          <SectionHeading
            eyebrow="Категории"
            title="С чего начать"
            description="Публичная упаковка существующих услуг."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_SERVICE_PACKAGES.map((pack) => (
              <div
                key={pack.id}
                className="border-l border-accent/40 pl-5"
              >
                <h3 className="font-display text-xl text-foreground">
                  {pack.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {pack.description}
                </p>
                <p className="mt-3 text-xs text-muted">Цена по запросу</p>
                <Link
                  href={pack.href}
                  className="mt-4 inline-flex text-sm text-accent hover:underline"
                >
                  {pack.cta} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Каталог услуг
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
            Активных услуг пока нет. Начните с аудита Лии или свяжитесь с
            командой ЦКР.
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
                    : "/register?next=/dashboard/billing"
                }
                ctaLabel={
                  service.category === "consulting"
                    ? "Начать с аудита"
                    : "Заказать"
                }
              />
            ))}
          </div>
        )}

        <div className="mt-16 border-t border-border pt-10">
          <Badge variant="soft">Цены</Badge>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Фиксированная цена показывается, если задана в каталоге. Иначе —
            «по запросу». Реальных платежей на этапе packaging нет
            (`PAYMENT_PROVIDER=mock`).
          </p>
        </div>
      </Container>
    </div>
  );
}
