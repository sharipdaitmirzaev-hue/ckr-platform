"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PRODUCT_IMPROVEMENT_PRIORITIES,
  PRODUCT_IMPROVEMENT_SOURCES,
  PRODUCT_IMPROVEMENT_STATUSES,
  productImprovementPriorityLabels,
  productImprovementSourceLabels,
  productImprovementStatusLabels,
} from "@/config/improvements";
import {
  createProductImprovementAction,
  type ImprovementActionState,
} from "@/features/improvements/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ImprovementActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Сохранение…" : "Добавить улучшение"}
    </Button>
  );
}

export function CreateImprovementForm() {
  const [state, formAction] = useFormState(
    createProductImprovementAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <h3 className="font-display text-lg text-foreground">Новое улучшение</h3>
      <p className="text-xs text-muted">
        Запись в product_improvements. Источник можно указать вручную или
        продвинуть из feedback / issue.
      </p>
      {state.error ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
      <Input name="title" placeholder="Заголовок" required minLength={3} />
      <textarea
        name="description"
        rows={3}
        placeholder="Описание"
        className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          name="priority"
          defaultValue="medium"
          className="h-11 rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {PRODUCT_IMPROVEMENT_PRIORITIES.map((item) => (
            <option key={item} value={item}>
              {productImprovementPriorityLabels[item]}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue="planned"
          className="h-11 rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {PRODUCT_IMPROVEMENT_STATUSES.map((item) => (
            <option key={item} value={item}>
              {productImprovementStatusLabels[item]}
            </option>
          ))}
        </select>
      </div>
      <select
        name="sourceType"
        defaultValue="manual"
        className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
      >
        {PRODUCT_IMPROVEMENT_SOURCES.map((item) => (
          <option key={item} value={item}>
            {productImprovementSourceLabels[item]}
          </option>
        ))}
      </select>
      <Input name="sourceId" placeholder="source_id (uuid, опционально)" />
      <SubmitButton />
    </form>
  );
}
