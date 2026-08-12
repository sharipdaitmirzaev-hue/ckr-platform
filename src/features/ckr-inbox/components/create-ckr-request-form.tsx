"use client";

import {
  CKR_REQUEST_TYPES,
  ckrRequestTypeLabels,
} from "@/config/ckr-inbox";
import {
  createCkrRequestAction,
  type CkrInboxActionState,
} from "@/features/ckr-inbox/actions";
import { useMemo } from "react";
import { useFormState, useFormStatus } from "react-dom";

const initial: CkrInboxActionState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-accent px-4 py-2 text-sm text-white disabled:opacity-60"
    >
      {pending ? "Отправка…" : "Отправить в ЦКР"}
    </button>
  );
}

export function CreateCkrRequestForm({
  organizationId,
  organizationName,
}: {
  organizationId?: string;
  organizationName?: string;
}) {
  const [state, action] = useFormState(createCkrRequestAction, initial);
  const idempotencyKey = useMemo(
    () => `ckr-req-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    [],
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {organizationId ? (
        <input type="hidden" name="organizationId" value={organizationId} />
      ) : null}
      {organizationName ? (
        <p className="text-sm text-muted">Организация: {organizationName}</p>
      ) : null}
      <label className="block text-sm">
        Тип
        <select
          name="requestType"
          defaultValue="FIND_BUYER"
          className="mt-1 h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {CKR_REQUEST_TYPES.map((t) => (
            <option key={t} value={t}>
              {ckrRequestTypeLabels[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Тема
        <input
          name="subject"
          required
          className="mt-1 h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          placeholder="Например: Нужны покупатели напитков"
        />
      </label>
      <label className="block text-sm">
        Описание
        <textarea
          name="body"
          required
          rows={5}
          className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          placeholder="Что нужно ЦКР сделать?"
        />
      </label>
      <Submit />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-foreground">{state.success}</p>
      ) : null}
    </form>
  );
}
