import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ExpertForm } from "@/features/experts/components/expert-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getMyExpertProfile } from "@/lib/experts/queries";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Создать профиль эксперта" };

export default async function CreateExpertPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const existing = await getMyExpertProfile(current.user.id);
  if (existing) redirect("/dashboard/expert/edit");

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Эксперты"
        title="Новый профиль эксперта"
        description="Опишите специализацию, опыт и услуги. Это основа доверия для проектов ЦКР."
      />
      <Card variant="surface" className="p-5 sm:p-6">
        <ExpertForm mode="create" />
      </Card>
    </div>
  );
}
