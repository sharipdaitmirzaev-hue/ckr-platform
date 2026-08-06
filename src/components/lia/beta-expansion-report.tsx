import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { BetaExpansionReport } from "@/types/lia";

type Props = { report: BetaExpansionReport };

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

export function BetaExpansionReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">BetaExpansionReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Activation" items={report.activation} />
        <ListBlock title="Role analysis" items={report.role_analysis} />
        <ListBlock title="Lia usage" items={report.lia_usage} />
        <ListBlock title="Ecosystem growth" items={report.ecosystem_growth} />
        <ListBlock title="Problems" items={report.problems} />
        <ListBlock title="Recommendations" items={report.recommendations} />
      </div>
      <ButtonLink href="/admin/beta-expansion" size="sm" variant="outline">
        Beta Expansion Dashboard
      </ButtonLink>
    </div>
  );
}
