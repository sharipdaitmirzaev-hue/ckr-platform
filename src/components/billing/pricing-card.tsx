import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  periodLabels,
  planTypeLabels,
} from "@/config/monetization";
import type { SubscriptionPlan } from "@/types";

type PricingCardProps = {
  plan: SubscriptionPlan;
  highlighted?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price);
}

export function PricingCard({
  plan,
  highlighted = false,
  ctaHref = "/dashboard/billing",
  ctaLabel = "Выбрать тариф",
}: PricingCardProps) {
  return (
    <Card
      variant="surface"
      className={
        highlighted
          ? "border-accent/50 bg-accent-muted/20"
          : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">{planTypeLabels[plan.type]}</Badge>
        {highlighted ? <Badge variant="soft">Рекомендуем</Badge> : null}
      </div>
      <CardTitle className="mt-4">{plan.name}</CardTitle>
      <CardDescription>{plan.description}</CardDescription>
      <p className="mt-6 font-display text-3xl font-semibold text-foreground">
        {formatPrice(plan.price)}{" "}
        <span className="text-base font-normal text-muted">₽</span>
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
        {periodLabels[plan.period] ?? plan.period}
      </p>
      <ul className="mt-6 space-y-2.5 border-t border-border pt-5">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="border-l border-accent/40 pl-3 text-sm text-muted"
          >
            {feature}
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <ButtonLink href={ctaHref} className="w-full sm:w-auto">
          {ctaLabel}
        </ButtonLink>
      </div>
    </Card>
  );
}
