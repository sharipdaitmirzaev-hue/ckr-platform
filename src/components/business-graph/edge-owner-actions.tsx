"use client";

import {
  commentGraphEdgeAction,
  confirmGraphEdgeAction,
  rejectGraphEdgeAction,
  type GraphActionState,
} from "@/features/business-graph/actions";
import { useFormState, useFormStatus } from "react-dom";

const initial: GraphActionState = {};

function ActionButton({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "accent";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        variant === "accent"
          ? "rounded-sm bg-accent px-2 py-1 text-xs text-white disabled:opacity-60"
          : "rounded-sm border border-border px-2 py-1 text-xs text-foreground disabled:opacity-60"
      }
    >
      {label}
    </button>
  );
}

export function EdgeOwnerActions({
  edgeId,
  nodeId,
}: {
  edgeId: string;
  nodeId: string;
}) {
  const [confirmState, confirmAction] = useFormState(
    confirmGraphEdgeAction,
    initial,
  );
  const [rejectState, rejectAction] = useFormState(
    rejectGraphEdgeAction,
    initial,
  );
  const [commentState, commentAction] = useFormState(
    commentGraphEdgeAction,
    initial,
  );

  const message =
    confirmState.success ||
    confirmState.error ||
    rejectState.success ||
    rejectState.error ||
    commentState.success ||
    commentState.error;

  return (
    <div className="mt-2 space-y-2 border-t border-border pt-2">
      <div className="flex flex-wrap gap-2">
        <form action={confirmAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="edgeId" value={edgeId} />
          <input type="hidden" name="nodeId" value={nodeId} />
          <input
            name="comment"
            placeholder="Комментарий (опц.)"
            className="rounded-sm border border-border bg-surface px-2 py-1 text-xs"
          />
          <ActionButton label="Подтвердить" variant="accent" />
        </form>
        <form action={rejectAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="edgeId" value={edgeId} />
          <input type="hidden" name="nodeId" value={nodeId} />
          <input
            name="comment"
            placeholder="Причина (опц.)"
            className="rounded-sm border border-border px-2 py-1 text-xs"
          />
          <ActionButton label="Отклонить" />
        </form>
      </div>
      <form action={commentAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="edgeId" value={edgeId} />
        <input type="hidden" name="nodeId" value={nodeId} />
        <input
          name="comment"
          required
          placeholder="Комментарий владельца"
          className="min-w-[180px] flex-1 rounded-sm border border-border bg-surface px-2 py-1 text-xs"
        />
        <ActionButton label="Сохранить комментарий" />
      </form>
      {message ? (
        <p className="text-xs text-muted">{message}</p>
      ) : null}
    </div>
  );
}
