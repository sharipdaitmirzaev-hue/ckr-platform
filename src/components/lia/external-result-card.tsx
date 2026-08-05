import { Badge } from "@/components/ui/badge";
import type { ExternalSearchResult } from "@/types/lia";

type ExternalResultCardProps = {
  result: ExternalSearchResult;
};

export function ExternalResultCard({ result }: ExternalResultCardProps) {
  const percent = Math.round(result.confidence * 100);

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-sm border border-dashed border-border bg-background/30 px-4 py-3 transition-colors hover:border-accent/30"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="soft">Внешний источник</Badge>
        <Badge variant="default">Не проверено</Badge>
        <Badge variant="soft">Уверенность {percent}%</Badge>
      </div>
      <p className="mt-2 font-display text-base text-foreground">
        {result.title}
      </p>
      <p className="mt-1 text-xs text-muted">
        {result.source} · {result.date}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {result.description}
      </p>
    </a>
  );
}
