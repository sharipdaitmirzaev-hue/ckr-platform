import { InvestmentCard } from "@/components/investments/investment-card";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { CloseInvestmentButton } from "@/features/investments/components/close-investment-button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listMyInvestmentOffers } from "@/lib/investments/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Мои инвестиции" };

export default async function DashboardInvestmentsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const offers = await listMyInvestmentOffers(current.user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          title="Мои инвестиционные предложения"
          description="Публикуйте интересы капитала и получайте заявки от проектов через платформу ЦКР."
        />
        <ButtonLink href="/dashboard/investments/create">
          Создать предложение
        </ButtonLink>
      </div>

      {offers.length === 0 ? (
        <div className="border border-border bg-surface/60 p-6">
          <p className="text-sm text-muted">
            У вас пока нет инвестиционных предложений. Опишите сумму, отрасли и
            тип участия.
          </p>
          <div className="mt-4">
            <ButtonLink
              href="/dashboard/investments/create"
              variant="outline"
            >
              Создать предложение
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {offers.map((offer) => (
            <div key={offer.id} className="space-y-3">
              <InvestmentCard
                offer={offer}
                ownerName={current.user.fullName}
                href={`/investment/${offer.id}`}
                showStatus
              />
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/investments/${offer.id}/edit`}
                  className="text-sm text-accent transition-colors hover:underline"
                >
                  Редактировать
                </Link>
                <Link
                  href={`/investment/${offer.id}`}
                  className="text-sm text-muted transition-colors hover:text-accent"
                >
                  Открыть карточку
                </Link>
                {offer.status !== "closed" ? (
                  <CloseInvestmentButton offerId={offer.id} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
