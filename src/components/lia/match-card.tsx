import { Badge } from "@/components/ui/badge";
import type { InternalMatch } from "@/types/lia";

const typeLabels: Record<InternalMatch["type"], string> = {
  project: "Проект",
  opportunity: "Возможность",
  investment: "Инвестиции",
  expert: "Эксперт",
};

type MatchCardProps = {
  match: InternalMatch;
};

export function MatchCard({ match }: MatchCardProps) {
  const percent = Math.round(match.matchScore * 100);

  return (
    <a
      href={match.href}
      className="block rounded-sm border border-border bg-background/40 px-4 py-3 transition-colors hover:border-accent/40"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="soft">{typeLabels[match.type]}</Badge>
        <Badge variant="accent">Соответствие {percent}%</Badge>
        <Badge variant="default">ЦКР</Badge>
      </div>
      <p className="mt-2 font-display text-base text-foreground">{match.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {match.description}
      </p>
    </a>
  );
}
