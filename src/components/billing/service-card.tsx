import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { serviceCategoryLabels } from "@/config/monetization";
import type { Service } from "@/types";

type ServiceCardProps = {
  service: Service;
  ctaHref?: string;
  ctaLabel?: string;
};

function formatPrice(price: number) {
  return `${new Intl.NumberFormat("ru-RU").format(price)} ₽`;
}

export function ServiceCard({
  service,
  ctaHref = "/dashboard/billing",
  ctaLabel = "Заказать",
}: ServiceCardProps) {
  return (
    <Card variant="catalog" className="transition-colors hover:border-accent/40">
      <Badge variant="accent">
        {serviceCategoryLabels[service.category]}
      </Badge>
      <CardTitle className="mt-4">{service.title}</CardTitle>
      <CardDescription>{service.description}</CardDescription>
      <p className="mt-5 font-display text-xl text-foreground">
        {formatPrice(service.price)}
      </p>
      <div className="mt-6">
        <ButtonLink href={ctaHref} variant="outline" size="sm">
          {ctaLabel}
        </ButtonLink>
      </div>
    </Card>
  );
}
