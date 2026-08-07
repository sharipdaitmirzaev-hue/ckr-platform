import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { GrowthReport } from "@/types/lia";

type Props = { report: GrowthReport };

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

export function GrowthReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">GrowthReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="User growth" items={report.user_growth} />
        <ListBlock title="Project growth" items={report.project_growth} />
        <ListBlock title="Expert growth" items={report.expert_growth} />
        <ListBlock title="Partner growth" items={report.partner_growth} />
        <ListBlock title="Channels" items={report.channels} />
        <ListBlock title="Recommendations" items={report.recommendations} />
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/admin/growth" size="sm" variant="outline">
          Growth Dashboard
        </ButtonLink>
        <ButtonLink href="/admin/growth-kpi" size="sm" variant="outline">
          Growth KPI
        </ButtonLink>
      </div>
    </div>
  );
}
