"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LAUNCH_GOAL_METRIC_TYPES,
  launchGoalMetricLabels,
} from "@/config/launch-goals";
import {
  createLaunchGoalAction,
  type LaunchActionState,
} from "@/features/launch/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: LaunchActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Сохранение…" : "Добавить цель"}
    </Button>
  );
}

type Props = {
  waveId: string;
  waveName: string;
};

export function CreateLaunchGoalForm({ waveId, waveName }: Props) {
  const [state, formAction] = useFormState(createLaunchGoalAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <h3 className="font-display text-lg text-foreground">Новая цель</h3>
      <p className="text-xs text-muted">{waveName}</p>
      <input type="hidden" name="waveId" value={waveId} />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
      <div className="space-y-1">
        <label htmlFor="goal-title" className="text-sm text-muted">
          Название
        </label>
        <Input id="goal-title" name="title" required placeholder="10 проектов" />
      </div>
      <div className="space-y-1">
        <label htmlFor="goal-description" className="text-sm text-muted">
          Описание
        </label>
        <textarea
          id="goal-description"
          name="description"
          rows={2}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="goal-metric" className="text-sm text-muted">
            Метрика
          </label>
          <select
            id="goal-metric"
            name="metricType"
            defaultValue="users"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            {LAUNCH_GOAL_METRIC_TYPES.map((type) => (
              <option key={type} value={type}>
                {launchGoalMetricLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="goal-target" className="text-sm text-muted">
            Target
          </label>
          <Input
            id="goal-target"
            name="targetValue"
            type="number"
            min={0}
            step="1"
            defaultValue={1}
            required
          />
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
