import { ServiceCard } from "@/components/billing/service-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  SERVICE_CATEGORIES,
  serviceCategoryLabels,
} from "@/config/monetization";
import { siteConfig } from "@/config/site";
import { listActiveServices } from "@/lib/monetization/queries";
import { cn } from "@/lib/utils";
import type { ServiceCategory } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Услуги ЦКР",
  description:
    "Профессиональные услуги ЦКР: бизнес-план, право, маркетинг, консалтинг, поиск инвестиций и сопровождение проектов.",
  openGraph: {
    title: `Услуги · ${siteConfig.name}`,
    description:
      "Услуги ЦКР помогают реализовать проект — от плана до сопровождения сделки.",
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
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Услуги ЦКР"
            title="Профессиональная поддержка проектов"
            description="Не объявления — экспертиза и сопровождение, которые ускоряют путь от идеи к результату."
          />
          <ButtonLink href="/pricing" variant="outline">
            Смотреть тарифы
          </ButtonLink>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Категория
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
            Активных услуг пока нет. Свяжитесь с командой ЦКР.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                ctaHref="/dashboard/billing"
              />
            ))}
          </div>
        )}

        <div className="mt-16 border-t border-border pt-10">
          <Badge variant="soft">Связь с ценностью</Badge>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Услуги дополняют подписки и комиссии по сделкам: бизнес-план,
            юридическая поддержка, маркетинг, поиск капитала и ведение проекта
            в кабинете ЦКР.
          </p>
        </div>
      </Container>
    </div>
  );
}
