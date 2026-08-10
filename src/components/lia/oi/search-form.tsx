"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SearchResultView = {
  searchMode: "stub" | "live";
  providerLabel: string;
  providerUnavailable?: boolean;
  ownerMessage?: string;
  plan: {
    intent: string;
    regions: string[];
    budgetMax: number | null;
    hypotheses: string[];
    queries: string[];
  };
  stats: {
    queriesRun: number;
    signalsRaw: number;
    filteredOut: number;
    duplicatesRemoved: number;
    afterDedup: number;
    analyzed: number;
    detailPages?: number;
    catalogPagesDemoted?: number;
    pagesFetched?: number;
  };
  candidates: Array<{
    id: string;
    title: string;
    pageType?: string;
    isCatalogSource?: boolean;
    score: {
      overall: number;
      confidence: number;
      quality?: number;
      opportunity?: number;
    };
    isStub: boolean;
  }>;
};

export function LiaOiSearchForm({
  initialMode = "stub",
}: {
  initialMode?: "stub" | "live";
}) {
  const router = useRouter();
  const [query, setQuery] = useState(
    "Найди интересные бизнес-возможности до 30 млн рублей по России",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResultView | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/lia/oi/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Ошибка поиска");
      const data = json.data as SearchResultView;
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setPending(false);
    }
  }

  const modeLabel = result?.searchMode ?? initialMode;

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-muted">Запрос владельца</span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: Найди 10 перспективных бизнес-возможностей до 30 млн ₽ по России"
            required
            minLength={3}
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending
            ? "Ищем…"
            : modeLabel === "live"
              ? "Запустить LIVE-поиск"
              : "Запустить поиск (stub)"}
        </Button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </form>

      {result ? (
        <div className="space-y-4 rounded-sm border border-border bg-surface p-4 text-sm">
          {result.providerUnavailable || result.ownerMessage ? (
            <p className="text-accent">
              {result.ownerMessage || "Внешний поиск временно недоступен"}
            </p>
          ) : null}

          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Режим · {result.searchMode.toUpperCase()}
            </p>
            <p className="mt-1 text-foreground">{result.providerLabel}</p>
          </div>

          <div>
            <p className="font-medium text-foreground">Search Plan</p>
            <p className="mt-1 text-muted">
              intent={result.plan.intent} · регионы={result.plan.regions.join(", ")} ·
              бюджет_max=
              {result.plan.budgetMax
                ? `${Math.round(result.plan.budgetMax / 1_000_000)} млн ₽`
                : "—"}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              {result.plan.queries.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>

          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-muted">Интернет-результатов</dt>
              <dd className="text-foreground">{result.stats.signalsRaw}</dd>
            </div>
            <div>
              <dt className="text-muted">Отброшено фильтром</dt>
              <dd className="text-foreground">{result.stats.filteredOut}</dd>
            </div>
            <div>
              <dt className="text-muted">Дублей</dt>
              <dd className="text-foreground">{result.stats.duplicatesRemoved}</dd>
            </div>
            <div>
              <dt className="text-muted">Проанализировано</dt>
              <dd className="text-foreground">{result.stats.analyzed}</dd>
            </div>
            <div>
              <dt className="text-muted">DETAIL</dt>
              <dd className="text-foreground">{result.stats.detailPages ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Каталогов (понижены)</dt>
              <dd className="text-foreground">
                {result.stats.catalogPagesDemoted ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">safe-fetch</dt>
              <dd className="text-foreground">{result.stats.pagesFetched ?? 0}</dd>
            </div>
          </dl>

          <div>
            <p className="font-medium text-foreground">Лучшие возможности</p>
            {result.candidates.length === 0 ? (
              <p className="mt-2 text-muted">Пусто — уточните запрос или проверьте Serper.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {result.candidates.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/admin/owner/lia/opportunities/${c.id}`}
                      className="text-accent hover:underline"
                    >
                      {c.title}
                    </Link>
                    <span className="text-muted">
                      {" "}
                      · {c.pageType ?? "?"}
                      {c.isCatalogSource ? " · каталог" : ""} ·{" "}
                      {c.isStub ? "STUB" : "LIVE"} · quality{" "}
                      {c.score.quality ?? "—"}% · opp{" "}
                      {c.score.opportunity ?? c.score.overall}/100
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3">
              <Link
                href="/admin/owner/lia/opportunities"
                className="text-accent hover:underline"
              >
                Открыть ленту возможностей →
              </Link>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
