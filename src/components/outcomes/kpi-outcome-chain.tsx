import type { KpiOutcomeRow } from "@/types/outcomes";

type KpiOutcomeChainProps = {
  rows: KpiOutcomeRow[];
};

export function KpiOutcomeChain({ rows }: KpiOutcomeChainProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">
        KPI и связанные результаты ещё не заданы.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li
          key={row.metric.id}
          className="rounded-sm border border-border px-3 py-3 text-sm"
        >
          <p className="font-medium text-foreground">{row.metric.name}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-muted">
                Цель
              </p>
              <p className="mt-1 text-foreground">
                {row.targetValue} {row.metric.unit}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-muted">
                Текущее
              </p>
              <p className="mt-1 text-foreground">
                {row.currentValue} {row.metric.unit}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-muted">
                Фактический результат
              </p>
              <p className="mt-1 text-foreground">
                {row.actualValue !== null
                  ? `${row.actualValue} ${row.result?.unit || row.metric.unit}`
                  : "ещё не зафиксирован"}
              </p>
            </div>
          </div>
          {row.attainmentPercent !== null ? (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>Достижение</span>
                <span>{row.attainmentPercent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-accent"
                  style={{
                    width: `${Math.min(100, Math.max(0, row.attainmentPercent))}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
