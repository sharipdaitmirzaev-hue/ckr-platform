import { LiaWidget } from "@/components/lia/lia-widget";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Личный кабинет",
};

const blocks = [
  { title: "Мои проекты", text: "Черновики и опубликованные проекты." },
  { title: "Заявки", text: "Входящие и исходящие обращения." },
  { title: "Избранное", text: "Сохранённые проекты и возможности." },
  { title: "Документы", text: "Файлы и материалы по проектам." },
];

export default function CabinetPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Кабинет"
        title="Обзор"
        description="Базовый каркас личного кабинета. Данные и Auth появятся на Этапе 1."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {blocks.map((block) => (
          <div
            key={block.title}
            className="border border-border bg-surface/60 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg text-foreground">
                {block.title}
              </h2>
              <Badge variant="soft">Скоро</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">{block.text}</p>
          </div>
        ))}
      </div>

      <LiaWidget compact />
    </div>
  );
}
