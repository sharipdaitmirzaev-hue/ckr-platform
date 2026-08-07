import { SourceBadge } from "@/components/lia/source-badge";
import { TrustIndicator } from "@/components/lia/trust-indicator";
import type { ExternalSearchResult } from "@/types/lia";

type ExternalResultCardProps = {
  result: ExternalSearchResult;
};

export function ExternalResultCard({ result }: ExternalResultCardProps) {
  const published =
    result.published_at || result.date || "дата неизвестна";

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-sm border border-dashed border-border bg-background/30 px-4 py-3 transition-colors hover:border-accent/30"
    >
      <div className="flex flex-wrap items-center gap-2">
        <SourceBadge source={result.source} />
        <TrustIndicator
          trustScore={result.trust_score ?? result.confidence ?? 0}
          trusted={false}
        />
      </div>
      <p className="mt-2 font-display text-base text-foreground">
        {result.title}
      </p>
      <p className="mt-1 text-xs text-muted">
        {published}
        {result.query ? ` · запрос: «${result.query}»` : ""}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {result.description}
      </p>
    </a>
  );
}
