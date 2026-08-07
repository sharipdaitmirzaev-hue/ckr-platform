/**
 * UI: бар-диаграмма аналитики (admin/analytics и др.).
 * Путь case-sensitive: src/components/analytics/analytics-chart.tsx
 */
import { cn } from "@/lib/utils";

export type AnalyticsChartItem = {
  label: string;
  value: number;
};

type AnalyticsChartProps = {
  title?: string;
  items: AnalyticsChartItem[];
  emptyText?: string;
  className?: string;
};

/**
 * Простая бар-диаграмма без внешних библиотек — стиль ЦКР.
 */
export function AnalyticsChart({
  title,
  items,
  emptyText = "Нет данных за период",
  className,
}: AnalyticsChartProps) {
  const max = Math.max(...items.map((item) => item.value), 0);

  return (
    <div className={cn("space-y-4", className)}>
      {title ? (
        <h3 className="font-display text-lg text-foreground">{title}</h3>
      ) : null}
      {items.length === 0 || max === 0 ? (
        <p className="text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const width = max > 0 ? Math.max(4, (item.value / max) * 100) : 0;
            return (
              <li key={item.label}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-muted">{item.label}</span>
                  <span className="font-display text-foreground">
                    {new Intl.NumberFormat("ru-RU").format(item.value)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-sm bg-foreground/5">
                  <div
                    className="h-full origin-left animate-line-draw rounded-sm bg-accent"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
