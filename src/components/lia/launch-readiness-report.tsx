import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { LaunchReadinessReport } from "@/types/lia";

type Props = { report: LaunchReadinessReport };

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

export function LaunchReadinessReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">LaunchReadinessReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Critical issues" items={report.critical_issues} />
        <ListBlock title="Recommended actions" items={report.recommended_actions} />
      </div>
      <ListBlock title="Launch risks" items={report.launch_risks} />
      <p className="text-xs text-muted">
        Лия не меняет доступы и не открывает public launch автоматически.
      </p>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/admin/launch" size="sm">
          Launch Checklist
        </ButtonLink>
        <ButtonLink href="/admin/beta-review" size="sm" variant="outline">
          Beta Review
        </ButtonLink>
      </div>
    </div>
  );
}
