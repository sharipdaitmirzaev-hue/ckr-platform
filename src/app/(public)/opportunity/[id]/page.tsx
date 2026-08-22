import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { VerificationBadge } from "@/components/verification/verification-badge";
import {
  opportunityTypeLabels,
  opportunityVerificationLabels,
} from "@/config/opportunities";
import { ApplicationButton } from "@/features/applications/components/application-button";
import { InterestButton } from "@/features/interests/components/interest-button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { maskDisplayName } from "@/lib/demo/mode";
import { hasInterest } from "@/lib/interests/queries";
import { getOpportunityById } from "@/lib/opportunities/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type OpportunityPageProps = {
  params: { id: string };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: OpportunityPageProps): Promise<Metadata> {
  const opportunity = await getOpportunityById(params.id);
  if (!opportunity) return { title: "Возможность" };
  return {
    title: opportunity.title,
    description: opportunity.description.slice(0, 160),
  };
}

function formatPrice(price: number | null | undefined, currency: string) {
  if (price === null || price === undefined) return "По запросу";
  const symbol = currency === "RUB" ? "₽" : currency;
  return `${new Intl.NumberFormat("ru-RU").format(price)} ${symbol}`;
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const opportunity = await getOpportunityById(params.id);

  if (!opportunity) {
    notFound();
  }

  const current = await getCurrentUser();
  const isOwner = current?.user.id === opportunity.ownerId;
  const interested =
    current && opportunity.status === "published"
      ? await hasInterest(current.user.id, "opportunity", opportunity.id)
      : false;

  if (opportunity.status !== "published" && !isOwner) {
    notFound();
  }

  return (
    <div className="py-14 sm:py-16">
      <Container className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">
            {opportunity.typeName ?? opportunityTypeLabels[opportunity.type]}
          </Badge>
          <Badge variant="soft">
            {[opportunity.city, opportunity.region].filter(Boolean).join(", ")}
          </Badge>
          <Badge variant="default">
            {opportunityVerificationLabels[opportunity.status]}
          </Badge>
          <VerificationBadge status={opportunity.verificationStatus} />
          {opportunity.sourceType === "lia_oi" ? (
            <>
              <Badge variant="accent">Найдено Лией</Badge>
              {opportunity.sourceLabel ? (
                <Badge variant="soft">{opportunity.sourceLabel}</Badge>
              ) : null}
            </>
          ) : null}
        </div>

        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {opportunity.title}
        </h1>

        <dl className="mt-10 grid gap-6 border-y border-border py-8 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Стоимость
            </dt>
            <dd className="mt-2 font-display text-2xl text-foreground">
              {formatPrice(opportunity.price, opportunity.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Владелец
            </dt>
            <dd className="mt-2 text-lg text-foreground">
              {maskDisplayName(opportunity.ownerName, {
                isAuthenticated: Boolean(current),
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Тип
            </dt>
            <dd className="mt-2 text-foreground">
              {opportunity.typeName ?? opportunityTypeLabels[opportunity.type]}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Статус проверки
            </dt>
            <dd className="mt-2 text-foreground">
              {opportunityVerificationLabels[opportunity.status]}
            </dd>
          </div>
          {opportunity.deadlineAt ? (
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-muted">
                Дедлайн
              </dt>
              <dd className="mt-2 text-foreground">
                {new Date(opportunity.deadlineAt).toLocaleString("ru-RU")}
              </dd>
            </div>
          ) : null}
          {opportunity.sourceUrl || opportunity.canonicalUrl ? (
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-muted">
                Официальный источник
              </dt>
              <dd className="mt-2">
                <a
                  href={opportunity.sourceUrl || opportunity.canonicalUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  Открыть источник
                </a>
              </dd>
            </div>
          ) : null}
        </dl>

        <section className="mt-10">
          <h2 className="font-display text-xl text-foreground">Описание</h2>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted sm:text-base">
            {opportunity.description}
          </div>
        </section>

        <div className="mt-12 space-y-6 border-t border-border pt-8">
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/opportunities" variant="outline">
              К каталогу
            </ButtonLink>
            {isOwner ? (
              <ButtonLink
                href={`/dashboard/opportunities/${opportunity.id}/edit`}
                variant="outline"
              >
                Редактировать
              </ButtonLink>
            ) : (
              <ButtonLink href="/projects" variant="outline">
                Смотреть проекты
              </ButtonLink>
            )}
          </div>

          {opportunity.status === "published" ? (
            <div className="flex flex-wrap items-start gap-3">
              <ApplicationButton
                targetType="opportunity"
                targetId={opportunity.id}
                label="Связаться с владельцем"
                isAuthenticated={Boolean(current)}
                isOwner={isOwner}
              />
              {current && !isOwner ? (
                <InterestButton
                  targetType="opportunity"
                  targetId={opportunity.id}
                  initiallyInterested={interested}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
