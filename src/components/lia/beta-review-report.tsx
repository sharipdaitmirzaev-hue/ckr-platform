import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { BetaReviewReport } from "@/types/lia";

type Props = { report: BetaReviewReport };

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

export function BetaReviewReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">BetaReviewReport</Badge>
        <Badge variant="soft">только данные</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Успешные потоки" items={report.successful_flows} />
        <ListBlock title="Заблокированные" items={report.blocked_flows} />
        <ListBlock title="Unused features" items={report.unused_features} />
        <ListBlock title="Проблемы" items={report.user_problems} />
        <ListBlock title="Ценность" items={report.business_value_signals} />
        <ListBlock title="Рекомендации" items={report.recommendations} />
      </div>
      <ButtonLink href="/admin/beta-review" size="sm" variant="outline">
        Beta Review
      </ButtonLink>
    </div>
  );
}
