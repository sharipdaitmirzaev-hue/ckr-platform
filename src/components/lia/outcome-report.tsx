import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { OutcomeReport } from "@/types/lia";

type OutcomeReportCardProps = {
  report: OutcomeReport;
  projectId?: string | null;
};

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          {title}
        </p>
        <p className="mt-2 text-sm text-muted">Нет пунктов.</p>
      </div>
    );
  }
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

export function OutcomeReportCard({
  report,
  projectId,
}: OutcomeReportCardProps) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">OutcomeReport</Badge>
      </div>
      <div>
        <p className="font-display text-lg text-foreground">
          {report.projectTitle}
        </p>
        <p className="mt-1 text-sm text-muted">{report.summary}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Достижения" items={report.achievements} />
        <ListBlock title="Не достигнуто" items={report.missed_targets} />
        <ListBlock title="Риски" items={report.risks} />
        <ListBlock title="Рекомендации" items={report.recommendations} />
      </div>
      <ListBlock title="Следующие шаги" items={report.next_steps} />
      <p className="text-xs text-muted">
        Лия только анализирует. Показатели и результаты не изменяются
        автоматически.
      </p>
      <div className="flex flex-wrap gap-2">
        {projectId ? (
          <ButtonLink
            href={`/dashboard/projects/${projectId}/workspace`}
            size="sm"
            variant="outline"
          >
            Workspace проекта
          </ButtonLink>
        ) : null}
        <ButtonLink href="/admin/results" size="sm" variant="outline">
          Панель результатов ЦКР
        </ButtonLink>
      </div>
    </div>
  );
}
