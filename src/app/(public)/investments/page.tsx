import { InvestmentCard } from "@/components/investments/investment-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  AMOUNT_FILTERS,
  INVESTMENT_DIRECTIONS,
  type AmountFilterId,
} from "@/config/investments";
import { listPublishedInvestmentOffers } from "@/lib/investments/queries";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Инвестиции",
  description:
    "Инвестиционные предложения ЦКР: капиталы, готовые к проектам и партнёрству.",
};

export const dynamic = "force-dynamic";

type InvestmentsPageProps = {
  searchParams?: {
    amount?: string;
    category?: string;
  };
};

export default async function InvestmentsPage({
  searchParams,
}: InvestmentsPageProps) {
  const amount = AMOUNT_FILTERS.some((item) => item.id === searchParams?.amount)
    ? (searchParams?.amount as AmountFilterId)
    : null;
  const category =
    INVESTMENT_DIRECTIONS.some((item) => item.slug === searchParams?.category)
      ? searchParams?.category
      : null;

  const offers = await listPublishedInvestmentOffers({ amount, category });

  function hrefFor(next: { amount?: string | null; category?: string | null }) {
    const params = new URLSearchParams();
    const nextAmount = next.amount === undefined ? amount : next.amount;
    const nextCategory =
      next.category === undefined ? category : next.category;
    if (nextAmount) params.set("amount", nextAmount);
    if (nextCategory) params.set("category", nextCategory);
    const query = params.toString();
    return query ? `/investments?${query}` : "/investments";
  }

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Каталог"
            title="Инвестиции"
            description="Инвесторы ЦКР публикуют интересы и готовый капитал. Проекты находят подходящие предложения и отправляют заявки через платформу."
          />
          <ButtonLink href="/dashboard/investments/create" variant="outline">
            Разместить предложение
          </ButtonLink>
        </div>

        <div className="mt-10 space-y-6 border-t border-border pt-8">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Сумма
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={hrefFor({ amount: null })}
                className={cn(
                  "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                  !amount
                    ? "border-accent/50 bg-accent-muted text-accent"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                Все
              </Link>
              {AMOUNT_FILTERS.map((filter) => (
                <Link
                  key={filter.id}
                  href={hrefFor({ amount: filter.id })}
                  className={cn(
                    "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                    amount === filter.id
                      ? "border-accent/50 bg-accent-muted text-accent"
                      : "border-border text-muted hover:text-foreground",
                  )}
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Направления
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={hrefFor({ category: null })}
                className={cn(
                  "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                  !category
                    ? "border-accent/50 bg-accent-muted text-accent"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                Все
              </Link>
              {INVESTMENT_DIRECTIONS.map((direction) => (
                <Link
                  key={direction.slug}
                  href={hrefFor({ category: direction.slug })}
                  className={cn(
                    "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                    category === direction.slug
                      ? "border-accent/50 bg-accent-muted text-accent"
                      : "border-border text-muted hover:text-foreground",
                  )}
                >
                  {direction.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="mt-12 border-t border-border pt-8">
            <p className="text-sm text-muted">
              По выбранным фильтрам предложений нет. Примените миграцию
              investment_offers и опубликуйте первое предложение.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <InvestmentCard
                key={offer.id}
                offer={offer}
                ownerName={offer.ownerName}
                href={`/investment/${offer.id}`}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
