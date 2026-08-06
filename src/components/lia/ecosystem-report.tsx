import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { EcosystemReport } from "@/types/lia";

type Props = { report: EcosystemReport };

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

export function EcosystemReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">EcosystemReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Active users" items={report.active_users} />
        <ListBlock title="Project activity" items={report.project_activity} />
        <ListBlock title="Expert activity" items={report.expert_activity} />
        <ListBlock
          title="Investment activity"
          items={report.investment_activity}
        />
        <ListBlock title="Connections" items={report.connections} />
        <ListBlock title="Recommendations" items={report.recommendations} />
      </div>
      <ButtonLink href="/admin/ecosystem-report" size="sm" variant="outline">
        Ecosystem Report
      </ButtonLink>
    </div>
  );
}
