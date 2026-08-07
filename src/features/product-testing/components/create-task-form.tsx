"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRODUCT_TEST_SCENARIOS } from "@/config/product-testing";
import {
  createProductTestTaskAction,
  type ProductTestActionState,
} from "@/features/product-testing/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ProductTestActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Создание…" : "Создать задачу"}
    </Button>
  );
}

export function CreateTaskForm() {
  const [state, action] = useFormState(createProductTestTaskAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="task-title" className="text-sm text-muted">
          Название задачи
        </label>
        <Input
          id="task-title"
          name="title"
          required
          placeholder="Например: проверить empty state каталога"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="task-description" className="text-sm text-muted">
          Описание
        </label>
        <textarea
          id="task-description"
          name="description"
          rows={3}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          placeholder="Что проверить и ожидаемый результат"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="task-scenario" className="text-sm text-muted">
          Связанный сценарий (опционально)
        </label>
        <select
          id="task-scenario"
          name="scenarioKey"
          defaultValue=""
          className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          <option value="">Без сценария</option>
          {PRODUCT_TEST_SCENARIOS.map((scenario) => (
            <option key={scenario.key} value={scenario.key}>
              {scenario.title}
            </option>
          ))}
        </select>
      </div>
      <SubmitButton />
      {state.error ? (
        <p className="text-sm text-red-300">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
    </form>
  );
}
