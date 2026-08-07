"use client";

import { Button } from "@/components/ui/button";
import {
  createVerificationRequestAction,
  type VerificationActionState,
} from "@/features/verification/actions";
import type { DocumentRelatedType } from "@/types";
import { useFormState, useFormStatus } from "react-dom";

const initialState: VerificationActionState = {};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending || disabled}>
      {pending ? "Отправка..." : "Запросить проверку"}
    </Button>
  );
}

type RequestVerificationFormProps = {
  targetType: DocumentRelatedType;
  targetId: string;
  disabled?: boolean;
};

export function RequestVerificationForm({
  targetType,
  targetId,
  disabled,
}: RequestVerificationFormProps) {
  const [state, formAction] = useFormState(
    createVerificationRequestAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <SubmitButton disabled={disabled} />
      {state.error ? (
        <p className="text-xs text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-xs text-accent" role="status">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
