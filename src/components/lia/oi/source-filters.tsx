import {
  LIA_OI_OPPORTUNITY_TYPE_LABELS,
  LIA_OI_SOURCE_FILTER_OPTIONS,
} from "@/lib/lia/oi/sources/registry";
import Link from "next/link";

export function SourceFilters({
  adapter,
  type,
  official,
}: {
  adapter?: string;
  type?: string;
  official?: boolean;
}) {
  const base = "/admin/owner/lia/opportunities";
  const mk = (next: { adapter?: string; type?: string; official?: boolean }) => {
    const p = new URLSearchParams();
    const a = next.adapter ?? adapter;
    const t = next.type ?? type;
    const o = next.official ?? official;
    if (a) p.set("adapter", a);
    if (t) p.set("type", t);
    if (o) p.set("official", "1");
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="mb-1 text-xs uppercase tracking-[0.14em] text-muted">
          Источник
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={mk({ adapter: undefined })}
            className={!adapter ? "text-accent" : "text-muted hover:text-accent"}
          >
            Все
          </Link>
          {LIA_OI_SOURCE_FILTER_OPTIONS.map((opt) => (
            <Link
              key={opt.id}
              href={mk({ adapter: opt.id })}
              className={
                adapter === opt.id
                  ? "text-accent"
                  : "text-muted hover:text-accent"
              }
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-[0.14em] text-muted">
          Тип возможности
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={mk({ type: undefined })}
            className={!type ? "text-accent" : "text-muted hover:text-accent"}
          >
            Все
          </Link>
          {Object.entries(LIA_OI_OPPORTUNITY_TYPE_LABELS)
            .filter(([k]) =>
              ["AUCTION_ASSET", "PROCUREMENT", "SUPPORT_PROGRAM", "WEB_LISTING"].includes(
                k,
              ),
            )
            .map(([k, label]) => (
              <Link
                key={k}
                href={mk({ type: k })}
                className={
                  type === k ? "text-accent" : "text-muted hover:text-accent"
                }
              >
                {label}
              </Link>
            ))}
        </div>
      </div>
      <div>
        <Link
          href={mk({ official: !official })}
          className={official ? "text-accent" : "text-muted hover:text-accent"}
        >
          {official ? "✓ Только официальные" : "Только официальные"}
        </Link>
      </div>
    </div>
  );
}
