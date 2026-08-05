import { ExternalResultCard } from "@/components/lia/external-result-card";
import { MatchCard } from "@/components/lia/match-card";
import { ProjectAnalysis } from "@/components/lia/project-analysis";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SolutionReport } from "@/types/lia";

type SolutionPanelProps = {
  report: SolutionReport;
};

export function SolutionPanel({ report }: SolutionPanelProps) {
  const internal = [
    ...report.internal.investments,
    ...report.internal.experts,
    ...report.internal.opportunities,
    ...report.internal.projects,
  ];

  return (
    <div className="space-y-6">
      <ProjectAnalysis
        draft={report.solutionDraft}
        projectTitle={report.project.title}
      />

      <Card variant="surface" className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">Найдено в ЦКР</Badge>
          <span className="text-sm text-muted">
            {report.internal.investments.length} инвестора ·{" "}
            {report.internal.experts.length} эксперта ·{" "}
            {report.internal.opportunities.length} возможностей
          </span>
        </div>
        {internal.length > 0 ? (
          <div className="grid gap-3">
            {internal.map((match) => (
              <MatchCard key={`${match.type}-${match.id}`} match={match} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Точных совпадений в каталогах пока нет. Уточните описание проекта.
          </p>
        )}
      </Card>

      <Card variant="surface" className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">Внешние источники</Badge>
          <Badge variant="default">Не доверять автоматически</Badge>
        </div>
        {report.external.length > 0 ? (
          <div className="grid gap-3">
            {report.external.map((item) => (
              <ExternalResultCard
                key={`${item.source}-${item.url}-${item.title}`}
                result={item}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Внешний поиск не выполнялся или результатов нет.
          </p>
        )}
      </Card>

      <Card variant="surface" className="space-y-4 p-4 sm:p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Рекомендации
        </p>
        <ol className="space-y-2 text-sm text-foreground">
          {report.recommendations.map((item, index) => (
            <li key={item}>
              {index + 1}. {item}
            </li>
          ))}
        </ol>

        <p className="pt-2 text-xs uppercase tracking-[0.14em] text-muted">
          Следующие шаги
        </p>
        <ol className="space-y-2 text-sm text-muted">
          {report.next_steps.map((item, index) => (
            <li key={item}>
              {index + 1}. {item}
            </li>
          ))}
        </ol>

        <p className="border-t border-border pt-3 text-xs text-muted">
          {report.disclaimer} Лия не создаёт заявки и не меняет данные без вашего
          подтверждения.
        </p>
      </Card>
    </div>
  );
}
