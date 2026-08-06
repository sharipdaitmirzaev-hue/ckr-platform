"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GROWTH_TASK_TYPES,
  growthTaskTypeLabels,
} from "@/config/growth";
import {
  createGrowthTaskAction,
  type GrowthActionState,
} from "@/features/growth/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: GrowthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Создание…" : "Добавить задачу"}
    </Button>
  );
}

export function GrowthTaskForm() {
  const [state, formAction] = useFormState(
    createGrowthTaskAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="growthTaskType" className="text-sm text-muted">
            Тип
          </label>
          <select
            id="growthTaskType"
            name="taskType"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
            defaultValue="attract_projects"
          >
            {GROWTH_TASK_TYPES.map((type) => (
              <option key={type} value={type}>
                {growthTaskTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="growthTaskTitle" className="text-sm text-muted">
            Название
          </label>
          <Input
            id="growthTaskTitle"
            name="title"
            required
            placeholder="Задача роста"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="growthTaskDescription" className="text-sm text-muted">
          Описание
        </label>
        <textarea
          id="growthTaskDescription"
          name="description"
          rows={2}
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
          placeholder="Кратко"
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
