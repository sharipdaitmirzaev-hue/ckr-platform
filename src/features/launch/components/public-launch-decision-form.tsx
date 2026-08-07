"use client";

import { Button } from "@/components/ui/button";
import {
  PUBLIC_LAUNCH_DECISION_CHOICES,
  publicLaunchDecisionHints,
  publicLaunchDecisionLabels,
  type PublicLaunchDecision,
} from "@/config/public-launch-decision";
import {
  recordPublicLaunchDecisionAction,
  type LaunchActionState,
} from "@/features/launch/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: LaunchActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохранение…" : "Зафиксировать решение"}
    </Button>
  );
}

type Props = {
  waveId: string | null;
  suggested: PublicLaunchDecision;
  latest?: PublicLaunchDecision | null;
};

export function PublicLaunchDecisionForm({
  waveId,
  suggested,
  latest,
}: Props) {
  const [state, formAction] = useFormState(
    recordPublicLaunchDecisionAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="waveId" value={waveId ?? ""} />
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">
          PublicLaunchDecision
        </legend>
        {PUBLIC_LAUNCH_DECISION_CHOICES.map((choice) => (
          <label
            key={choice}
            className="flex cursor-pointer items-start gap-3 rounded-sm border border-border px-3 py-3 hover:bg-surface/60"
          >
            <input
              type="radio"
              name="decision"
              value={choice}
              defaultChecked={choice === suggested}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-foreground">
                {publicLaunchDecisionLabels[choice]}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {publicLaunchDecisionHints[choice]}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="space-y-1">
        <label htmlFor="public-decision-notes" className="text-sm text-muted">
          Комментарий
        </label>
        <textarea
          id="public-decision-notes"
          name="notes"
          rows={3}
          required
          placeholder="Обоснование решения о выходе из beta"
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      <p className="text-xs text-muted">
        Рекомендация системы: {publicLaunchDecisionLabels[suggested]}
        {latest
          ? ` · последнее зафиксированное: ${publicLaunchDecisionLabels[latest]}`
          : ""}
        . Лия не принимает решение автоматически.
      </p>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
