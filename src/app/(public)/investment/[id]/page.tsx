import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import {
  INVESTMENT_DIRECTIONS,
  investmentTypeLabels,
} from "@/config/investments";
import { ApplicationButton } from "@/features/applications/components/application-button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getInvestmentOfferById } from "@/lib/investments/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type InvestmentPageProps = {
  params: { id: string };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: InvestmentPageProps): Promise<Metadata> {
  const offer = await getInvestmentOfferById(params.id);
  if (!offer) return { title: "Инвестиционное предложение" };
  return {
    title: offer.title,
    description: offer.description.slice(0, 160),
  };
}

function formatAmount(min: number, max: number, currency: string) {
  const symbol = currency === "RUB" ? "₽" : currency;
  const minLabel = new Intl.NumberFormat("ru-RU").format(min);
  const maxLabel = new Intl.NumberFormat("ru-RU").format(max);
  return min === max
    ? `${minLabel} ${symbol}`
    : `${minLabel} – ${maxLabel} ${symbol}`;
}

function categoryLabel(slug: string) {
  return (
    INVESTMENT_DIRECTIONS.find((item) => item.slug === slug)?.name ?? slug
  );
}

export default async function InvestmentPage({ params }: InvestmentPageProps) {
  const offer = await getInvestmentOfferById(params.id);
  if (!offer) notFound();

  const current = await getCurrentUser();
  const isOwner = current?.user.id === offer.ownerId;

  if (offer.status !== "published" && !isOwner) {
    notFound();
  }

  return (
    <div className="py-14 sm:py-16">
      <Container className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">
            {investmentTypeLabels[offer.investmentType]}
          </Badge>
          <Badge variant="default">
            {formatAmount(offer.amountMin, offer.amountMax, offer.currency)}
          </Badge>
        </div>

        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {offer.title}
        </h1>

        <dl className="mt-10 grid gap-6 border-y border-border py-8 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Инвестор
            </dt>
            <dd className="mt-2 text-lg text-foreground">
              {offer.ownerName || "Участник ЦКР"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Тип участия
            </dt>
            <dd className="mt-2 text-lg text-foreground">
              {investmentTypeLabels[offer.investmentType]}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Сумма
            </dt>
            <dd className="mt-2 font-display text-2xl text-foreground">
              {formatAmount(offer.amountMin, offer.amountMax, offer.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Регионы
            </dt>
            <dd className="mt-2 text-foreground">
              {offer.regions.join(", ") || "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Отрасли / направления
            </dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {offer.categories.map((slug) => (
                <Badge key={slug} variant="soft">
                  {categoryLabel(slug)}
                </Badge>
              ))}
            </dd>
          </div>
        </dl>

        <section className="mt-10">
          <h2 className="font-display text-xl text-foreground">Описание</h2>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted sm:text-base">
            {offer.description}
          </div>
        </section>

        <div className="mt-12 space-y-6 border-t border-border pt-8">
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/investments" variant="outline">
              К каталогу
            </ButtonLink>
            {isOwner ? (
              <ButtonLink
                href={`/dashboard/investments/${offer.id}/edit`}
                variant="outline"
              >
                Редактировать
              </ButtonLink>
            ) : null}
          </div>

          {offer.status === "published" ? (
            <ApplicationButton
              targetType="investment"
              targetId={offer.id}
              label="Отправить предложение инвестору"
              isAuthenticated={Boolean(current)}
              isOwner={isOwner}
            />
          ) : null}
        </div>
      </Container>
    </div>
  );
}
