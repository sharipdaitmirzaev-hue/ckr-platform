import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { UX_CTA } from "@/config/ux-simplification";
import {
  organizationTypeLabels,
  organizationVerificationLabels,
} from "@/config/partners";
import { CreateOrganizationForm } from "@/features/partners/components/create-organization-form";
import { requirePartnerUser } from "@/lib/auth/require-partner";
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
          title="Подключите компанию к ЦКР"
          description="Создайте профиль организации — дальше ЦКР поможет найти партнёров и возможности."
        />
        {!hasSupabaseEnv() ? (
          <p className="text-sm text-muted">
            Supabase не настроен в этой среде.
          </p>
        ) : null}
        <div className="max-w-xl space-y-4 border-t border-border pt-6">
          <CreateOrganizationForm />
        </div>
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

  const publishedOffers =
    opportunities.filter((item) => item.status === "published").length +
    investments.filter((item) => item.status === "published").length;
  const activePartnerships = partnerships.filter(
    (item) => item.status === "active",
  ).length;
  const foundVariants = publishedOffers + opportunities.length;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          Моя компания
        </p>
        <h1 className="font-display text-3xl text-foreground">{org.name}</h1>
        <p className="text-sm text-muted">
          {organizationTypeLabels[org.type]}
          {org.region ? ` · ${org.region}` : ""}
          {" · "}
          {organizationVerificationLabels[org.verificationStatus]}
        </p>
      </header>

      <section className="grid gap-8 border-t border-border pt-8 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Что предлагает
          </p>
          <p className="text-base text-foreground">
            {publishedOffers > 0
              ? `${publishedOffers} опубликованных предложений`
              : opportunities.length > 0
                ? `${opportunities.length} предложений в работе`
                : "Пока не указано — добавьте в «Что предлагаем / ищем»"}
          </p>
          <Link
            href="/partner/offers"
            className="text-sm text-accent hover:underline"
          >
            Уточнить предложения →
          </Link>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Что ищет
          </p>
          <p className="text-base text-foreground">
            {projects.length > 0
              ? `${projects.length} проект(ов) развития`
              : "Опишите задачу через обращение в ЦКР"}
          </p>
          <Link href="/idea" className="text-sm text-accent hover:underline">
            {UX_CTA.newRequest} →
          </Link>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Сейчас ЦКР
          </p>
          <p className="font-display text-xl text-foreground">
            {activePartnerships > 0
              ? "Сопровождает партнёрства и ищет новые варианты"
              : "Готова помочь найти покупателей, партнёров или ресурсы"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Найдено вариантов
          </p>
          <p className="text-base text-foreground">
            {foundVariants > 0
              ? `${foundVariants}`
              : "Пока нет — откройте «Возможности» или отправьте обращение"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/partner/feed">{UX_CTA.open}</ButtonLink>
          <ButtonLink href="/idea" variant="outline">
            {UX_CTA.newRequest}
          </ButtonLink>
        </div>
      </section>

      <section className="border-t border-border pt-6">
        <Link
          href="/partner/profile"
          className="text-sm text-muted hover:text-accent"
        >
          Реквизиты и детали профиля →
        </Link>
      </section>
    </div>
  );
}
