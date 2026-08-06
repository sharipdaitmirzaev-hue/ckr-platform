import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { StrategyReport } from "@/types/lia";

type StrategyReportCardProps = {
  report: StrategyReport;
};

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

export function StrategyReportCard({ report }: StrategyReportCardProps) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">StrategyReport</Badge>
        <Badge variant="soft">Этап методологии: стратегия</Badge>
        <Badge variant="default">{report.suggestedTemplate}</Badge>
      </div>
      <div>
        <p className="font-display text-lg text-foreground">
          {report.projectTitle}
        </p>
        <p className="mt-1 text-sm text-muted">{report.summary}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Цели" items={report.goals} />
        <ListBlock title="Направления роста" items={report.growthDirections} />
        <ListBlock title="Ресурсы" items={report.resources} />
        <ListBlock title="Риски" items={report.risks} />
      </div>
      <ListBlock title="План действий" items={report.actionPlan} />
      <div className="flex flex-wrap gap-2 pt-1">
        <ButtonLink
          href={`/dashboard/projects/create?template=${report.suggestedTemplate}`}
          size="sm"
        >
          Шаблон проекта
        </ButtonLink>
        <ButtonLink href="/lia" size="sm" variant="outline">
          Аудит / поиск ресурсов
        </ButtonLink>
      </div>
    </div>
  );
}
