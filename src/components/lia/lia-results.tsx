import type { LiaResultLink } from "@/types/lia";
import Link from "next/link";

const typeLabels: Record<LiaResultLink["type"], string> = {
  project: "Проект",
  opportunity: "Возможность",
  investment: "Инвестиции",
  expert: "Эксперт",
};

type LiaResultsProps = {
  results: LiaResultLink[];
};

export function LiaResults({ results }: LiaResultsProps) {
  if (results.length === 0) return null;

  return (
    <ul className="mt-3 space-y-2">
      {results.map((item) => (
        <li key={`${item.type}:${item.id}`}>
          <Link
            href={item.href}
            className="block rounded-sm border border-border bg-background/40 px-3 py-2 transition-colors hover:border-accent/40"
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-accent">
              {typeLabels[item.type]}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {item.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {item.summary}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
