import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { ClosedWaveReport } from "@/types/lia";

type Props = { report: ClosedWaveReport };

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

export function ClosedWaveReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">ClosedWaveReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Completed goals" items={report.completed_goals} />
        <ListBlock title="Failed / в работе" items={report.failed_goals} />
        <ListBlock title="User experience" items={report.user_experience} />
        <ListBlock title="Business results" items={report.business_results} />
      </div>
      <ListBlock title="Recommendations" items={report.recommendations} />
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/admin/launch" size="sm">
          Launch Dashboard
        </ButtonLink>
        <ButtonLink
          href="/lia?scenario=launch_goals"
          size="sm"
          variant="outline"
        >
          Цели запуска
        </ButtonLink>
      </div>
    </div>
  );
}
