/**
 * UI: метрика-карточка аналитики (admin/analytics и др.).
 * Путь case-sensitive: src/components/analytics/metric-card.tsx
 */
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
};

export function MetricCard({
  label,
  value,
  hint,
  className,
}: MetricCardProps) {
  const display =
    typeof value === "number"
      ? new Intl.NumberFormat("ru-RU").format(value)
      : value;

  return (
    <div
      className={cn(
        "border-l border-accent/40 pl-4",
        className,
      )}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-foreground">
        {display}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
