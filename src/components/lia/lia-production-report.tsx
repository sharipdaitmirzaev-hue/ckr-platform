import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { LiaProductionReport } from "@/types/lia";

type Props = { report: LiaProductionReport };

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

export function LiaProductionReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">LiaProductionReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Availability
        </p>
        <p className="mt-2 text-sm text-foreground">{report.availability}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Usage" items={report.usage} />
        <ListBlock title="Errors" items={report.errors} />
        <ListBlock title="Recommendations" items={report.recommendations} />
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/admin/system-health" size="sm" variant="outline">
          System Health
        </ButtonLink>
        <ButtonLink href="/lia" size="sm" variant="outline">
          Лия
        </ButtonLink>
      </div>
    </div>
  );
}
