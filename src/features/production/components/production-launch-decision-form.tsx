"use client";

import { Button } from "@/components/ui/button";
import {
  PRODUCTION_LAUNCH_DECISION_CHOICES,
  productionLaunchDecisionHints,
  productionLaunchDecisionLabels,
  type ProductionLaunchDecision,
} from "@/config/production-go-live";
import {
  recordProductionLaunchDecisionAction,
  type ProductionActionState,
} from "@/features/production/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ProductionActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохранение…" : "Зафиксировать решение"}
    </Button>
  );
}

type Props = {
  suggested: ProductionLaunchDecision;
  latest?: ProductionLaunchDecision | null;
};

export function ProductionLaunchDecisionForm({ suggested, latest }: Props) {
  const [state, formAction] = useFormState(
    recordProductionLaunchDecisionAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">
          ProductionLaunchDecision
        </legend>
        {PRODUCTION_LAUNCH_DECISION_CHOICES.map((choice) => (
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
                {productionLaunchDecisionLabels[choice]}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {productionLaunchDecisionHints[choice]}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="space-y-1">
        <label htmlFor="prod-decision-responsible" className="text-sm text-muted">
          Ответственный
        </label>
        <input
          id="prod-decision-responsible"
          name="responsible"
          required
          minLength={2}
          placeholder="ФИО / роль ответственного"
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="prod-decision-notes" className="text-sm text-muted">
          Комментарий
        </label>
        <textarea
          id="prod-decision-notes"
          name="notes"
          rows={3}
          required
          placeholder="Обоснование go_live / hold / rollback"
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      <p className="text-xs text-muted">
        Рекомендация системы: {productionLaunchDecisionLabels[suggested]}
        {latest
          ? ` · последнее зафиксированное: ${productionLaunchDecisionLabels[latest]}`
          : ""}
        . Дата фиксируется автоматически. Лия не принимает решение.
      </p>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
