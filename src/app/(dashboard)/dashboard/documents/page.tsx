import { SectionHeading } from "@/components/ui/section-heading";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Документы" };

export default function DashboardDocumentsPage() {
  return (
    <SectionHeading
      title="Документы"
      description="Хранилище файлов через Supabase Storage — в следующих этапах."
    />
  );
}
