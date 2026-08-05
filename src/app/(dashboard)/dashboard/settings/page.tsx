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
      <ButtonLink href="/onboarding" variant="outline">
        Открыть профиль и роли
      </ButtonLink>
    </div>
  );
}
