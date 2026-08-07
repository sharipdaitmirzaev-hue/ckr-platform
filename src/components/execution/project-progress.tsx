import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import {
  roadmapItemStatusLabels,
  roadmapStatusLabels,
} from "@/config/execution";
import { CreateRoadmapForm } from "@/features/execution/components/create-roadmap-form";
import { MarkProgressCheckedButton } from "@/features/execution/components/mark-progress-checked-button";
import { MetricUpdateForm } from "@/features/execution/components/metric-update-form";
import { RoadmapItemStatusSelect } from "@/features/execution/components/roadmap-item-status-select";
import type { ProjectProgressSummary } from "@/types/execution";

type ProjectProgressProps = {
  summary: ProjectProgressSummary;
  canManage: boolean;
  projectTitle: string;
};

function metricPercent(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function ProjectProgress({
  summary,
  canManage,
  projectTitle,
}: ProjectProgressProps) {
  if (!summary.roadmap) {
    return (
      <Card variant="surface" className="space-y-4 p-5">
        <div>
          <h2 className="font-display text-xl text-foreground">
            Прогресс реализации
          </h2>
          <p className="mt-1 text-sm text-muted">
            Дорожная карта ещё не создана. Зафиксируйте этапы, задачи и KPI —
            от стратегии к результату.
          </p>
        </div>
        {canManage ? <CreateRoadmapForm projectId={summary.projectId} /> : null}
        <ButtonLink
          href={`/lia?project=${summary.projectId}&scenario=check_progress`}
          variant="outline"
          size="sm"
        >
          Проверь прогресс проекта (Лия)
        </ButtonLink>
      </Card>
    );
  }

  const current = summary.currentItem;

  return (
    <Card variant="surface" className="space-y-6 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl text-foreground">
            Прогресс реализации
          </h2>
          <p className="mt-1 text-sm text-muted">
            {summary.roadmap.title} · {projectTitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="accent">
            {roadmapStatusLabels[summary.roadmap.status]}
          </Badge>
          <Badge variant="soft">{summary.percentComplete}% выполнено</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-border px-3 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Текущий этап
          </p>
          <p className="mt-2 text-sm text-foreground">
            {current
              ? `${current.orderNumber}. ${current.title}`
              : "Нет активного этапа"}
          </p>
          {current ? (
            <p className="mt-1 text-xs text-muted">
              {roadmapItemStatusLabels[current.status]}
              {typeof current.progressPercent === "number"
                ? ` · задачи ${current.progressPercent}%`
                : ""}
            </p>
          ) : null}
        </div>
        <div className="rounded-sm border border-border px-3 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Этапы
          </p>
          <p className="mt-2 text-sm text-foreground">
            {summary.completedItemsCount} / {summary.totalItemsCount}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-accent"
              style={{ width: `${summary.percentComplete}%` }}
            />
          </div>
        </div>
        <div className="rounded-sm border border-border px-3 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Просрочки
          </p>
          <p className="mt-2 text-sm text-foreground">
            {summary.overdueItems.length} этапов ·{" "}
            {summary.overdueTasks.length} задач
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Этапы roadmap</h3>
          <ul className="space-y-2">
            {summary.items.map((item) => (
              <li
                key={item.id}
                className="rounded-sm border border-border px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-foreground">
                      {item.orderNumber}. {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {item.tasks?.length ?? 0} задач · прогресс{" "}
                      {item.progressPercent ?? 0}%
                      {item.deadline
                        ? ` · срок ${new Date(item.deadline).toLocaleDateString("ru-RU")}`
                        : ""}
                    </p>
                  </div>
                  {canManage ? (
                    <RoadmapItemStatusSelect
                      projectId={summary.projectId}
                      itemId={item.id}
                      status={item.status}
                    />
                  ) : (
                    <Badge variant="soft">
                      {roadmapItemStatusLabels[item.status]}
                    </Badge>
                  )}
                </div>
                {item.tasks && item.tasks.length > 0 ? (
                  <ul className="mt-2 space-y-1 border-t border-border/60 pt-2 text-xs text-muted">
                    {item.tasks.map((task) => (
                      <li key={task.id}>
                        {task.title}
                        <span className="ml-1">({task.status})</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Ближайшие задачи
            </h3>
            {summary.upcomingTasks.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {summary.upcomingTasks.map((task) => (
                  <li key={task.id}>
                    {task.title}
                    {task.deadline
                      ? ` · до ${new Date(task.deadline).toLocaleDateString("ru-RU")}`
                      : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Открытых задач нет.</p>
            )}
          </div>

          {summary.overdueTasks.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Просроченные задачи
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-accent">
                {summary.overdueTasks.map((task) => (
                  <li key={task.id}>{task.title}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-medium text-foreground">KPI</h3>
            {summary.metrics.length > 0 ? (
              <ul className="mt-2 space-y-3">
                {summary.metrics.map((metric) => {
                  const pct = metricPercent(
                    metric.currentValue,
                    metric.targetValue,
                  );
                  return (
                    <li
                      key={metric.id}
                      className="rounded-sm border border-border px-3 py-2"
                    >
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="text-foreground">{metric.name}</span>
                        <span className="text-muted">
                          {metric.currentValue} / {metric.targetValue}{" "}
                          {metric.unit}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {canManage ? (
                        <MetricUpdateForm
                          projectId={summary.projectId}
                          metricId={metric.id}
                          currentValue={metric.currentValue}
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">KPI ещё не заданы.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <ButtonLink
          href={`/lia?project=${summary.projectId}&scenario=check_progress`}
          size="sm"
        >
          Проверь прогресс проекта
        </ButtonLink>
        {canManage ? (
          <MarkProgressCheckedButton projectId={summary.projectId} />
        ) : null}
      </div>
    </Card>
  );
}
