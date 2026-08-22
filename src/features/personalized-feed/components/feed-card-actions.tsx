"use client";

import {
  feedFeedbackAction,
  type FeedActionState,
} from "@/features/personalized-feed/actions";
import { useFormState, useFormStatus } from "react-dom";

const initial: FeedActionState = {};

function Btn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm border border-border px-2.5 py-1 text-xs text-foreground disabled:opacity-60"
    >
      {label}
    </button>
  );
}

/** Client feedback — human labels only (UX B). */
export function FeedCardActions({
  itemType,
  itemId,
  needProfileId,
  score,
  title,
}: {
  itemType: string;
  itemId: string;
  needProfileId: string;
  score: number;
  title: string;
  href?: string;
}) {
  const [state, action] = useFormState(feedFeedbackAction, initial);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="action" value="saved" />
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="needProfileId" value={needProfileId} />
          <input type="hidden" name="score" value={String(score)} />
          <input type="hidden" name="title" value={title} />
          <Btn label="Сохранить" />
        </form>
        <form action={action}>
          <input type="hidden" name="action" value="interested" />
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="needProfileId" value={needProfileId} />
          <input type="hidden" name="score" value={String(score)} />
          <input type="hidden" name="title" value={title} />
          <Btn label="Интересно" />
        </form>
        <form action={action}>
          <input type="hidden" name="action" value="not_interested" />
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="needProfileId" value={needProfileId} />
          <input type="hidden" name="score" value={String(score)} />
          <input type="hidden" name="title" value={title} />
          <Btn label="Не подходит" />
        </form>
      </div>
      {state.error ? (
        <p className="text-xs text-muted">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-xs text-muted">{state.success}</p>
      ) : null}
    </div>
  );
}
