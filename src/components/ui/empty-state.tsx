import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-t border-border py-10 text-left",
        className,
      )}
    >
      <h3 className="font-display text-xl text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <div className="mt-6">
          <ButtonLink href={actionHref} variant="outline">
            {actionLabel}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
