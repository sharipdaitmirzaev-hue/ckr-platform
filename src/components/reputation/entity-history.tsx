import { Badge } from "@/components/ui/badge";
import { entityHistoryKindLabels } from "@/config/reputation";
import type { EntityHistoryItem } from "@/types";

type EntityHistoryListProps = {
  items: EntityHistoryItem[];
};

export function EntityHistoryList({ items }: EntityHistoryListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        История участия пока пуста.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-sm border border-border bg-background/40 px-4 py-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="soft">{entityHistoryKindLabels[item.kind]}</Badge>
            {item.createdAt ? (
              <span className="text-xs text-muted">
                {new Date(item.createdAt).toLocaleDateString("ru-RU")}
              </span>
            ) : null}
          </div>
          <p className="mt-2 font-display text-sm font-medium text-foreground">
            {item.title || "Событие участия"}
          </p>
        </li>
      ))}
    </ol>
  );
}
