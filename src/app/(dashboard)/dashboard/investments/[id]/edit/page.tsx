import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { InvestmentForm } from "@/features/investments/components/investment-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getInvestmentOfferById } from "@/lib/investments/queries";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type EditInvestmentPageProps = {
  params: { id: string };
};

export const metadata: Metadata = {
  title: "Редактирование инвестиционного предложения",
};

export default async function EditInvestmentPage({
  params,
}: EditInvestmentPageProps) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const offer = await getInvestmentOfferById(params.id);
  if (!offer) notFound();
  if (offer.ownerId !== current.user.id) redirect("/dashboard/investments");

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Инвестиции"
        title="Редактирование"
        description="Обновляйте параметры капитала и статус публикации."
      />
      <Card variant="surface" className="p-5 sm:p-6">
        <InvestmentForm mode="edit" offer={offer} />
      </Card>
    </div>
  );
}
