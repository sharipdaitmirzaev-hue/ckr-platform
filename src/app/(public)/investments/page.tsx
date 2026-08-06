import { CatalogFilterBar } from "@/components/catalog/catalog-filter-bar";
import { InvestmentCard } from "@/components/investments/investment-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  AMOUNT_FILTERS,
  INVESTMENT_DIRECTIONS,
  INVESTMENT_TYPES,
  investmentTypeLabels,
  type AmountFilterId,
} from "@/config/investments";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { maskDisplayName } from "@/lib/demo/mode";
import { listPublishedInvestmentOffers } from "@/lib/investments/queries";
import type { InvestmentType } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Инвестиции",
  description:
    "Инвестиционные предложения ЦКР: фильтры по отрасли, сумме и типу участия.",
  openGraph: {
    title: "Инвестиции · ЦКР",
    description: "Капитал и форматы участия для проектов экосистемы.",
    url: "/investments",
    type: "website",
  },
  alternates: { canonical: "/investments" },
};

export const dynamic = "force-dynamic";

type InvestmentsPageProps = {
  searchParams?: {
    amount?: string;
    category?: string;
    type?: string;
  };
};

export default async function InvestmentsPage({
  searchParams,
}: InvestmentsPageProps) {
  const amount = AMOUNT_FILTERS.some((item) => item.id === searchParams?.amount)
    ? (searchParams?.amount as AmountFilterId)
    : null;
  const category = INVESTMENT_DIRECTIONS.some(
    (item) => item.slug === searchParams?.category,
  )
    ? searchParams?.category
    : null;
  const type = INVESTMENT_TYPES.includes(
    searchParams?.type as InvestmentType,
  )
    ? (searchParams?.type as InvestmentType)
    : null;

  const [offers, current] = await Promise.all([
    listPublishedInvestmentOffers({ amount, category, type }),
    getCurrentUser(),
  ]);

  const preserve = { amount, category, type };

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Marketplace"
            title="Инвестиции"
            description="Проект, описание, объём и формат участия — найдите капитал или разместите предложение."
          />
          <ButtonLink
            href={current ? "/dashboard/investments/create" : "/register"}
            variant="outline"
          >
            {current ? "Разместить предложение" : "Войти, чтобы разместить"}
          </ButtonLink>
        </div>

        <div className="mt-10 space-y-6 border-t border-border pt-8">
          <CatalogFilterBar
            label="Отрасль"
            basePath="/investments"
            param="category"
            current={category ?? null}
            options={INVESTMENT_DIRECTIONS.map((d) => ({
              id: d.slug,
              label: d.name,
            }))}
            preserve={preserve}
          />
          <CatalogFilterBar
            label="Сумма"
            basePath="/investments"
            param="amount"
            current={amount}
            options={AMOUNT_FILTERS.map((f) => ({
              id: f.id,
              label: f.label,
            }))}
            preserve={preserve}
          />
          <CatalogFilterBar
            label="Тип участия"
            basePath="/investments"
            param="type"
            current={type}
            options={INVESTMENT_TYPES.map((t) => ({
              id: t,
              label: investmentTypeLabels[t],
            }))}
            preserve={preserve}
          />
        </div>

        {offers.length === 0 ? (
          <EmptyState
            className="mt-12"
            title="Пока нет инвестиционных предложений"
            description="Измените фильтры или разместите предложение."
            actionHref="/demo"
            actionLabel="О демонстрации"
          />
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <InvestmentCard
                key={offer.id}
                offer={offer}
                ownerName={maskDisplayName(offer.ownerName, {
                  isAuthenticated: Boolean(current),
                })}
                href={`/investment/${offer.id}`}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
