import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
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

  const [project, categories] = await Promise.all([
    getProjectById(params.id),
    listCategories(),
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
    </div>
  );
}
