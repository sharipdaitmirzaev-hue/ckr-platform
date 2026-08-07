import { SubscriptionBadge } from "@/components/billing/subscription-badge";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  periodLabels,
  planTypeLabels,
  serviceCategoryLabels,
  subscriptionStatusLabels,
} from "@/config/monetization";
import {
  PlanCheckoutForm,
  ServiceCheckoutForm,
} from "@/features/billing/components/checkout-request-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getActiveSubscription,
  listActivePlans,
  listActiveServices,
  listUserSubscriptions,
} from "@/lib/monetization/queries";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Оплата и подписка",
};

export const dynamic = "force-dynamic";

function formatPrice(price: number) {
  return `${new Intl.NumberFormat("ru-RU").format(price)} ₽`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function DashboardBillingPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/billing");

  const [active, history, plans, services] = await Promise.all([
    getActiveSubscription(current.user.id),
    listUserSubscriptions(current.user.id),
    listActivePlans(),
    listActiveServices(),
  ]);

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Биллинг"
        title="Оплата и подписка"
        description="Тарифы и услуги ЦКР. Реальные платежи пока не подключены — доступен mock PaymentProvider (карта, СБП, другие способы)."
      />

      <Card variant="surface" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl text-foreground">
            Текущая подписка
          </h2>
          <SubscriptionBadge
            planName={active?.plan?.name}
            planType={active?.plan?.type}
            status={active?.status}
          />
        </div>
        {active?.plan ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Тариф
              </dt>
              <dd className="mt-1 text-foreground">
                {active.plan.name} · {planTypeLabels[active.plan.type]}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Период
              </dt>
              <dd className="mt-1 text-foreground">
                с {formatDate(active.startedAt)}
                {active.expiresAt ? ` до ${formatDate(active.expiresAt)}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Статус
              </dt>
              <dd className="mt-1 text-foreground">
                {subscriptionStatusLabels[active.status]}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Стоимость
              </dt>
              <dd className="mt-1 text-foreground">
                {formatPrice(active.plan.price)}{" "}
                {periodLabels[active.plan.period] ?? ""}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted">
            Активной подписки нет. Выберите тариф ниже — оформим запрос через
            платёжную архитектуру ЦКР.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/pricing" variant="outline" size="sm">
            Все тарифы
          </ButtonLink>
          <ButtonLink href="/services" variant="outline" size="sm">
            Услуги ЦКР
          </ButtonLink>
        </div>
      </Card>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Тарифы"
          title="Оформить доступ"
          description="Запрос создаёт checkout в mock-провайдере без реального списания."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.id} variant="surface" className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{planTypeLabels[plan.type]}</Badge>
                <Badge variant="soft">
                  {formatPrice(plan.price)} {periodLabels[plan.period]}
                </Badge>
              </div>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <PlanCheckoutForm
                planId={plan.id}
                planName={plan.name}
                price={plan.price}
              />
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Услуги"
          title="Заказать услугу ЦКР"
          description="Бизнес-план, право, маркетинг, поиск инвестиций и сопровождение."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {services.slice(0, 6).map((service) => (
            <Card key={service.id} variant="catalog" className="space-y-3">
              <Badge variant="soft">
                {serviceCategoryLabels[service.category]}
              </Badge>
              <CardTitle className="text-lg">{service.title}</CardTitle>
              <p className="text-sm text-accent">{formatPrice(service.price)}</p>
              <ServiceCheckoutForm
                serviceId={service.id}
                title={service.title}
                price={service.price}
              />
            </Card>
          ))}
        </div>
      </section>

      {history.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-foreground">
            История подписок
          </h2>
          <ul className="space-y-3">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm"
              >
                <span className="text-foreground">
                  {item.plan?.name ?? "Тариф"} ·{" "}
                  {subscriptionStatusLabels[item.status]}
                </span>
                <span className="text-muted">
                  {formatDate(item.startedAt)}
                  {item.expiresAt ? ` — ${formatDate(item.expiresAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
