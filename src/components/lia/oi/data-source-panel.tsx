import {
  liaOiDataChannelLabels,
  liaOiOfficialApiStatusLabels,
  liaOiOfficialSourceLabel,
} from "@/config/lia-oi";
import type { LiaOiCandidate } from "@/types/lia-oi";

/**
 * Owner UI: data source channel + official API connection + FACT vs weak fields.
 */
export function DataSourcePanel({ item }: { item: LiaOiCandidate }) {
  const sourceLabel = liaOiOfficialSourceLabel({
    dataChannel: item.dataChannel,
    officialApiProvider: item.officialApiProvider,
  });
  const channel = item.dataChannel
    ? liaOiDataChannelLabels[item.dataChannel]
    : null;
  const apiStatus = item.officialApiStatus
    ? liaOiOfficialApiStatusLabels[item.officialApiStatus]
    : null;

  const factFields = (item.structuredFields || []).filter(
    (f) => f.kind === "FACT" && f.value != null && f.value !== "",
  );
  const weakFields = (item.structuredFields || []).filter(
    (f) =>
      f.kind === "INFERENCE" ||
      f.kind === "ESTIMATE" ||
      f.kind === "UNKNOWN",
  );
  const weakClaims = (item.claims || []).filter(
    (c) =>
      c.kind === "INFERENCE" ||
      c.kind === "ESTIMATE" ||
      c.kind === "UNKNOWN",
  );

  return (
    <section className="space-y-3 rounded-sm border border-border bg-surface p-4">
      <h3 className="font-display text-lg text-foreground">Источник данных</h3>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Источник</dt>
          <dd className="text-foreground">
            {sourceLabel || item.sources[0]?.name || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Канал</dt>
          <dd className="text-foreground">{channel || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Official data</dt>
          <dd className="text-foreground">{apiStatus || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">source_confidence</dt>
          <dd className="text-foreground">
            {item.sourceConfidence ?? item.score.confidence}/100
            <span className="block text-xs text-muted">
              не равен opportunity_score (
              {item.score.opportunity ?? item.score.overall}/100)
            </span>
          </dd>
        </div>
      </dl>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-accent/30 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.14em] text-accent">
            Структурированные FACT
          </p>
          {factFields.length ? (
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {factFields.slice(0, 12).map((f) => (
                <li key={`f-${f.field}`}>
                  <span className="text-muted">{f.field}</span>: {String(f.value)}
                  <span className="ml-1 text-xs text-muted">({f.source})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Нет FACT-полей</p>
          )}
        </div>
        <div className="border border-border px-3 py-2">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            INFERENCE / ESTIMATE / UNKNOWN
          </p>
          {weakFields.length || weakClaims.length ? (
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {weakFields.slice(0, 8).map((f) => (
                <li key={`w-${f.field}`}>
                  {f.kind} · {f.field}: {String(f.value ?? "—")}
                </li>
              ))}
              {weakClaims.slice(0, 6).map((c) => (
                <li key={`c-${c.field}-${c.value}`}>
                  {c.kind} · {c.field}: {c.value}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Слабых полей нет</p>
          )}
        </div>
      </div>
    </section>
  );
}
