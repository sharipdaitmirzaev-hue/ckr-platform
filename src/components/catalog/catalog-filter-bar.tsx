import { cn } from "@/lib/utils";
import Link from "next/link";

export type CatalogFilterOption = {
  id: string;
  label: string;
};

type Props = {
  label: string;
  basePath: string;
  param: string;
  current: string | null;
  options: CatalogFilterOption[];
  /** Сохраняемые query-параметры при переключении фильтра. */
  preserve?: Record<string, string | null | undefined>;
};

export function CatalogFilterBar({
  label,
  basePath,
  param,
  current,
  options,
  preserve = {},
}: Props) {
  function hrefFor(value: string | null) {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(preserve)) {
      if (key === param) continue;
      if (val) params.set(key, val);
    }
    if (value) params.set(param, value);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={hrefFor(null)}
          className={cn(
            "rounded-sm border px-3 py-1.5 text-sm transition-colors",
            !current
              ? "border-accent/50 bg-accent-muted text-accent"
              : "border-border text-muted hover:text-foreground",
          )}
        >
          Все
        </Link>
        {options.map((option) => (
          <Link
            key={option.id}
            href={hrefFor(option.id)}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-sm transition-colors",
              current === option.id
                ? "border-accent/50 bg-accent-muted text-accent"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
