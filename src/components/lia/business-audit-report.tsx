import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { BusinessAuditReport } from "@/types/lia";

type BusinessAuditReportCardProps = {
  report: BusinessAuditReport;
};

function ListBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
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

export function BusinessAuditReportCard({
  report,
}: BusinessAuditReportCardProps) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">BusinessAuditReport</Badge>
        <Badge variant="soft">{report.industry}</Badge>
        <Badge variant="soft">{report.region}</Badge>
        <Badge variant="default">{report.stage}</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Сильные стороны" items={report.strengths} />
        <ListBlock title="Слабые стороны" items={report.weaknesses} />
        <ListBlock title="Возможности" items={report.opportunities} />
        <ListBlock title="Риски" items={report.risks} />
      </div>
      <ListBlock title="Следующие шаги" items={report.next_steps} />
      <p className="text-sm text-muted">
        Лия предлагает следующий шаг. Подтвердите действие сами — ничего не
        создаётся автоматически.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <ButtonLink
          href="/dashboard/projects/create?template=business_development"
          size="sm"
        >
          Создать проект
        </ButtonLink>
        <ButtonLink href="/services?category=consulting" size="sm" variant="outline">
          Получить консультацию
        </ButtonLink>
        <ButtonLink href="/opportunities" size="sm" variant="outline">
          Найти ресурсы
        </ButtonLink>
        <ButtonLink
          href="/lia?scenario=develop_strategy"
          size="sm"
          variant="outline"
        >
          Стратегия развития
        </ButtonLink>
      </div>
    </div>
  );
}
