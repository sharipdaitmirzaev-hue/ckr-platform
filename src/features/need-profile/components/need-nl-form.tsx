"use client";

import {
  confirmNeedDraftsAction,
  parseNeedNlAction,
  type NeedActionState,
} from "@/features/need-profile/actions";
import { useFormState, useFormStatus } from "react-dom";

const initial: NeedActionState = {};

function ParseButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      Разобрать запрос
    </button>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      Подтвердить и сохранить
    </button>
  );
}

export function NeedNlForm() {
  const [parseState, parseAction] = useFormState(parseNeedNlAction, initial);
  const [confirmState, confirmAction] = useFormState(
    confirmNeedDraftsAction,
    initial,
  );

  return (
    <div className="space-y-4">
      <form action={parseAction} className="space-y-3">
        <label className="block text-sm text-foreground">
          Опишите своими словами
          <textarea
            name="text"
            required
            rows={4}
            placeholder="Например: Есть 20 млн, хочу вложить в производство в Дагестане"
            className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>
        <ParseButton />
      </form>

      {parseState.error ? (
        <p className="text-sm text-red-700">{parseState.error}</p>
      ) : null}

      {parseState.drafts?.length ? (
        <div className="space-y-3 border-t border-border pt-4">
          <pre className="whitespace-pre-wrap text-sm text-muted">
            {parseState.confirmationText}
          </pre>
          <form action={confirmAction} className="space-y-2">
            <input
              type="hidden"
              name="draftsJson"
              value={JSON.stringify(parseState.drafts)}
            />
            <p className="text-xs text-muted">
              LLM/парсер только предлагает структуру. Сохранение — только после
              подтверждения.
            </p>
            <ConfirmButton />
          </form>
          {confirmState.error ? (
            <p className="text-sm text-red-700">{confirmState.error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
