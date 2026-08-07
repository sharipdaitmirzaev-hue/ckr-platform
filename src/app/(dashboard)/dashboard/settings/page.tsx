import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Настройки" };

export default function DashboardSettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        title="Настройки"
        description="Основные данные профиля и роли редактируются в онбординге."
      />
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/onboarding" variant="outline">
          Открыть профиль и роли
        </ButtonLink>
        <ButtonLink href="/dashboard/billing" variant="outline">
          Оплата и подписка
        </ButtonLink>
      </div>
    </div>
  );
}
