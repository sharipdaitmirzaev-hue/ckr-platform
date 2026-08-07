"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PARTNERSHIP_TASK_TYPES,
  partnershipTaskTypeLabels,
} from "@/config/partnership-network";
import {
  createPartnershipTaskAction,
  type PartnershipNetworkActionState,
} from "@/features/partnership-network/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: PartnershipNetworkActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Создание…" : "Добавить задачу"}
    </Button>
  );
}

export function PartnershipTaskForm() {
  const [state, formAction] = useFormState(
    createPartnershipTaskAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="partnershipTaskType" className="text-sm text-muted">
            Тип
          </label>
          <select
            id="partnershipTaskType"
            name="taskType"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
            defaultValue="find_contact"
          >
            {PARTNERSHIP_TASK_TYPES.map((type) => (
              <option key={type} value={type}>
                {partnershipTaskTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="partnershipTaskTitle" className="text-sm text-muted">
            Название
          </label>
          <Input
            id="partnershipTaskTitle"
            name="title"
            required
            placeholder="Задача партнёрства"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label
          htmlFor="partnershipTaskDescription"
          className="text-sm text-muted"
        >
          Описание
        </label>
        <textarea
          id="partnershipTaskDescription"
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
