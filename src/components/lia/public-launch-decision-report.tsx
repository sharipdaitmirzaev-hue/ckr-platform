import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { PublicLaunchDecisionReport } from "@/types/lia";

type Props = { report: PublicLaunchDecisionReport };

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

export function PublicLaunchDecisionReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">PublicLaunchDecisionReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Product status" items={report.product_status} />
        <ListBlock title="User status" items={report.user_status} />
        <ListBlock title="Ecosystem status" items={report.ecosystem_status} />
        <ListBlock title="Business status" items={report.business_status} />
        <ListBlock title="Risks" items={report.risks} />
        <ListBlock title="Recommendation" items={report.recommendation} />
      </div>
      <ButtonLink
        href="/admin/public-launch-decision"
        size="sm"
        variant="outline"
      >
        Public Launch Decision
      </ButtonLink>
    </div>
  );
}
