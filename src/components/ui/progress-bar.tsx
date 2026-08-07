import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  showLabel?: boolean;
};

export function ProgressBar({
  value,
  className,
  trackClassName,
  barClassName,
  showLabel = true,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={cn("space-y-1", className)}>
      <div
        className={cn(
          "h-1.5 w-full overflow-hidden rounded-sm bg-border/80",
          trackClassName,
        )}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-sm bg-accent transition-all", barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <p className="text-xs text-muted">{pct}%</p>
      ) : null}
    </div>
  );
}
