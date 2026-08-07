import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { canManageOrganization } from "@/config/partners";
import {
  CreateOrgInvestmentForm,
  CreateOrgOpportunityForm,
} from "@/features/partners/components/org-create-forms";
import { requirePartnerMembership } from "@/lib/auth/require-partner";
import {
  listOrganizationInvestments,
  listOrganizationOpportunities,
} from "@/lib/partners/queries";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Предложения организации",
};

export const dynamic = "force-dynamic";

export default async function PartnerOffersPage() {
  const session = await requirePartnerMembership();
  const orgId = session.primary.organization.id;
  const [opportunities, investments] = await Promise.all([
    listOrganizationOpportunities(orgId),
    listOrganizationInvestments(orgId),
  ]);
  const canManage = canManageOrganization(session.primary.role);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Организация"
        title="Предложения"
        description="Возможности, услуги и инвестиционные предложения организации."
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Возможность / услуга
          </h2>
          {canManage ? (
            <CreateOrgOpportunityForm />
          ) : (
            <p className="text-sm text-muted">Недостаточно прав.</p>
          )}
        </Card>
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">Инвестиции</h2>
          {canManage ? (
            <CreateOrgInvestmentForm />
          ) : (
            <p className="text-sm text-muted">Недостаточно прав.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-display text-xl text-foreground">Возможности</h2>
          {opportunities.length === 0 ? (
            <EmptyState
              title="Пока пусто"
              description="Создайте возможность слева."
            />
          ) : (
            opportunities.map((item) => (
              <Card key={item.id} variant="surface" className="space-y-1 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/opportunity/${item.id}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {item.title}
                  </Link>
                  <Badge variant="soft">{item.type}</Badge>
                  <Badge variant="soft">{item.status}</Badge>
                </div>
              </Card>
            ))
          )}
        </div>
        <div className="space-y-3">
          <h2 className="font-display text-xl text-foreground">Инвестиции</h2>
          {investments.length === 0 ? (
            <EmptyState
              title="Пока пусто"
              description="Создайте инвестиционное предложение."
            />
          ) : (
            investments.map((item) => (
              <Card key={item.id} variant="surface" className="space-y-1 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/investment/${item.id}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {item.title}
                  </Link>
                  <Badge variant="soft">{item.status}</Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
