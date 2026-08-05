import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { mockOpportunities } from "@/lib/mock/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Возможности",
  description:
    "Земля, помещения, оборудование, готовый бизнес и технологии на платформе ЦКР.",
};

export default function OpportunitiesPage() {
  return (
    <div className="py-14 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow="Каталог"
          title="Возможности"
          description="Ресурсы и активы для реализации проектов: земля, помещения, оборудование, готовый бизнес и технологии."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockOpportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      </Container>
    </div>
  );
}
