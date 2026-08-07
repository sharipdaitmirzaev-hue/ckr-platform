import { cn } from "@/lib/utils";
import Link from "next/link";

export type FilterOption = {
  value: string;
  label: string;
};

type AdminFilterBarProps = {
  basePath: string;
  param: string;
  current: string | null;
  allLabel: string;
  options: FilterOption[];
  preserve?: Record<string, string | null | undefined>;
};

function hrefFor(
  basePath: string,
  param: string,
  value: string | null,
  preserve?: Record<string, string | null | undefined>,
) {
  const params = new URLSearchParams();
  Object.entries(preserve ?? {}).forEach(([key, item]) => {
    if (item) params.set(key, item);
  });
  if (value) params.set(param, value);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function AdminFilterBar({
  basePath,
  param,
  current,
  allLabel,
  options,
  preserve,
}: AdminFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={hrefFor(basePath, param, null, preserve)}
        className={cn(
          "rounded-sm border px-3 py-1.5 text-sm transition-colors",
          !current
            ? "border-accent/50 bg-accent-muted text-accent"
            : "border-border text-muted hover:text-foreground",
        )}
      >
        {allLabel}
      </Link>
      {options.map((option) => (
        <Link
          key={option.value}
          href={hrefFor(basePath, param, option.value, preserve)}
          className={cn(
            "rounded-sm border px-3 py-1.5 text-sm transition-colors",
            current === option.value
              ? "border-accent/50 bg-accent-muted text-accent"
              : "border-border text-muted hover:text-foreground",
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
