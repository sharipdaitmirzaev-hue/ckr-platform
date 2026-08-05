import { ProjectCard } from "@/components/projects/project-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { listPublishedProjects } from "@/lib/projects/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Проекты",
  description:
    "Каталог бизнес-проектов ЦКР: идеи и компании, ищущие ресурсы, капитал и партнёров.",
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listPublishedProjects();

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Каталог"
            title="Проекты"
            description="Центральная сущность платформы ЦКР. Здесь публикуются проекты, вокруг которых собираются инвесторы, ресурсы, эксперты и решения."
          />
          <ButtonLink href="/dashboard/projects/create" variant="outline">
            Разместить проект
          </ButtonLink>
        </div>

        {projects.length === 0 ? (
          <div className="mt-12 border-t border-border pt-8">
            <p className="text-sm text-muted">
              Опубликованных проектов пока нет. После применения миграции и
              публикации первого проекта карточки появятся здесь.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                categoryName={project.categoryName}
                href={`/project/${project.id}`}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
