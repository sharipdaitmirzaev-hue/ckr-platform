import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { VerificationBadge } from "@/components/verification/verification-badge";
import {
  opportunityStatusLabels,
  opportunityTypeLabels,
} from "@/config/opportunities";
import type { Opportunity } from "@/types";
import Link from "next/link";

type OpportunityCardProps = {
  opportunity: Opportunity;
  href?: string;
  typeName?: string | null;
  showStatus?: boolean;
};

function formatPrice(opportunity: Opportunity) {
  if (opportunity.price === null || opportunity.price === undefined) {
    return "По запросу";
  }
  const symbol =
    opportunity.currency === "RUB" ? "₽" : opportunity.currency || "";
  return `${new Intl.NumberFormat("ru-RU").format(opportunity.price)} ${symbol}`.trim();
}

function excerpt(text: string, max = 160) {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export function OpportunityCard({
  opportunity,
  href,
  typeName,
  showStatus = false,
}: OpportunityCardProps) {
  const location = [opportunity.city, opportunity.region]
    .filter(Boolean)
    .join(", ");

  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">
          {typeName ?? opportunityTypeLabels[opportunity.type]}
        </Badge>
        <Badge variant="default">{formatPrice(opportunity)}</Badge>
        <VerificationBadge status={opportunity.verificationStatus} />
        {showStatus ? (
          <Badge variant="soft">
            {opportunityStatusLabels[opportunity.status]}
          </Badge>
        ) : null}
      </div>
      <CardTitle className="mt-4">{opportunity.title}</CardTitle>
      <CardDescription>{excerpt(opportunity.description)}</CardDescription>
      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">
        {location || opportunity.region}
      </p>
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
