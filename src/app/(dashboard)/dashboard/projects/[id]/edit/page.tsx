import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProjectLiaActions } from "@/features/lia/components/project-lia-actions";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listLiaAnalysesForProject } from "@/lib/lia/queries";
import { getProjectById, listCategories } from "@/lib/projects/queries";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type EditProjectPageProps = {
  params: { id: string };
};

export const metadata: Metadata = { title: "Редактирование проекта" };

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const [project, categories, analyses] = await Promise.all([
    getProjectById(params.id),
    listCategories(),
    listLiaAnalysesForProject(params.id, current.user.id, 1),
  ]);

  if (!project) notFound();
  if (project.ownerId !== current.user.id) redirect("/dashboard/projects");

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Проекты"
        title="Редактирование"
        description="Обновляйте описание, стадию и статус публикации. В каталоге видны только проекты со статусом «Опубликован»."
      />

      <Card variant="surface" className="p-5 sm:p-6">
        <ProjectForm
          mode="edit"
          categories={categories}
          project={project}
        />
      </Card>

      <Card variant="surface" className="space-y-4 p-5 sm:p-6">
        <h2 className="font-display text-xl text-foreground">
          Анализ Лией
        </h2>
        <p className="text-sm text-muted">
          После создания черновика запустите анализ и поиск решений внутри ЦКР
          и во внешних источниках (mock).
        </p>
        <ProjectLiaActions
          projectId={project.id}
          initialReport={analyses[0]?.report ?? null}
        />
      </Card>
    </div>
  );
}
