import { LiaOiSearchForm } from "@/components/lia/oi/search-form";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";
import { describeOiStoreMode, listSearchRequests } from "@/lib/lia/oi/store";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Поиск Лии" };

export default async function LiaOiSearchPage() {
  const mode = resolveOiSearchMode();
  const storeMode = describeOiStoreMode();
  const history = (await listSearchRequests()).slice(0, 20);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl text-foreground">Поиск по запросу</h2>
        <p className="mt-2 text-sm text-muted">
          Search Plan →{" "}
          {mode.mode === "live" ? "Serper (LIVE)" : "StubInternetSearchProvider"}{" "}
          → filter → normalize → dedup → analyze → score → store (
          {storeMode.label}).
        </p>
      </div>
      <LiaOiSearchForm initialMode={mode.mode} />
      <section className="space-y-3">
        <h3 className="font-display text-lg text-foreground">
          История поисков
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted">Пока нет запросов.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.map((r) => (
              <li
                key={r.id}
                className="rounded-sm border border-border px-3 py-2"
              >
                <Link
                  href={`/admin/owner/lia/search/${r.id}`}
                  className="text-foreground hover:text-accent"
                >
                  {r.query}
                </Link>
                <p className="text-xs text-muted">
                  {new Date(r.createdAt).toLocaleString("ru-RU")} ·{" "}
                  {r.plan.intent} · {r.plan.regions.join(", ")} ·{" "}
                  {(r.searchMode ?? (r.stubMode ? "stub" : "live")).toUpperCase()}
                  {r.providerLabel ? ` · ${r.providerLabel}` : ""}
                  {r.stats
                    ? ` · queries ${r.stats.queriesRun} · raw ${r.stats.signalsRaw} · TOP ${r.stats.topOpportunities ?? "—"} · rejected ${r.stats.rejected ?? "—"}`
                    : ` · карточек ${r.candidateIds.length}`}
                  {r.stats?.providerErrors
                    ? ` · errors ${r.stats.providerErrors}`
                    : ""}
                  {r.durationMs != null ? ` · ${r.durationMs} ms` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
