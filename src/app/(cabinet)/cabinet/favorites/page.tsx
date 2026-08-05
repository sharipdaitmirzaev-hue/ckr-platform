import { SectionHeading } from "@/components/ui/section-heading";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Избранное" };

export default function CabinetFavoritesPage() {
  return (
    <SectionHeading
      title="Избранное"
      description="Сохранённые проекты, возможности и решения."
    />
  );
}
