import { ApplicationCard } from "@/components/applications/application-card";
import type { ApplicationListItem } from "@/lib/applications/queries";

type ApplicationsListProps = {
  items: ApplicationListItem[];
  emptyText: string;
};

export function ApplicationsList({ items, emptyText }: ApplicationsListProps) {
  if (items.length === 0) {
    return (
      <div className="border border-border bg-surface/40 px-5 py-6">
        <p className="text-sm text-muted">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ApplicationCard key={item.id} application={item} />
      ))}
    </div>
  );
}
