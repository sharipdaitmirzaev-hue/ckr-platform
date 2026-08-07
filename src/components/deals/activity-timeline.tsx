import { Badge } from "@/components/ui/badge";
import { projectActivityTypeLabels } from "@/config/deals";
import type { ActivityWithActor } from "@/lib/deals/queries";

type ActivityTimelineProps = {
  items: ActivityWithActor[];
};

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        История пока пуста. События появятся при сделках, этапах и документах.
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
              {projectActivityTypeLabels[item.activityType] || item.activityType}
            </Badge>
            <span className="text-xs text-muted">
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString("ru-RU")
                : ""}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground">{item.title}</p>
          {item.body ? (
            <p className="mt-0.5 text-sm text-muted">{item.body}</p>
          ) : null}
          {item.actorName ? (
            <p className="mt-1 text-xs text-muted">{item.actorName}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
