import { Badge } from "@/components/ui/badge";
import { activityActionLabels } from "@/config/notifications";
import type { ActivityFeedItem } from "@/lib/activity/mappers";
import Link from "next/link";

type ActivityFeedProps = {
  items: ActivityFeedItem[];
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        Лента активности пуста. События появятся при работе с проектами,
        сделками и документами.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="border-l-2 border-accent/40 pl-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="soft">
              {activityActionLabels[item.actionType] || item.actionType}
            </Badge>
            <span className="text-xs text-muted">
              {new Date(item.createdAt).toLocaleString("ru-RU")}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground">{item.description}</p>
          {item.projectId ? (
            <Link
              href={`/dashboard/projects/${item.projectId}/workspace`}
              className="mt-1 inline-block text-xs text-accent hover:underline"
            >
              Кабинет проекта
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
