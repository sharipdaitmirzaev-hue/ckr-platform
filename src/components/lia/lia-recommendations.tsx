import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LiaRecommendation } from "@/lib/lia/recommendations";
import Link from "next/link";

type LiaRecommendationsProps = {
  items: LiaRecommendation[];
};

const priorityLabel = {
  high: "Важно",
  medium: "Далее",
  low: "Ориентир",
} as const;

export function LiaRecommendations({ items }: LiaRecommendationsProps) {
  return (
    <Card variant="surface" className="space-y-4 p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          Лия
        </p>
        <h2 className="mt-1 font-display text-xl text-foreground">
          Мои рекомендации
        </h2>
        <p className="mt-2 text-sm text-muted">
          Новые события, следующие шаги и важные действия. Лия только
          рекомендует — решения за вами.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="space-y-2 text-sm text-muted">
          <p>Рекомендаций пока нет.</p>
          <p>
            Создайте проект или откройте{" "}
            <Link href="/lia" className="text-accent hover:underline">
              Лию
            </Link>
            , чтобы получить следующий шаг.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-sm border border-border bg-background/40 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={item.priority === "high" ? "accent" : "soft"}
                >
                  {priorityLabel[item.priority]}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">
                {item.title}
              </p>
              <p className="mt-1 text-sm text-muted">{item.description}</p>
              <Link
                href={item.href}
                className="mt-2 inline-block text-sm text-accent hover:underline"
              >
                Открыть
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
