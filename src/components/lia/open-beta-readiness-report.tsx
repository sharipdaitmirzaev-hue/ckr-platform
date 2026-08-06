import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { OpenBetaReadinessReport } from "@/types/lia";

type Props = { report: OpenBetaReadinessReport };

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

export function OpenBetaReadinessReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">OpenBetaReadinessReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Product readiness" items={report.product_readiness} />
        <ListBlock title="User readiness" items={report.user_readiness} />
        <ListBlock
          title="Ecosystem readiness"
          items={report.ecosystem_readiness}
        />
        <ListBlock title="Risks" items={report.risks} />
        <ListBlock title="Recommendations" items={report.recommendations} />
      </div>
      <ButtonLink href="/admin/open-beta-review" size="sm" variant="outline">
        Open Beta Review
      </ButtonLink>
    </div>
  );
}
