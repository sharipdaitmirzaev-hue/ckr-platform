import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ExpertForm } from "@/features/experts/components/expert-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getMyExpertProfile } from "@/lib/experts/queries";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Редактирование профиля эксперта" };

export default async function EditExpertPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const expert = await getMyExpertProfile(current.user.id);
  if (!expert) redirect("/dashboard/expert/create");

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Эксперты"
        title="Редактирование"
        description="Обновляйте компетенции и статус публикации в каталоге."
      />
      <Card variant="surface" className="p-5 sm:p-6">
        <ExpertForm mode="edit" expert={expert} />
      </Card>
    </div>
  );
}
