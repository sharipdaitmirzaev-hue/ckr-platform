"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TASK_PRIORITIES,
  TASK_RELATED_TYPES,
  TASK_STATUSES,
  taskPriorityLabels,
  taskRelatedTypeLabels,
  taskStatusLabels,
} from "@/config/operator";
import {
  createOperatorTaskAction,
  type OperatorActionState,
} from "@/features/operator/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: OperatorActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Создание…" : "Создать задачу"}
    </Button>
  );
}

export function CreateOperatorTaskForm() {
  const [state, action] = useFormState(createOperatorTaskAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="task-title" className="text-sm text-muted">
          Название
        </label>
        <Input id="task-title" name="title" required placeholder="Что сделать" />
      </div>
      <div className="space-y-2">
        <label htmlFor="task-description" className="text-sm text-muted">
          Описание
        </label>
        <textarea
          id="task-description"
          name="description"
          rows={3}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="task-priority" className="text-sm text-muted">
            Приоритет
          </label>
          <select
            id="task-priority"
            name="priority"
            defaultValue="medium"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {taskPriorityLabels[priority]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="task-status" className="text-sm text-muted">
            Статус
          </label>
          <select
            id="task-status"
            name="status"
            defaultValue="new"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {taskStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="task-related-type" className="text-sm text-muted">
            Связь
          </label>
          <select
            id="task-related-type"
            name="relatedType"
            defaultValue=""
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            <option value="">Без связи</option>
            {TASK_RELATED_TYPES.map((type) => (
              <option key={type} value={type}>
                {taskRelatedTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="task-related-id" className="text-sm text-muted">
            ID сущности
          </label>
          <Input id="task-related-id" name="relatedId" placeholder="uuid" />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="task-deadline" className="text-sm text-muted">
          Дедлайн
        </label>
        <Input id="task-deadline" name="deadline" type="datetime-local" />
      </div>
      <SubmitButton />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
    </form>
  );
}
