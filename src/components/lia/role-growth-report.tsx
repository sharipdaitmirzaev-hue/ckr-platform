import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { RoleGrowthReport } from "@/types/lia";

type Props = { report: RoleGrowthReport };

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

export function RoleGrowthReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">RoleGrowthReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Предприниматели" items={report.entrepreneurs} />
        <ListBlock title="Эксперты" items={report.experts} />
        <ListBlock title="Инвесторы" items={report.investors} />
        <ListBlock title="Организации" items={report.organizations} />
      </div>
      <ButtonLink href="/admin/open-beta-growth" size="sm" variant="outline">
        Open Beta Growth
      </ButtonLink>
    </div>
  );
}
