import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Решения",
  description:
    "Комплексные предложения ЦКР: инвестор, земля, оборудование, специалисты, юридическое и маркетинговое сопровождение.",
};

const solutionTypes = [
  "Поиск инвестора",
  "Поиск земли",
  "Поиск оборудования",
  "Поиск специалистов",
  "Юридическое сопровождение",
  "Маркетинг",
];

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
          {solutionTypes.map((type) => (
            <div
              key={type}
              className="border border-border bg-surface/50 px-5 py-6"
            >
              <Badge variant="soft">Решение</Badge>
              <h2 className="mt-4 font-display text-lg font-medium text-foreground">
                {type}
              </h2>
              <p className="mt-2 text-sm text-muted">
                Заготовка карточки комплексного предложения.
              </p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
