import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { cn } from "@/lib/utils";

export type OutcomeChartItem = {
  label: string;
  value: number;
};

type OutcomeChartProps = {
  title?: string;
  items: OutcomeChartItem[];
  emptyText?: string;
  className?: string;
};

/** Диаграмма результатов ЦКР (на базе AnalyticsChart). */
export function OutcomeChart({
  title,
  items,
  emptyText = "Нет данных по результатам",
  className,
}: OutcomeChartProps) {
  return (
    <div className={cn(className)}>
      <AnalyticsChart title={title} items={items} emptyText={emptyText} />
    </div>
  );
}
