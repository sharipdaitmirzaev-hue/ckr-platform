import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { ProductFixImprovementReport } from "@/types/lia";

type Props = { report: ProductFixImprovementReport };

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

export function ProductFixImprovementReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">ProductFixImprovementReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Completed" items={report.completed} />
        <ListBlock title="Improved" items={report.improved} />
        <ListBlock title="Remaining problems" items={report.remaining_problems} />
        <ListBlock title="Next steps" items={report.next_steps} />
      </div>
      <ButtonLink href="/admin/product-sprint" size="sm" variant="outline">
        Product Fix Sprint
      </ButtonLink>
    </div>
  );
}
