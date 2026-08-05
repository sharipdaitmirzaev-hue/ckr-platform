import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listCategories } from "@/lib/projects/queries";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Создать проект" };

export default async function CreateProjectPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const categories = await listCategories();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Проекты"
        title="Новый проект"
        description="Опишите бизнес-идею как основу для поиска ресурсов, партнёров и решений. Это не объявление — это карточка проекта ЦКР."
      />

      <Card variant="surface" className="p-5 sm:p-6">
        {categories.length === 0 ? (
          <p className="text-sm text-muted">
            Категории недоступны. Примените миграцию projects/categories в
            Supabase, затем обновите страницу.
          </p>
        ) : (
          <ProjectForm mode="create" categories={categories} />
        )}
      </Card>
    </div>
  );
}
