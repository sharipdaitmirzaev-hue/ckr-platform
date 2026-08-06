"use client";

import { Button } from "@/components/ui/button";
import {
  activatePublicLaunchWaveAction,
  type LaunchActionState,
} from "@/features/launch/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: LaunchActionState = {};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? "Активация…" : "Активировать Public Launch Wave 1"}
    </Button>
  );
}

type Props = {
  canActivate: boolean;
};

export function ActivatePublicLaunchForm({ canActivate }: Props) {
  const [state, formAction] = useFormState(
    activatePublicLaunchWaveAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-muted">
        Реальный запуск выполняется только при зафиксированном решении{" "}
        <span className="text-foreground">public_launch</span>. Иначе
        continue_beta / improve_product блокируют активацию.
      </p>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
      <SubmitButton disabled={!canActivate} />
    </form>
  );
}
