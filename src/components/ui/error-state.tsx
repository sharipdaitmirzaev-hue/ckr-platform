"use client";

/**
 * Critical UI component — must exist at:
 * src/components/ui/error-state.tsx
 */
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  reset?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Что-то пошло не так",
  description = "Не удалось загрузить страницу. Попробуйте ещё раз или вернитесь на главную.",
  reset,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16",
        className,
      )}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-accent">Ошибка</p>
      <h1 className="mt-4 font-display text-3xl font-semibold text-foreground">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {reset ? (
          <Button type="button" onClick={reset}>
            Повторить
          </Button>
        ) : null}
        <ButtonLink href="/" variant="outline">
          На главную
        </ButtonLink>
      </div>
    </div>
  );
}
