import { CatalogFilterBar } from "@/components/catalog/catalog-filter-bar";
import { CatalogSearchForm } from "@/components/catalog/catalog-search-form";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  listOpportunityCategories,
  listPublishedOpportunities,
} from "@/lib/opportunities/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Возможности",
  description:
    "Ресурсы, партнёрства и предложения ЦКР: фильтры по категории и региону.",
  openGraph: {
    title: "Возможности · ЦКР",
    description:
      "Земля, помещения, оборудование, услуги и партнёрские предложения.",
    url: "/opportunities",
    type: "website",
  },
  alternates: { canonical: "/opportunities" },
};

export const dynamic = "force-dynamic";

type OpportunitiesPageProps = {
  searchParams?: {
    type?: string;
    region?: string;
    q?: string;
  };
};

export default async function OpportunitiesPage({
  searchParams,
}: OpportunitiesPageProps) {
  const type = searchParams?.type?.trim() || null;
  const region = searchParams?.region?.trim() || null;
  const q = searchParams?.q?.trim() || null;

  const [opportunities, categories, current] = await Promise.all([
    listPublishedOpportunities({ type, region, q }),
    listOpportunityCategories(),
    getCurrentUser(),
  ]);

  const regions = Array.from(
    new Set(opportunities.map((o) => o.region).filter(Boolean)),
  ).sort();

  const preserve = { type, region, q };

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Marketplace"
            title="Возможности"
            description="Ресурсы и партнёрства: поиск, фильтры по категории и региону, карточки с CTA."
          />
          <div className="flex flex-wrap gap-3">
            <ButtonLink
              href={
                current
                  ? "/dashboard/opportunities/create"
                  : "/register?next=/dashboard/opportunities/create"
              }
            >
              Предложить возможность
            </ButtonLink>
            <ButtonLink href="/lia?scenario=business_audit" variant="outline">
              Начать с аудита
            </ButtonLink>
          </div>
        </div>

        <div className="mt-10 space-y-6 border-t border-border pt-8">
          <CatalogSearchForm
            action="/opportunities"
            defaultValue={q ?? ""}
            placeholder="Поиск по названию"
            hidden={{ type, region }}
          />
          <CatalogFilterBar
            label="Категория"
            basePath="/opportunities"
            param="type"
            current={type}
            options={categories.map((c) => ({ id: c.slug, label: c.name }))}
            preserve={preserve}
          />
          {regions.length > 0 ? (
            <CatalogFilterBar
              label="Регион"
              basePath="/opportunities"
              param="region"
              current={region}
              options={regions.map((r) => ({ id: r, label: r }))}
              preserve={preserve}
            />
          ) : null}
        </div>

        {opportunities.length === 0 ? (
          <EmptyState
            className="mt-12"
            title="Ничего не найдено"
            description="Снимите фильтры или предложите возможность."
            actionHref="/demo"
            actionLabel="О демонстрации"
          />
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                typeName={opportunity.typeName}
                href={`/opportunity/${opportunity.id}`}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
