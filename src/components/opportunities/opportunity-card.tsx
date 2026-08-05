import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { Opportunity, OpportunityType } from "@/types";
import Link from "next/link";

const typeLabels: Record<OpportunityType, string> = {
  land: "Земля",
  premises: "Помещения",
  equipment: "Оборудование",
  ready_business: "Готовый бизнес",
  technology: "Технологии",
};

type OpportunityCardProps = {
  opportunity: Opportunity;
  href?: string;
};

export function OpportunityCard({ opportunity, href }: OpportunityCardProps) {
  const content = (
    <>
      <Badge variant="accent">{typeLabels[opportunity.type]}</Badge>
      <CardTitle className="mt-4">{opportunity.title}</CardTitle>
      <CardDescription>{opportunity.summary}</CardDescription>
      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">
        {opportunity.region}
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
