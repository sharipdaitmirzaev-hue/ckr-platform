import { ProjectCard } from "@/components/projects/project-card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { mockProjects } from "@/lib/mock/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Проекты",
  description:
    "Каталог бизнес-проектов ЦКР: идеи и компании, ищущие ресурсы, капитал и партнёров.",
};

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
          {mockProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </Container>
    </div>
  );
}
