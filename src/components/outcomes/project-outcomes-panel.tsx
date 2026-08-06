import { KpiOutcomeChain } from "@/components/outcomes/kpi-outcome-chain";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import {
  financialMetricTypeLabels,
  projectResultTypeLabels,
} from "@/config/outcomes";
import type { ProjectOutcomeSummary } from "@/types/outcomes";

type ProjectOutcomesPanelProps = {
  summary: ProjectOutcomeSummary;
};

export function ProjectOutcomesPanel({ summary }: ProjectOutcomesPanelProps) {
  return (
    <Card variant="surface" className="space-y-5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl text-foreground">
            Результаты проекта
          </h2>
          <p className="mt-1 text-sm text-muted">
            Цель → текущее значение KPI → фактический результат
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">Roadmap {summary.roadmapPercent}%</Badge>
          <Badge variant="soft">Сделок: {summary.dealsCount}</Badge>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground">KPI и итоги</h3>
        <div className="mt-2">
          <KpiOutcomeChain rows={summary.kpiRows} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Зафиксированные результаты
          </h3>
          {summary.results.length > 0 ? (
            <ul className="mt-2 space-y-2 text-sm">
              {summary.results.map((result) => (
                <li
                  key={result.id}
                  className="rounded-sm border border-border px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-foreground">{result.title}</span>
                    <Badge variant="soft">
                      {projectResultTypeLabels[result.resultType]}
                    </Badge>
                  </div>
                  {result.value !== null ? (
                    <p className="mt-1 text-xs text-muted">
                      {result.value} {result.unit}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Результатов пока нет.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-foreground">
            Финансовые показатели
          </h3>
          {summary.financialMetrics.length > 0 ? (
            <ul className="mt-2 space-y-2 text-sm">
              {summary.financialMetrics.map((metric) => (
                <li
                  key={metric.id}
                  className="rounded-sm border border-border px-3 py-2"
                >
                  <span className="text-foreground">
                    {financialMetricTypeLabels[metric.metricType]}
                  </span>
                  <span className="ml-2 text-muted">
                    {new Intl.NumberFormat("ru-RU").format(metric.value)}{" "}
                    {metric.currency}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Финпоказатели не заданы.</p>
          )}
        </div>
      </div>

      <ButtonLink
        href={`/lia?project=${summary.projectId}&scenario=evaluate_outcome`}
        size="sm"
        variant="outline"
      >
        Оцени результат проекта
      </ButtonLink>
    </Card>
  );
}
