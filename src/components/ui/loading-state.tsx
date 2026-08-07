import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({
  label = "Загрузка…",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        aria-hidden
        className="h-px w-24 origin-left animate-line-draw bg-accent"
      />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
