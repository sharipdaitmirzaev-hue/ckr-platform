import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { OperatorQueueItem } from "@/types";
import Link from "next/link";

const kindLabels: Record<OperatorQueueItem["kind"], string> = {
  lead: "Лид",
  project: "Проект",
  application: "Заявка",
  deal: "Сделка",
  document: "Документ",
  verification: "Верификация",
  task: "Задача",
};

type OperatorQueueProps = {
  items: OperatorQueueItem[];
};

export function OperatorQueue({ items }: OperatorQueueProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Очередь пуста"
        description="Новых лидов, заявок и задач для разбора нет."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card variant="surface" className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="soft">{kindLabels[item.kind]}</Badge>
                  {item.overdue ? (
                    <Badge variant="accent">SLA</Badge>
                  ) : null}
                  <span className="text-xs text-muted">{item.status}</span>
                </div>
                <Link
                  href={item.href}
                  className="block font-medium text-foreground hover:text-accent"
                >
                  {item.title}
                </Link>
                {item.subtitle ? (
                  <p className="text-sm text-muted">{item.subtitle}</p>
                ) : null}
              </div>
              <time className="shrink-0 text-xs text-muted">
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleString("ru-RU")
                  : ""}
              </time>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
