import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { PublicLaunchReport } from "@/types/lia";

type Props = { report: PublicLaunchReport };

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

export function PublicLaunchReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">PublicLaunchReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Users" items={report.users} />
        <ListBlock title="Activation" items={report.activation} />
        <ListBlock title="Ecosystem" items={report.ecosystem} />
        <ListBlock title="Business results" items={report.business_results} />
        <ListBlock title="Risks" items={report.risks} />
        <ListBlock title="Recommendations" items={report.recommendations} />
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/admin/public-launch" size="sm" variant="outline">
          Public Launch
        </ButtonLink>
        <ButtonLink href="/admin/public-launch-kpi" size="sm" variant="outline">
          KPI
        </ButtonLink>
      </div>
    </div>
  );
}
