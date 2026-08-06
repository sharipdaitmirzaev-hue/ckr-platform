import { DemoBadge } from "@/components/demo/demo-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { VerificationBadge } from "@/components/verification/verification-badge";
import {
  INVESTMENT_DIRECTIONS,
  investmentStatusLabels,
  investmentTypeLabels,
} from "@/config/investments";
import type { InvestmentOffer } from "@/types";
import Link from "next/link";

type InvestmentCardProps = {
  offer: InvestmentOffer;
  href?: string;
  ownerName?: string | null;
  showStatus?: boolean;
};

function formatAmount(offer: InvestmentOffer) {
  const symbol = offer.currency === "RUB" ? "₽" : offer.currency;
  const min = new Intl.NumberFormat("ru-RU").format(offer.amountMin);
  const max = new Intl.NumberFormat("ru-RU").format(offer.amountMax);
  if (offer.amountMin === offer.amountMax) {
    return `${min} ${symbol}`;
  }
  return `${min} – ${max} ${symbol}`;
}

function categoryLabel(slug: string) {
  return (
    INVESTMENT_DIRECTIONS.find((item) => item.slug === slug)?.name ?? slug
  );
}

export function InvestmentCard({
  offer,
  href,
  ownerName,
  showStatus = false,
}: InvestmentCardProps) {
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">
          {investmentTypeLabels[offer.investmentType]}
        </Badge>
        <Badge variant="default">{formatAmount(offer)}</Badge>
        <VerificationBadge status={offer.verificationStatus} />
        <DemoBadge entityId={offer.id} />
        {showStatus ? (
          <Badge variant="soft">{investmentStatusLabels[offer.status]}</Badge>
        ) : null}
      </div>
      <CardTitle className="mt-4">{offer.title}</CardTitle>
      <CardDescription>
        {offer.description.length > 160
          ? `${offer.description.slice(0, 160).trimEnd()}…`
          : offer.description}
      </CardDescription>
      <div className="mt-4 space-y-1 text-xs uppercase tracking-[0.14em] text-muted">
        <p>Инвестор: {ownerName || "Участник ЦКР"}</p>
        <p>Регионы: {offer.regions.join(", ") || "—"}</p>
        <p>
          Отрасли:{" "}
          {offer.categories.map(categoryLabel).join(", ") || "—"}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <Card
        as="article"
        variant="catalog"
        className="transition-colors hover:border-accent/50"
      >
        <Link href={href} className="block focus-visible:outline-none">
          {content}
        </Link>
      </Card>
    );
  }

  return (
    <Card as="article" variant="catalog">
      {content}
    </Card>
  );
}
