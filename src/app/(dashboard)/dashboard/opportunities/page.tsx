import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { ArchiveOpportunityButton } from "@/features/opportunities/components/archive-opportunity-button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  listMyOpportunities,
  listOpportunityCategories,
} from "@/lib/opportunities/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Мои возможности" };

export default async function DashboardOpportunitiesPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const [opportunities, categories] = await Promise.all([
    listMyOpportunities(current.user.id),
    listOpportunityCategories(),
  ]);

  const typeNames = new Map(
    categories.map((category) => [category.slug, category.name]),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          title="Мои возможности"
          description="Ресурсы, которые вы предлагаете проектам: активы, технологии, услуги и партнёрство."
        />
        <ButtonLink href="/dashboard/opportunities/create">
          Создать возможность
        </ButtonLink>
      </div>

      {opportunities.length === 0 ? (
        <div className="border border-border bg-surface/60 p-6">
          <p className="text-sm text-muted">
            У вас пока нет возможностей. Предложите ресурс, который поможет
            реализовать проекты на платформе ЦКР.
          </p>
          <div className="mt-4">
            <ButtonLink
              href="/dashboard/opportunities/create"
              variant="outline"
            >
              Создать возможность
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {opportunities.map((opportunity) => (
            <div key={opportunity.id} className="space-y-3">
              <OpportunityCard
                opportunity={opportunity}
                typeName={typeNames.get(opportunity.type)}
                href={`/opportunity/${opportunity.id}`}
                showStatus
              />
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/opportunities/${opportunity.id}/edit`}
                  className="text-sm text-accent transition-colors hover:underline"
                >
                  Редактировать
                </Link>
                <Link
                  href={`/opportunity/${opportunity.id}`}
                  className="text-sm text-muted transition-colors hover:text-accent"
                >
                  Открыть карточку
                </Link>
                {opportunity.status !== "archived" ? (
                  <ArchiveOpportunityButton opportunityId={opportunity.id} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
