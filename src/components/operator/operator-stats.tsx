import { MetricCard } from "@/components/analytics/metric-card";
import type { OperatorStatsData } from "@/lib/operator/queries";

type OperatorStatsProps = {
  stats: OperatorStatsData;
};

export function OperatorStats({ stats }: OperatorStatsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard label="Новые лиды" value={stats.newLeads} />
      <MetricCard
        label="Новые проекты"
        value={stats.newProjects}
        hint="draft / moderation"
      />
      <MetricCard
        label="Заявки без ответа"
        value={stats.unansweredApplications}
      />
      <MetricCard label="Сделки в ожидании" value={stats.pendingDeals} />
      <MetricCard
        label="Документы на проверке"
        value={stats.documentsPending}
      />
      <MetricCard label="Открытые задачи" value={stats.openTasks} />
    </section>
  );
}
