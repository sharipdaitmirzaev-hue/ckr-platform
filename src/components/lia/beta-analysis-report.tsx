import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { BetaAnalysisReport } from "@/types/lia";

type Props = {
  report: BetaAnalysisReport;
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

export function BetaAnalysisReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">BetaAnalysisReport</Badge>
        <Badge variant="soft">активация {report.activation_rate}%</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Застрявшие пользователи" items={report.blocked_users} />
        <ListBlock title="Мало используемые функции" items={report.unused_features} />
      </div>
      <ListBlock title="Рекомендации" items={report.recommendations} />
      <p className="text-xs text-muted">
        Лия только анализирует запуск. Статусы приглашений не изменяются
        автоматически.
      </p>
      <ButtonLink href="/admin/beta-report" size="sm" variant="outline">
        Beta Report
      </ButtonLink>
    </div>
  );
}
