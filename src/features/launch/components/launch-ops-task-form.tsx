"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LAUNCH_OPS_TASK_TYPES,
  launchOpsTaskTypeLabels,
} from "@/config/launch-operations";
import {
  createLaunchOpsTaskAction,
  type LaunchActionState,
} from "@/features/launch/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: LaunchActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Создание…" : "Добавить задачу"}
    </Button>
  );
}

export function LaunchOpsTaskForm() {
  const [state, formAction] = useFormState(
    createLaunchOpsTaskAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="taskType" className="text-sm text-muted">
            Тип
          </label>
          <select
            id="taskType"
            name="taskType"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
            defaultValue="handle_issue"
          >
            {LAUNCH_OPS_TASK_TYPES.map((type) => (
              <option key={type} value={type}>
                {launchOpsTaskTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="taskTitle" className="text-sm text-muted">
            Название
          </label>
          <Input id="taskTitle" name="title" required placeholder="Задача" />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="taskDescription" className="text-sm text-muted">
          Описание
        </label>
        <textarea
          id="taskDescription"
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
