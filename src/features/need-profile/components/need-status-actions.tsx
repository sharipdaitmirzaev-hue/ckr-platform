"use client";

import {
  setNeedStatusAction,
  type NeedActionState,
} from "@/features/need-profile/actions";
import { useFormState, useFormStatus } from "react-dom";

const initial: NeedActionState = {};

function StatusButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm border border-border px-3 py-1.5 text-xs disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export function NeedStatusActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [state, action] = useFormState(setNeedStatusAction, initial);

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "ACTIVE" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="ACTIVE" />
          <StatusButton label="Активировать" />
        </form>
      ) : null}
      {status === "ACTIVE" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="PAUSED" />
          <StatusButton label="Пауза" />
        </form>
      ) : null}
      {status !== "FULFILLED" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="FULFILLED" />
          <StatusButton label="Исполнено" />
        </form>
      ) : null}
      {status !== "ARCHIVED" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="ARCHIVED" />
          <StatusButton label="В архив" />
        </form>
      ) : null}
      {state.error ? (
        <p className="w-full text-xs text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="w-full text-xs text-muted">{state.success}</p>
      ) : null}
    </div>
  );
}
