import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/config/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "О платформе",
  description: brand.positioning,
};

export default function AboutPage() {
  return (
    <div className="py-14 sm:py-16">
      <Container className="max-w-3xl">
        <SectionHeading
          eyebrow={brand.name}
          title={brand.fullName}
          description={brand.positioning}
        />

        <div className="mt-10 space-y-6 text-base leading-relaxed text-muted">
          <p>
            ЦКР — это не доска объявлений. Это бизнес-платформа, которая
            соединяет предпринимателей, инвесторов, владельцев активов и
            экспертов вокруг реальных задач.
          </p>
          <p>
            Главная логика работы:{" "}
            <span className="text-foreground">
              {brand.journey.join(" → ")}
            </span>
            .
          </p>
          <p className="text-accent">{brand.tagline}</p>
        </div>
      </Container>
    </div>
  );
}
