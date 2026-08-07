import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { RevenueOpportunityReport } from "@/types/lia";

type Props = { report: RevenueOpportunityReport };

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

export function RevenueOpportunityReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">RevenueOpportunityReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock
          title="Active opportunities"
          items={report.active_opportunities}
        />
        <ListBlock
          title="Service opportunities"
          items={report.service_opportunities}
        />
        <ListBlock
          title="Deal opportunities"
          items={report.deal_opportunities}
        />
        <ListBlock
          title="Partner opportunities"
          items={report.partner_opportunities}
        />
        <ListBlock title="Risks" items={report.risks} />
        <ListBlock
          title="Recommended actions"
          items={report.recommended_actions}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/admin/revenue" size="sm" variant="outline">
          Revenue
        </ButtonLink>
        <ButtonLink href="/admin/revenue-kpi" size="sm" variant="outline">
          Revenue KPI
        </ButtonLink>
      </div>
    </div>
  );
}
