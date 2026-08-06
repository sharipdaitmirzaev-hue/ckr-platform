import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { InvestmentForm } from "@/features/investments/components/investment-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Создать инвестиционное предложение" };

export default async function CreateInvestmentPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Инвестиции"
        title="Новое предложение"
        description="Укажите диапазон суммы, регионы, отрасли и тип участия. После публикации проекты смогут отправлять вам заявки."
      />
      <Card variant="surface" className="p-5 sm:p-6">
        <InvestmentForm mode="create" />
      </Card>
    </div>
  );
}
