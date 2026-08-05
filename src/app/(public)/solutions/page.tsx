import { SolutionCard } from "@/components/solutions/solution-card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { mockSolutions } from "@/lib/mock/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Решения",
  description:
    "Комплексные предложения ЦКР: инвестор, земля, оборудование, специалисты, юридическое и маркетинговое сопровождение.",
};

export default function SolutionsPage() {
  return (
    <div className="py-14 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow="Модуль"
          title="Решения"
          description="Комплексные предложения для бизнеса: соберите нужные ресурсы и сопровождение в одном запросе. Полный функционал модуля — в следующих этапах."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockSolutions.map((solution) => (
            <SolutionCard key={solution.id} solution={solution} />
          ))}
        </div>
      </Container>
    </div>
  );
}
