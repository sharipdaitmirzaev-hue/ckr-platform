import { CatalogFilterBar } from "@/components/catalog/catalog-filter-bar";
import { CatalogSearchForm } from "@/components/catalog/catalog-search-form";
import { ExpertCard } from "@/components/experts/expert-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  EXPERT_SPECIALIZATIONS,
  expertSpecializationLabels,
} from "@/config/experts";
import { siteConfig } from "@/config/site";
import { listPublishedExperts } from "@/lib/experts/queries";
import type { ExpertSpecialization } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Эксперты",
  description:
    "Каталог экспертов ЦКР: поиск и фильтры по направлению, региону и опыту.",
  openGraph: {
    title: `Эксперты · ${siteConfig.name}`,
    description:
      "Проверенные компетенции для сопровождения проектов.",
    url: "/experts",
    type: "website",
    locale: siteConfig.ogLocale,
  },
  alternates: { canonical: "/experts" },
};

export const dynamic = "force-dynamic";

type ExpertsPageProps = {
  searchParams?: {
    specialization?: string;
    region?: string;
    q?: string;
    experience?: string;
  };
};

const EXPERIENCE_OPTIONS = [
  { id: "3", label: "от 3 лет" },
  { id: "5", label: "от 5 лет" },
  { id: "10", label: "от 10 лет" },
] as const;

export default async function ExpertsPage({ searchParams }: ExpertsPageProps) {
  const specialization = EXPERT_SPECIALIZATIONS.includes(
    searchParams?.specialization as ExpertSpecialization,
  )
    ? (searchParams?.specialization as ExpertSpecialization)
    : null;
  const region = searchParams?.region?.trim() || null;
  const q = searchParams?.q?.trim() || null;
  const minExperience = EXPERIENCE_OPTIONS.some(
    (o) => o.id === searchParams?.experience,
  )
    ? Number(searchParams?.experience)
    : null;

  const experts = await listPublishedExperts({
    specialization,
    region,
    q,
    minExperience,
  });

  const regions = Array.from(
    new Set(experts.map((e) => e.region).filter(Boolean)),
  ).sort();

  const preserve = {
    specialization,
    region,
    q,
    experience: searchParams?.experience ?? null,
  };

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Каталог"
            title="Эксперты ЦКР"
            description="Направление, регион и опыт — найдите специалиста и свяжитесь через платформу."
          />
          <ButtonLink href="/expert" variant="outline">
            Стать экспертом
          </ButtonLink>
        </div>

        <div id="catalog" className="mt-10 space-y-6 border-t border-border pt-8">
          <CatalogSearchForm
            action="/experts"
            defaultValue={q ?? ""}
            placeholder="Поиск по имени и описанию"
            hidden={{
              specialization,
              region,
              experience: searchParams?.experience,
            }}
          />
          <CatalogFilterBar
            label="Направление"
            basePath="/experts"
            param="specialization"
            current={specialization}
            options={EXPERT_SPECIALIZATIONS.map((item) => ({
              id: item,
              label: expertSpecializationLabels[item],
            }))}
            preserve={preserve}
          />
          {regions.length > 0 ? (
            <CatalogFilterBar
              label="Регион"
              basePath="/experts"
              param="region"
              current={region}
              options={regions.map((r) => ({ id: r, label: r }))}
              preserve={preserve}
            />
          ) : null}
          <CatalogFilterBar
            label="Опыт"
            basePath="/experts"
            param="experience"
            current={searchParams?.experience ?? null}
            options={EXPERIENCE_OPTIONS.map((o) => ({
              id: o.id,
              label: o.label,
            }))}
            preserve={preserve}
          />
        </div>

        {experts.length === 0 ? (
          <EmptyState
            className="mt-12"
            title="Эксперты не найдены"
            description="Снимите фильтры или создайте профиль эксперта."
            actionHref="/expert"
            actionLabel="Стать экспертом"
          />
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {experts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                href={`/expert/${expert.id}`}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
