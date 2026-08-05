import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Возможности",
  description:
    "Земля, помещения, оборудование, готовый бизнес и технологии на платформе ЦКР.",
};

const placeholders = [
  {
    type: "Земля",
    title: "Участок под производство",
    summary: "Площадка с инженерной подготовкой для промышленного объекта.",
    region: "МО",
  },
  {
    type: "Оборудование",
    title: "Линия фасовки и упаковки",
    summary: "Готовое оборудование для запуска или расширения производства.",
    region: "Казань",
  },
  {
    type: "Готовый бизнес",
    title: "Сервисный бизнес с клиентской базой",
    summary: "Действующий бизнес, открытый к партнёрству или передаче.",
    region: "Санкт-Петербург",
  },
];

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
          {placeholders.map((item) => (
            <article key={item.title} className="border-t border-border pt-5">
              <Badge variant="accent">{item.type}</Badge>
              <h2 className="mt-4 font-display text-xl font-medium text-foreground">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {item.summary}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">
                {item.region}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </div>
  );
}
