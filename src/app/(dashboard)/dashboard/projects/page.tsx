import { ProjectCard } from "@/components/projects/project-card";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
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
        <EmptyState
          title="У вас пока нет проектов"
          description="Путь: Идея → Проект. Опишите идею Лие или создайте проект вручную — жизненный цикл начнётся с черновика."
          actionHref={
            "/lia?scenario=business_idea&message=" +
            encodeURIComponent("У меня есть идея")
          }
          actionLabel="Начать с идеи"
        />
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
                  href={`/dashboard/projects/${project.id}/workspace`}
                  className="text-sm text-accent transition-colors hover:underline"
                >
                  Кабинет проекта
                </Link>
                <Link
                  href={`/dashboard/projects/${project.id}/edit`}
                  className="text-sm text-muted transition-colors hover:text-accent"
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
