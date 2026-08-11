import { getInternetSearchProvider } from "@/lib/lia/oi/internet";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";
import { listCandidates } from "@/lib/lia/oi/store";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Источники Лии" };

export default async function LiaOiSourcesPage() {
  const provider = getInternetSearchProvider();
  const mode = resolveOiSearchMode();
  const sources = (await listCandidates()).flatMap((c) =>
    c.sources.map((s) => ({ ...s, candidateTitle: c.title })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-foreground">Источники</h2>
        <p className="mt-2 text-sm text-muted">
          {mode.bannerTitle}. Активный провайдер:{" "}
          <strong>{provider.label}</strong> ({provider.mode}).
        </p>
      </div>
      <ul className="space-y-2 text-sm">
        {sources.slice(0, 40).map((s) => (
          <li key={`${s.id}-${s.url}`} className="rounded-sm border border-border px-3 py-2">
            <p className="text-foreground">
              {s.name} {s.isStub ? "· STUB" : "· LIVE"} · {s.category}
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
            {s.discoveredAt ? (
              <p className="mt-1 text-xs text-muted">
                Обнаружено: {new Date(s.discoveredAt).toLocaleString("ru-RU")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
