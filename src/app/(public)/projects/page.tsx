import { CatalogFilterBar } from "@/components/catalog/catalog-filter-bar";
import { CatalogSearchForm } from "@/components/catalog/catalog-search-form";
import { PageNextStep } from "@/components/marketing/page-next-step";
import { ProjectCard } from "@/components/projects/project-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  PROJECT_STAGES,
  projectStageLabels,
  projectStatusLabels,
} from "@/config/projects";
import { PAGE_NEXT_STEPS } from "@/config/website-final";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  listCategories,
  listPublishedProjects,
} from "@/lib/projects/queries";
import type { ProjectStage, ProjectStatus } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Проекты",
  description:
    "Публичный каталог проектов ЦКР: поиск и фильтры по отрасли, региону, стадии и статусу.",
  openGraph: {
    title: "Проекты · ЦКР",
    description:
      "Каталог бизнес-проектов: идеи и компании, ищущие ресурсы, капитал и партнёров.",
    url: "/projects",
    type: "website",
  },
  alternates: { canonical: "/projects" },
};

export const dynamic = "force-dynamic";

type ProjectsPageProps = {
  searchParams?: {
    q?: string;
    category?: string;
    region?: string;
    stage?: string;
    status?: string;
  };
};

const PUBLIC_STATUSES = ["published", "active", "completed"] as const;

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const q = searchParams?.q?.trim() || null;
  const category = searchParams?.category?.trim() || null;
  const region = searchParams?.region?.trim() || null;
  const stage = PROJECT_STAGES.includes(searchParams?.stage as ProjectStage)
    ? (searchParams?.stage as ProjectStage)
    : null;
  const status = PUBLIC_STATUSES.includes(
    searchParams?.status as (typeof PUBLIC_STATUSES)[number],
  )
    ? (searchParams?.status as ProjectStatus)
    : null;

  const [projects, categories, current] = await Promise.all([
    listPublishedProjects({ q, category, region, stage, status }),
    listCategories(),
    getCurrentUser(),
  ]);

  const preserve = {
    q,
    category,
    region,
    stage,
    status,
  };

  const regions = Array.from(
    new Set(projects.map((p) => p.region).filter(Boolean)),
  ).sort();

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Marketplace"
            title="Проекты"
            description="Поиск и фильтры по отрасли, региону и стадии. Разместите проект или начните с аудита Лии."
          />
          <div className="flex flex-wrap gap-3">
            <ButtonLink
              href={
                current
                  ? "/dashboard/projects/create"
                  : "/register?next=/dashboard/projects/create"
              }
            >
              Разместить проект
            </ButtonLink>
            <ButtonLink href="/lia?scenario=business_audit" variant="outline">
              Аудит с Лией
            </ButtonLink>
          </div>
        </div>

        <div className="mt-10 space-y-6 border-t border-border pt-8">
          <CatalogSearchForm
            action="/projects"
            defaultValue={q ?? ""}
            placeholder="Поиск по названию и описанию"
            hidden={{ category, region, stage, status }}
          />
          <CatalogFilterBar
            label="Отрасль"
            basePath="/projects"
            param="category"
            current={category}
            options={categories.map((c) => ({ id: c.slug, label: c.name }))}
            preserve={preserve}
          />
          {regions.length > 0 ? (
            <CatalogFilterBar
              label="Регион"
              basePath="/projects"
              param="region"
              current={region}
              options={regions.map((r) => ({ id: r, label: r }))}
              preserve={preserve}
            />
          ) : null}
          <CatalogFilterBar
            label="Стадия"
            basePath="/projects"
            param="stage"
            current={stage}
            options={PROJECT_STAGES.map((s) => ({
              id: s,
              label: projectStageLabels[s],
            }))}
            preserve={preserve}
          />
          <CatalogFilterBar
            label="Статус"
            basePath="/projects"
            param="status"
            current={status}
            options={PUBLIC_STATUSES.map((s) => ({
              id: s,
              label: projectStatusLabels[s],
            }))}
            preserve={preserve}
          />
        </div>

        {projects.length === 0 ? (
          <EmptyState
            className="mt-12"
            title="Ничего не найдено"
            description="Снимите фильтры или создайте проект с Лией."
            actionHref="/lia?scenario=business_audit"
            actionLabel="Расскажите о вашей задаче"
          />
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                categoryName={project.categoryName}
                href={`/project/${project.id}`}
                showStatus
              />
            ))}
          </div>
        )}
      </Container>
      <PageNextStep {...PAGE_NEXT_STEPS.projects} />
    </div>
  );
}
