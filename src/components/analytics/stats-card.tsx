import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

type StatsCardProps = {
  label: string;
  value: number | string;
  href?: string;
  hint?: string;
  className?: string;
};

/**
 * Карточка показателя аналитики ЦКР.
 * Совместима с админ-обзором.
 */
export function StatsCard({
  label,
  value,
  href,
  hint,
  className,
}: StatsCardProps) {
  const display =
    typeof value === "number"
      ? new Intl.NumberFormat("ru-RU").format(value)
      : value;

  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-semibold text-foreground">
        {display}
      </p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Card
        as="article"
        variant="surface"
        className={cn(
          "p-5 transition-colors hover:border-accent/40",
          className,
        )}
      >
        <Link href={href} className="block focus-visible:outline-none">
          {content}
        </Link>
      </Card>
    );
  }

  return (
    <Card as="article" variant="surface" className={cn("p-5", className)}>
      {content}
    </Card>
  );
}
