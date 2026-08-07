import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { OpportunityForm } from "@/features/opportunities/components/opportunity-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getOpportunityById,
  listOpportunityCategories,
} from "@/lib/opportunities/queries";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type EditOpportunityPageProps = {
  params: { id: string };
};

export const metadata: Metadata = { title: "Редактирование возможности" };

export default async function EditOpportunityPage({
  params,
}: EditOpportunityPageProps) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const [opportunity, categories] = await Promise.all([
    getOpportunityById(params.id),
    listOpportunityCategories(),
  ]);

  if (!opportunity) notFound();
  if (opportunity.ownerId !== current.user.id) {
    redirect("/dashboard/opportunities");
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Возможности"
        title="Редактирование"
        description="Обновляйте описание и статус. В каталоге видны только возможности со статусом «Опубликована»."
      />

      <Card variant="surface" className="p-5 sm:p-6">
        <OpportunityForm
          mode="edit"
          categories={categories}
          opportunity={opportunity}
        />
      </Card>
    </div>
  );
}
