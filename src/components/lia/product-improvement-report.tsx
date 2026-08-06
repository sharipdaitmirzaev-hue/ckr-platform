import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { ProductImprovementReport } from "@/types/lia";

type Props = {
  report: ProductImprovementReport;
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

export function ProductImprovementReportCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">ProductImprovementReport</Badge>
        <Badge variant="soft">только анализ</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Главные проблемы" items={report.main_problems} />
        <ListBlock title="Паттерны" items={report.patterns} />
        <ListBlock title="Рекомендации" items={report.recommendations} />
        <ListBlock title="Приоритетные действия" items={report.priority_actions} />
      </div>
      <p className="text-xs text-muted">
        Лия только анализирует данные пилота. Записи product_improvements не
        создаются автоматически.
      </p>
      <ButtonLink href="/admin/improvements" size="sm" variant="outline">
        Центр улучшений
      </ButtonLink>
    </div>
  );
}
