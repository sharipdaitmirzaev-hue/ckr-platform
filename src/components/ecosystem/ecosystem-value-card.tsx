import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  className?: string;
};

export function EcosystemValueCard({
  label,
  value,
  hint,
  className,
}: Props) {
  return (
    <Card variant="surface" className={cn("space-y-2 p-5", className)}>
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="font-display text-3xl text-foreground">
        {typeof value === "number"
          ? new Intl.NumberFormat("ru-RU").format(value)
          : value}
      </p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}
