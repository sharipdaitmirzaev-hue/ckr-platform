import { ExternalResultCard } from "@/components/lia/external-result-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ExternalSearchResult } from "@/types/lia";

type ExternalSearchResultsProps = {
  results: ExternalSearchResult[];
  searchQueries?: string[];
  providerId?: string;
};

export function ExternalSearchResults({
  results,
  searchQueries = [],
  providerId,
}: ExternalSearchResultsProps) {
  return (
    <Card variant="surface" className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="soft">Найдено во внешних источниках</Badge>
        <Badge variant="default">Не доверять автоматически</Badge>
        {providerId ? <Badge variant="soft">Провайдер: {providerId}</Badge> : null}
      </div>

      {searchQueries.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Запросы Лии
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {searchQueries.map((query) => (
              <li key={query}>• {query}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="grid gap-3">
          {results.map((item) => (
            <ExternalResultCard key={item.id || item.url} result={item} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          Внешний поиск не вернул результатов. Проверьте ключ API или повторите
          позже.
        </p>
      )}

      <p className="border-t border-border pt-3 text-xs text-muted">
        Внешние данные неподтверждены. Лия не создаёт заявки и не изменяет ваши
        данные.
      </p>
    </Card>
  );
}
