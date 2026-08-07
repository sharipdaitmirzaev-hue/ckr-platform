"use client";

import { Button } from "@/components/ui/button";
import {
  LAUNCH_DECISION_CHOICES,
  launchDecisionHints,
  launchDecisionLabels,
  type LaunchDecision,
  type LaunchDecisionChoice,
} from "@/config/launch-decision";
import {
  recordLaunchDecisionAction,
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
  suggested: LaunchDecision;
  latest?: LaunchDecision | null;
};

export function LaunchDecisionForm({ waveId, suggested, latest }: Props) {
  const [state, formAction] = useFormState(
    recordLaunchDecisionAction,
    initialState,
  );
  const defaultChoice: LaunchDecisionChoice =
    LAUNCH_DECISION_CHOICES.includes(suggested as LaunchDecisionChoice)
      ? (suggested as LaunchDecisionChoice)
      : "continue_closed";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="waveId" value={waveId ?? ""} />
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">
          Выбор решения
        </legend>
        {LAUNCH_DECISION_CHOICES.map((choice) => (
          <label
            key={choice}
            className="flex cursor-pointer items-start gap-3 rounded-sm border border-border px-3 py-3 hover:bg-surface/60"
          >
            <input
              type="radio"
              name="decision"
              value={choice}
              defaultChecked={choice === defaultChoice}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-foreground">
                {launchDecisionLabels[choice]}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {launchDecisionHints[choice]}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="space-y-1">
        <label htmlFor="decision-notes" className="text-sm text-muted">
          Комментарий
        </label>
        <textarea
          id="decision-notes"
          name="notes"
          rows={3}
          placeholder="Краткое обоснование Decision Gate"
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      <p className="text-xs text-muted">
        Рекомендация системы: {launchDecisionLabels[suggested]}
        {latest
          ? ` · последнее зафиксированное: ${launchDecisionLabels[latest]}`
          : ""}
      </p>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
