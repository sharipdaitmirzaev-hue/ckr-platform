import { LiaOiSearchForm } from "@/components/lia/oi/search-form";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";
import { listSearchRequests } from "@/lib/lia/oi/store";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Поиск Лии" };

export default async function LiaOiSearchPage() {
  const mode = resolveOiSearchMode();
  const history = listSearchRequests().slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl text-foreground">Поиск по запросу</h2>
        <p className="mt-2 text-sm text-muted">
          Search Plan →{" "}
          {mode.mode === "live" ? "Serper (LIVE)" : "StubInternetSearchProvider"}{" "}
          → filter → normalize → dedup → analyze → score → лента владельца.
        </p>
      </div>
      <LiaOiSearchForm initialMode={mode.mode} />
      <section className="space-y-3">
        <h3 className="font-display text-lg text-foreground">История запросов</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted">Пока нет запросов.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.map((r) => (
              <li key={r.id} className="rounded-sm border border-border px-3 py-2">
                <p className="text-foreground">{r.query}</p>
                <p className="text-xs text-muted">
                  {r.plan.intent} · {r.plan.regions.join(", ")} · карточек{" "}
                  {r.candidateIds.length} ·{" "}
                  {(r.searchMode ?? (r.stubMode ? "stub" : "live")).toUpperCase()}
                  {r.stats
                    ? ` · raw ${r.stats.signalsRaw} / dedup ${r.stats.afterDedup}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
