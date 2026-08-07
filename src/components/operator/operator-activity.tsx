import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { OperatorActivityItem } from "@/types";
import Link from "next/link";

type OperatorActivityProps = {
  items: OperatorActivityItem[];
};

export function OperatorActivity({ items }: OperatorActivityProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Активности пока нет"
        description="Обновления задач, лидов и заявок появятся здесь."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card variant="surface" className="space-y-1 p-4">
            {item.href ? (
              <Link
                href={item.href}
                className="font-medium text-foreground hover:text-accent"
              >
                {item.label}
              </Link>
            ) : (
              <p className="font-medium text-foreground">{item.label}</p>
            )}
            {item.detail ? (
              <p className="text-sm text-muted">{item.detail}</p>
            ) : null}
            {item.at ? (
              <p className="text-xs text-muted">
                {new Date(item.at).toLocaleString("ru-RU")}
              </p>
            ) : null}
          </Card>
        </li>
      ))}
    </ul>
  );
}
