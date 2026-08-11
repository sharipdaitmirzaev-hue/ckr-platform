"use client";

import {
  setNeedStatusAction,
  type NeedActionState,
} from "@/features/need-profile/actions";
import { useActionState } from "react";

const initial: NeedActionState = {};

export function NeedStatusActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [state, action, pending] = useActionState(setNeedStatusAction, initial);

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "ACTIVE" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="ACTIVE" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm border border-border px-3 py-1.5 text-xs"
          >
            Активировать
          </button>
        </form>
      ) : null}
      {status === "ACTIVE" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="PAUSED" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm border border-border px-3 py-1.5 text-xs"
          >
            Пауза
          </button>
        </form>
      ) : null}
      {status !== "FULFILLED" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="FULFILLED" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm border border-border px-3 py-1.5 text-xs"
          >
            Исполнено
          </button>
        </form>
      ) : null}
      {status !== "ARCHIVED" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="ARCHIVED" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm border border-border px-3 py-1.5 text-xs"
          >
            В архив
          </button>
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
