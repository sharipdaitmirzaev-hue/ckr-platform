"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LAUNCH_WAVE_STATUSES,
  LAUNCH_WAVE_TYPES,
  launchWaveStatusLabels,
  launchWaveTypeLabels,
} from "@/config/launch-waves";
import {
  createLaunchWaveAction,
  type LaunchActionState,
} from "@/features/launch/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: LaunchActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Сохранение…" : "Создать волну"}
    </Button>
  );
}

export function CreateLaunchWaveForm() {
  const [state, formAction] = useFormState(createLaunchWaveAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <h3 className="font-display text-lg text-foreground">Новая волна</h3>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
      <div className="space-y-1">
        <label htmlFor="wave-name" className="text-sm text-muted">
          Название
        </label>
        <Input id="wave-name" name="name" required placeholder="Волна 3 — …" />
      </div>
      <div className="space-y-1">
        <label htmlFor="wave-description" className="text-sm text-muted">
          Описание
        </label>
        <textarea
          id="wave-description"
          name="description"
          rows={2}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="wave-type" className="text-sm text-muted">
            Тип
          </label>
          <select
            id="wave-type"
            name="waveType"
            defaultValue="closed"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            {LAUNCH_WAVE_TYPES.map((type) => (
              <option key={type} value={type}>
                {launchWaveTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="wave-status" className="text-sm text-muted">
            Статус
          </label>
          <select
            id="wave-status"
            name="status"
            defaultValue="planned"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            {LAUNCH_WAVE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {launchWaveStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="wave-start" className="text-sm text-muted">
            Старт
          </label>
          <Input id="wave-start" name="startDate" type="date" />
        </div>
        <div className="space-y-1">
          <label htmlFor="wave-end" className="text-sm text-muted">
            Конец
          </label>
          <Input id="wave-end" name="endDate" type="date" />
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
