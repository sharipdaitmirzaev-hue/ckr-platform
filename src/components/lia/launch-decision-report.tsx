import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { LaunchDecisionAIReport } from "@/types/lia";

type Props = { report: LaunchDecisionAIReport };

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

export function LaunchDecisionReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">LaunchDecisionAIReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Strengths" items={report.strengths} />
        <ListBlock title="Weaknesses" items={report.weaknesses} />
        <ListBlock title="Risks" items={report.risks} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Recommendation
        </p>
        <p className="mt-2 text-sm text-foreground">{report.recommendation}</p>
      </div>
      <ButtonLink href="/admin/launch-decision" size="sm" variant="outline">
        Decision Gate
      </ButtonLink>
    </div>
  );
}
