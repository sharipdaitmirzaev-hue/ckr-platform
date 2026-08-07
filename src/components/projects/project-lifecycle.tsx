"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PROJECT_LIFECYCLE_ORDER,
  projectStatusDescriptions,
  projectStatusLabels,
} from "@/config/projects";
import {
  advanceProjectStatusAction,
  type ProjectActionState,
} from "@/features/projects/actions";
import { ownerAllowedTransitions } from "@/lib/projects/lifecycle";
import type { ProjectStatus } from "@/types";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ProjectActionState = {};

function TransitionButton({
  label,
  status,
}: {
  label: string;
  status: ProjectStatus;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      name="status"
      value={status}
      size="sm"
      variant="outline"
      disabled={pending}
    >
      {pending ? "…" : label}
    </Button>
  );
}

type ProjectLifecycleProps = {
  projectId: string;
  status: ProjectStatus;
  /** Владелец может менять этап. */
  canAdvance?: boolean;
};

export function ProjectLifecycle({
  projectId,
  status,
  canAdvance = false,
}: ProjectLifecycleProps) {
  const [state, action] = useFormState(advanceProjectStatusAction, initialState);
  const next = canAdvance ? ownerAllowedTransitions(status) : [];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Жизненный цикл
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROJECT_LIFECYCLE_ORDER.map((step) => (
            <Badge
              key={step}
              variant={step === status ? "accent" : "soft"}
              className={step === status ? "border-accent/50" : undefined}
            >
              {projectStatusLabels[step]}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">
          {projectStatusDescriptions[status]}
        </p>
      </div>

      {canAdvance && next.length > 0 ? (
        <form action={action} className="flex flex-wrap gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          {next.map((step) => (
            <TransitionButton
              key={step}
              status={step}
              label={
                step === "moderation"
                  ? "На модерацию"
                  : step === "active"
                    ? "В реализацию"
                    : step === "completed"
                      ? "Завершить"
                      : step === "archived"
                        ? "В архив"
                        : step === "draft"
                          ? "Вернуть в черновик"
                          : projectStatusLabels[step]
              }
            />
          ))}
        </form>
      ) : null}

      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
    </div>
  );
}
