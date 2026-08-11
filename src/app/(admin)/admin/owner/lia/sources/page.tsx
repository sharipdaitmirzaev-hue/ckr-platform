import { getInternetSearchProvider } from "@/lib/lia/oi/internet";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";
import {
  getSourceHealthSnapshot,
  LIA_OI_SOURCE_FILTER_OPTIONS,
} from "@/lib/lia/oi/sources/registry";
import { listCandidates } from "@/lib/lia/oi/store";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Источники Лии" };

const healthLabel: Record<string, string> = {
  OK: "OK",
  DEGRADED: "DEGRADED",
  UNAVAILABLE: "UNAVAILABLE",
};

export default async function LiaOiSourcesPage() {
  const provider = getInternetSearchProvider();
  const mode = resolveOiSearchMode();
  const health = await getSourceHealthSnapshot();
  const sources = (await listCandidates()).flatMap((c) =>
    c.sources.map((s) => ({
      ...s,
      candidateTitle: c.title,
      adapter: c.sourceAdapterId,
      official: c.isOfficialSource,
    })),
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl text-foreground">Источники</h2>
        <p className="mt-2 text-sm text-muted">
          {mode.bannerTitle}. General discovery:{" "}
          <strong>{provider.label}</strong> ({provider.mode}). Специализированные
          adapters запускаются по команде владельца.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-lg text-foreground">
          Состояние источников
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="rounded-sm border border-border px-3 py-2">
            <p className="text-foreground">
              Serper (general discovery) · {provider.mode.toUpperCase()}
            </p>
            <p className="text-xs text-muted">
              id={LIA_OI_SOURCE_FILTER_OPTIONS[0].id} · не specialized adapter
            </p>
          </li>
          {health.map((h) => (
            <li
              key={h.id}
              className="rounded-sm border border-border px-3 py-2"
            >
              <p className="text-foreground">
                {h.label} · {healthLabel[h.health] || h.health}
                {h.official ? " · официальный" : ""}
              </p>
              <p className="text-xs text-muted">
                id={h.id} · category={h.category}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lg text-foreground">
          Недавние URL из ленты
        </h3>
        <ul className="space-y-2 text-sm">
          {sources.slice(0, 40).map((s) => (
            <li
              key={`${s.id}-${s.url}`}
              className="rounded-sm border border-border px-3 py-2"
            >
              <p className="text-foreground">
                {s.name} {s.isStub ? "· STUB" : "· LIVE"} · {s.category}
                {s.official ? " · официальный" : ""}
                {s.adapter ? ` · ${s.adapter}` : ""}
              </p>
              <p className="text-xs text-muted">{s.candidateTitle}</p>
              <a
                href={s.url}
                className="break-all text-xs text-accent hover:underline"
                target="_blank"
                rel="noreferrer noopener"
              >
                {s.url}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
