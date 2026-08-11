"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CandView = {
  id: string;
  title: string;
  pageType?: string;
  contentIntent?: string;
  budgetFit?: string;
  priceStatus?: string;
  isCatalogSource?: boolean;
  resultBucket?: string;
  askingPrice?: number | null;
  investmentRequired?: number | null;
  region?: string;
  score: {
    overall: number;
    confidence: number;
    quality?: number;
    opportunity?: number;
  };
  isStub: boolean;
};

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
    hardConstraints?: { geography: string; maxBudgetRub: number | null };
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
    searchPasses?: number;
    opportunityCount?: number;
    topOpportunities?: number;
    needsResearch?: number;
    sourceCatalogs?: number;
    rejected?: number;
    overBudget?: number;
    unknownPrice?: number;
  };
  candidates: CandView[];
  topOpportunities?: CandView[];
  needsResearch?: CandView[];
  sourceCatalogs?: CandView[];
  rejected?: CandView[];
};

function priceOf(c: CandView) {
  return c.askingPrice ?? c.investmentRequired ?? null;
}

export function LiaOiSearchForm({
  initialMode = "stub",
}: {
  initialMode?: "stub" | "live";
}) {
  const router = useRouter();
  const [query, setQuery] = useState(
    "Найди 10 перспективных бизнес-возможностей до 30 млн ₽ по России",
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
  const top = result?.topOpportunities ?? result?.candidates.filter((c) => c.resultBucket === "TOP_OPPORTUNITIES") ?? [];
  const research = result?.needsResearch ?? [];
  const catalogs = result?.sourceCatalogs ?? [];

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
              HARD max=
              {result.plan.budgetMax
                ? `${Math.round(result.plan.budgetMax / 1_000_000)} млн ₽`
                : "—"}
              {result.stats.searchPasses
                ? ` · passes=${result.stats.searchPasses}`
                : ""}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              {result.plan.queries.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>

          <dl className="grid gap-2 sm:grid-cols-3">
            <div>
              <dt className="text-muted">Найдено (raw)</dt>
              <dd className="text-foreground">{result.stats.signalsRaw}</dd>
            </div>
            <div>
              <dt className="text-muted">Подходит (TOP)</dt>
              <dd className="text-foreground">
                {result.stats.topOpportunities ?? top.length}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Требует проверки</dt>
              <dd className="text-foreground">
                {result.stats.needsResearch ?? research.length}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Отсеяно</dt>
              <dd className="text-foreground">{result.stats.rejected ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Каталоги</dt>
              <dd className="text-foreground">
                {result.stats.sourceCatalogs ?? catalogs.length}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Отсеяно по бюджету</dt>
              <dd className="text-foreground">{result.stats.overBudget ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted">UNKNOWN цена</dt>
              <dd className="text-foreground">
                {result.stats.unknownPrice ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Serper queries</dt>
              <dd className="text-foreground">{result.stats.queriesRun}</dd>
            </div>
            <div>
              <dt className="text-muted">safe-fetch</dt>
              <dd className="text-foreground">{result.stats.pagesFetched ?? 0}</dd>
            </div>
          </dl>

          <div>
            <p className="font-medium text-foreground">Лия рекомендует</p>
            {top.length === 0 ? (
              <p className="mt-2 text-muted">
                Меньше 10 качественных объектов — честно пусто/мало, без мусора.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {top.slice(0, 10).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/admin/owner/lia/opportunities/${c.id}`}
                      className="text-accent hover:underline"
                    >
                      {c.title}
                    </Link>
                    <span className="text-muted">
                      {" "}
                      · {c.region ?? "регион?"} ·{" "}
                      {priceOf(c) != null
                        ? `${priceOf(c)!.toLocaleString("ru-RU")} ₽`
                        : "цена UNKNOWN"}{" "}
                      · {c.budgetFit} · opp{" "}
                      {c.score.opportunity ?? c.score.overall}/100
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {research.length > 0 ? (
            <div>
              <p className="font-medium text-foreground">Нужно проверить</p>
              <ul className="mt-2 space-y-1 text-muted">
                {research.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/admin/owner/lia/opportunities/${c.id}`}
                      className="text-accent hover:underline"
                    >
                      {c.title}
                    </Link>
                    {c.priceStatus === "UNKNOWN" ? " · цена UNKNOWN" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mt-3">
            <Link
              href="/admin/owner/lia/opportunities"
              className="text-accent hover:underline"
            >
              Открыть ленту с buckets →
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
