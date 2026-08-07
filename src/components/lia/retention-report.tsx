import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { RetentionReport } from "@/types/lia";

type Props = { report: RetentionReport };

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {title}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function RetentionReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">RetentionReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Returning users" items={report.returning_users} />
        <ListBlock title="Valuable actions" items={report.valuable_actions} />
        <ListBlock title="Drop-off points" items={report.drop_off_points} />
        <ListBlock title="Recommendations" items={report.recommendations} />
      </div>
      <ButtonLink href="/admin/open-beta-growth" size="sm" variant="outline">
        Open Beta Growth
      </ButtonLink>
    </div>
  );
}
