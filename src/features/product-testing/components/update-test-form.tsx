"use client";

import { Button } from "@/components/ui/button";
import {
  PRODUCT_TEST_STATUSES,
  productTestStatusLabels,
} from "@/config/product-testing";
import {
  updateProductTestAction,
  type ProductTestActionState,
} from "@/features/product-testing/actions";
import type { ProductTest } from "@/types";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ProductTestActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Сохранение…" : "Сохранить результат"}
    </Button>
  );
}

type UpdateTestFormProps = {
  test: ProductTest;
};

export function UpdateTestForm({ test }: UpdateTestFormProps) {
  const [state, action] = useFormState(updateProductTestAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={test.id} />

      <div className="space-y-2">
        <label htmlFor={`status-${test.id}`} className="text-sm text-muted">
          Статус прохождения
        </label>
        <select
          id={`status-${test.id}`}
          name="status"
          defaultValue={test.status}
          className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {PRODUCT_TEST_STATUSES.map((status) => (
            <option key={status} value={status}>
              {productTestStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      {test.checklist.length > 0 ? (
        <fieldset className="space-y-3">
          <legend className="text-sm text-muted">Список проверок</legend>
          {test.checklist.map((item) => (
            <label
              key={item.id}
              className="flex gap-3 rounded-sm border border-border px-3 py-2"
            >
              <input
                type="checkbox"
                name={`check_${item.id}`}
                defaultChecked={item.done}
                className="mt-1 accent-[var(--ckr-accent)]"
              />
              <span className="text-sm text-foreground">{item.label}</span>
            </label>
          ))}
        </fieldset>
      ) : null}

      <div className="space-y-2">
        <label htmlFor={`result-${test.id}`} className="text-sm text-muted">
          Результат / заметки
        </label>
        <textarea
          id={`result-${test.id}`}
          name="resultNotes"
          defaultValue={test.resultNotes}
          rows={3}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          placeholder="Что получилось при прогоне"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={`issues-${test.id}`} className="text-sm text-muted">
          Найденные проблемы
        </label>
        <textarea
          id={`issues-${test.id}`}
          name="issues"
          defaultValue={test.issues}
          rows={3}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          placeholder="Баги, тупики UX, неясные тексты"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`recommendations-${test.id}`}
          className="text-sm text-muted"
        >
          Рекомендации
        </label>
        <textarea
          id={`recommendations-${test.id}`}
          name="recommendations"
          defaultValue={test.recommendations}
          rows={3}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          placeholder="Что улучшить перед реальным использованием"
        />
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
