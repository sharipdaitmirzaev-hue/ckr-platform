"use client";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthFormMessage } from "@/features/auth/components/auth-form-message";
import {
  resetPasswordAction,
  type ActionState,
} from "@/features/auth/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Сохранение..." : "Сохранить пароль"}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useFormState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <AuthFormMessage error={state.error} success={state.success} />

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm text-muted">
          Новый пароль
        </label>
        <PasswordInput
          id="password"
          name="password"
          placeholder="Не менее 8 символов"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm text-muted">
          Повторите пароль
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <SubmitButton />
    </form>
  );
}
