import { SectionHeading } from "@/components/ui/section-heading";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Заявки" };

export default function CabinetApplicationsPage() {
  return (
    <SectionHeading
      title="Заявки"
      description="Единый список заявок появится вместе с модулями инвестиций и решений."
    />
  );
}
