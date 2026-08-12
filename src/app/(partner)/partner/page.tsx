import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  organizationTypeLabels,
  organizationVerificationLabels,
} from "@/config/partners";
import { CreateOrganizationForm } from "@/features/partners/components/create-organization-form";
import { requirePartnerUser } from "@/lib/auth/require-partner";
import {
  buildPartnerLiaInsight,
  LIA_PARTNER_SCENARIOS,
} from "@/lib/partners/lia-scenarios";
import {
  listOrganizationInvestments,
  listOrganizationOpportunities,
  listOrganizationProjects,
  listPartnerships,
} from "@/lib/partners/queries";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Моя компания — ЦКР",
};

export const dynamic = "force-dynamic";

export default async function PartnerHomePage({
  searchParams,
}: {
  searchParams?: { setup?: string };
}) {
  const session = await requirePartnerUser();
  const showSetup = searchParams?.setup === "1" || !session.primary;

  if (showSetup || !session.primary) {
    return (
      <div className="space-y-8">
        <SectionHeading
          eyebrow="Партнёрская сеть"
          title="Подключите организацию к ЦКР"
          description="Создайте профиль организации, чтобы предлагать возможности, участвовать в проектах и оформлять партнёрства."
        />
        {!hasSupabaseEnv() ? (
          <Card variant="surface" className="p-5 text-sm text-muted">
            Supabase не настроен — примените миграцию `partners`.
          </Card>
        ) : null}
        <Card variant="surface" className="max-w-xl space-y-4 p-5">
          <CreateOrganizationForm />
        </Card>
      </div>
    );
  }

  const org = session.primary.organization;
  const [projects, opportunities, investments, partnerships] =
    await Promise.all([
      listOrganizationProjects(org.id),
      listOrganizationOpportunities(org.id),
      listOrganizationInvestments(org.id),
      listPartnerships(org.id),
    ]);

  const projectInsight = buildPartnerLiaInsight({
    scenarioId: "org_find_projects",
    organizationName: org.name,
    organizationType: organizationTypeLabels[org.type],
    region: org.region,
  });
  const offerInsight = buildPartnerLiaInsight({
    scenarioId: "org_offer_opportunities",
    organizationName: org.name,
    organizationType: organizationTypeLabels[org.type],
    region: org.region,
    activePartnerships: partnerships.filter((item) => item.status === "active")
      .length,
    publishedOffers:
      opportunities.filter((item) => item.status === "published").length +
      investments.filter((item) => item.status === "published").length,
  });

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Моя компания"
        title={org.name}
        description={`${organizationTypeLabels[org.type]} · ${
          organizationVerificationLabels[org.verificationStatus]
        }`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card variant="surface" className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Проекты
          </p>
          <p className="mt-2 font-display text-2xl text-foreground">
            {projects.length}
          </p>
        </Card>
        <Card variant="surface" className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Возможности
          </p>
          <p className="mt-2 font-display text-2xl text-foreground">
            {opportunities.length}
          </p>
        </Card>
        <Card variant="surface" className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Инвестиции
          </p>
          <p className="mt-2 font-display text-2xl text-foreground">
            {investments.length}
          </p>
        </Card>
        <Card variant="surface" className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Партнёрства
          </p>
          <p className="mt-2 font-display text-2xl text-foreground">
            {partnerships.length}
          </p>
        </Card>
      </section>

      <Card variant="surface" className="space-y-4 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Лия · организация
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {projectInsight.summary}
            </p>
            <ul className="space-y-1 text-sm text-muted">
              {projectInsight.suggestions.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {offerInsight.summary}
            </p>
            <ul className="space-y-1 text-sm text-muted">
              {offerInsight.suggestions.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {LIA_PARTNER_SCENARIOS.map((scenario) => (
            <Badge key={scenario.id} variant="soft" title={scenario.description}>
              {scenario.examplePrompt}
            </Badge>
          ))}
        </div>
        <Link href="/lia" className="text-sm text-accent hover:underline">
          Открыть Лию →
        </Link>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card variant="surface" className="space-y-2 p-5">
          <h2 className="font-display text-lg text-foreground">Разделы</h2>
          <ul className="space-y-1 text-sm text-muted">
            <li>
              <Link href="/partner/profile" className="hover:text-accent">
                Профиль организации
              </Link>
            </li>
            <li>
              <Link href="/partner/members" className="hover:text-accent">
                Сотрудники
              </Link>
            </li>
            <li>
              <Link href="/partner/projects" className="hover:text-accent">
                Проекты
              </Link>
            </li>
            <li>
              <Link href="/partner/offers" className="hover:text-accent">
                Предложения
              </Link>
            </li>
            <li>
              <Link href="/partner/applications" className="hover:text-accent">
                Заявки
              </Link>
            </li>
          </ul>
        </Card>
        <Card variant="surface" className="space-y-2 p-5">
          <h2 className="font-display text-lg text-foreground">
            Связь с экосистемой
          </h2>
          <p className="text-sm text-muted">
            Организация может создавать возможности и инвестиционные
            предложения, участвовать в проектах и оформлять партнёрства с ЦКР.
          </p>
        </Card>
      </section>
    </div>
  );
}
