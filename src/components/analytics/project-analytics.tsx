import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { MetricCard } from "@/components/analytics/metric-card";
import { Card } from "@/components/ui/card";
import { analyticsEventLabels } from "@/config/analytics";
import type { AnalyticsEventType } from "@/config/analytics";
import type { ProjectAnalyticsData } from "@/lib/analytics/queries";

type ProjectAnalyticsProps = {
  data: ProjectAnalyticsData;
};

export function ProjectAnalytics({ data }: ProjectAnalyticsProps) {
  const chartItems = data.recentEvents.map((item) => ({
    label:
      analyticsEventLabels[item.key as AnalyticsEventType] ?? item.label,
    value: item.value,
  }));

  return (
    <Card variant="surface" className="space-y-6 p-5">
      <div>
        <h2 className="font-display text-xl text-foreground">
          Аналитика проекта
        </h2>
        <p className="mt-1 text-sm text-muted">
          Показатели доступны владельцу и участникам кабинета проекта.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Просмотры" value={data.views} />
        <MetricCard label="Заявки" value={data.applications} />
        <MetricCard
          label="Инвестиционный интерес"
          value={data.investmentInterest}
          hint="Заявки + сделки типа investment"
        />
        <MetricCard
          label="Активность"
          value={data.activityCount}
          hint="События в истории проекта"
        />
      </div>

      {chartItems.length > 0 ? (
        <AnalyticsChart
          title="События по проекту"
          items={chartItems}
        />
      ) : null}
    </Card>
  );
}
