import { ProjectCard } from "@/components/projects/project-card";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { ArchiveProjectButton } from "@/features/projects/components/archive-project-button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listCategories, listMyProjects } from "@/lib/projects/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Мои проекты" };

export default async function DashboardProjectsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const [projects, categories] = await Promise.all([
    listMyProjects(current.user.id),
    listCategories(),
  ]);

  const categoryNames = new Map(
    categories.map((category) => [category.slug, category.name]),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          title="Мои проекты"
          description="Управляйте проектами — центральными сущностями вашей работы на платформе ЦКР."
        />
        <ButtonLink href="/dashboard/projects/create">Создать проект</ButtonLink>
      </div>

      {projects.length === 0 ? (
        <div className="border border-border bg-surface/60 p-6">
          <p className="text-sm text-muted">
            У вас пока нет проектов. Создайте первый — опишите идею, стадию и
            потребность в ресурсах.
          </p>
          <div className="mt-4">
            <ButtonLink href="/dashboard/projects/create" variant="outline">
              Создать проект
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {projects.map((project) => (
            <div key={project.id} className="space-y-3">
              <ProjectCard
                project={project}
                categoryName={categoryNames.get(project.category)}
                href={`/project/${project.id}`}
                showStatus
              />
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/projects/${project.id}/edit`}
                  className="text-sm text-accent transition-colors hover:underline"
                >
                  Редактировать
                </Link>
                <Link
                  href={`/project/${project.id}`}
                  className="text-sm text-muted transition-colors hover:text-accent"
                >
                  Открыть карточку
                </Link>
                {project.status !== "archived" ? (
                  <ArchiveProjectButton projectId={project.id} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
