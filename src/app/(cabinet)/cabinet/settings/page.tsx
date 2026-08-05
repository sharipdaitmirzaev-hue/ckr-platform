import { SectionHeading } from "@/components/ui/section-heading";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Настройки" };

export default function CabinetSettingsPage() {
  return (
    <SectionHeading
      title="Настройки"
      description="Профиль, роли и уведомления будут доступны после Этапа 1."
    />
  );
}
