import {
  CLIENT_PROGRESS_LABELS,
  CLIENT_PROGRESS_ORDER,
  progressStepForStatus,
  type ClientProgressStep,
} from "@/lib/ckr-inbox/client-presentation";
import type { CkrRequestStatus } from "@/config/ckr-inbox";
import { cn } from "@/lib/utils";

export function RequestProgress({ status }: { status: CkrRequestStatus }) {
  const current = progressStepForStatus(status);
  const currentIdx = CLIENT_PROGRESS_ORDER.indexOf(current);

  return (
    <ol className="grid grid-cols-4 gap-1 text-center sm:gap-2" aria-label="Ход обращения">
      {CLIENT_PROGRESS_ORDER.map((step: ClientProgressStep, index) => {
        const done = index <= currentIdx;
        return (
          <li key={step} className="min-w-0">
            <div
              className={cn(
                "mx-auto mb-1 h-1 rounded-full",
                done ? "bg-accent" : "bg-border",
              )}
            />
            <p
              className={cn(
                "truncate text-[11px] sm:text-xs",
                done ? "text-foreground" : "text-muted",
              )}
            >
              {CLIENT_PROGRESS_LABELS[step]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
