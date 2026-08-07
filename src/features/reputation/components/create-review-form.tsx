"use client";

import { Button } from "@/components/ui/button";
import {
  REVIEW_TARGET_TYPES,
  reviewTargetTypeLabels,
  type ReviewTargetType,
} from "@/config/reputation";
import {
  createReviewAction,
  type ReputationActionState,
} from "@/features/reputation/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ReputationActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Отправка…" : "Опубликовать отзыв"}
    </Button>
  );
}

type CreateReviewFormProps = {
  targetId: string;
  defaultTargetType?: ReviewTargetType;
  dealId?: string | null;
  allowedTypes?: ReviewTargetType[];
};

export function CreateReviewForm({
  targetId,
  defaultTargetType = "expert",
  dealId = null,
  allowedTypes = [...REVIEW_TARGET_TYPES],
}: CreateReviewFormProps) {
  const [state, action] = useFormState(createReviewAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="targetId" value={targetId} />
      {dealId ? <input type="hidden" name="dealId" value={dealId} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="review-target-type" className="text-sm text-muted">
            Тип
          </label>
          <select
            id="review-target-type"
            name="targetType"
            defaultValue={defaultTargetType}
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            {allowedTypes.map((type) => (
              <option key={type} value={type}>
                {reviewTargetTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="review-rating" className="text-sm text-muted">
            Оценка
          </label>
          <select
            id="review-rating"
            name="rating"
            defaultValue="5"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="review-comment" className="text-sm text-muted">
          Комментарий
        </label>
        <textarea
          id="review-comment"
          name="comment"
          rows={3}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
          placeholder="Кратко опишите опыт сотрудничества"
        />
      </div>

      <SubmitButton />
      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
    </form>
  );
}
