import { SectionHeading } from "@/components/ui/section-heading";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Мои проекты" };

export default function CabinetProjectsPage() {
  return (
    <SectionHeading
      title="Мои проекты"
      description="Раздел будет заполнен после подключения Auth и модуля проектов."
    />
  );
}
