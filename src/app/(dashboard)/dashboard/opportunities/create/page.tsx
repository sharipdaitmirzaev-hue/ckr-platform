import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { OpportunityForm } from "@/features/opportunities/components/opportunity-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listOpportunityCategories } from "@/lib/opportunities/queries";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Создать возможность" };

export default async function CreateOpportunityPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const categories = await listOpportunityCategories();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Возможности"
        title="Новая возможность"
        description="Опишите ресурс для проектов: землю, помещение, оборудование, технологию, услугу или партнёрство."
      />

      <Card variant="surface" className="p-5 sm:p-6">
        {categories.length === 0 ? (
          <p className="text-sm text-muted">
            Категории недоступны. Примените миграцию opportunities в Supabase,
            затем обновите страницу.
          </p>
        ) : (
          <OpportunityForm mode="create" categories={categories} />
        )}
      </Card>
    </div>
  );
}
