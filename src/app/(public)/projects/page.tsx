import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Проекты",
  description:
    "Каталог бизнес-проектов ЦКР: идеи и компании, ищущие ресурсы, капитал и партнёров.",
};

const placeholders = [
  {
    title: "Производственная линия в регионе",
    summary: "Масштабирование производства с поиском инвестора и площадки.",
    region: "Центральный ФО",
    need: "от 25 млн ₽",
  },
  {
    title: "Цифровой сервис для B2B",
    summary: "MVP готов, требуется капитал на выход в новые отрасли.",
    region: "Москва",
    need: "от 8 млн ₽",
  },
  {
    title: "Агропроект с переработкой",
    summary: "Поиск земли, оборудования и отраслевых партнёров.",
    region: "Южный ФО",
    need: "от 40 млн ₽",
  },
];

export default function ProjectsPage() {
  return (
    <div className="py-14 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow="Каталог"
          title="Проекты"
          description="Бизнес-идеи и действующие проекты, которым нужны инвестиции, активы и партнёры. Данные каталога будут подключены на следующем этапе."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {placeholders.map((project) => (
            <article
              key={project.title}
              className="border-t border-border pt-5"
            >
              <div className="flex items-center gap-2">
                <Badge variant="soft">{project.region}</Badge>
                <Badge variant="accent">{project.need}</Badge>
              </div>
              <h2 className="mt-4 font-display text-xl font-medium text-foreground">
                {project.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {project.summary}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </div>
  );
}
