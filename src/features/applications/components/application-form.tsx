"use client";

import { Button } from "@/components/ui/button";
import {
  createApplicationAction,
  type ApplicationActionState,
} from "@/features/applications/actions";
import type { ApplicationTargetType } from "@/types";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ApplicationActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Отправка..." : "Отправить заявку"}
    </Button>
  );
}

type ApplicationFormProps = {
  targetType: ApplicationTargetType;
  targetId: string;
  onCancel?: () => void;
};

export function ApplicationForm({
  targetType,
  targetId,
  onCancel,
}: ApplicationFormProps) {
  const [state, formAction] = useFormState(createApplicationAction, initialState);

  return (
    <form action={formAction} className="space-y-4 border-t border-border pt-5">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />

      {state.error ? (
        <p
          role="alert"
          className="rounded-sm border border-danger/40 bg-danger-muted px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          role="status"
          className="rounded-sm border border-accent/30 bg-accent-muted px-3 py-2 text-sm text-accent"
        >
          {state.success}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm text-muted">
          Сообщение
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={20}
          rows={5}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          placeholder="Кратко опишите интерес, формат сотрудничества и следующий шаг"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <SubmitButton />
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
        ) : null}
      </div>
    </form>
  );
}
