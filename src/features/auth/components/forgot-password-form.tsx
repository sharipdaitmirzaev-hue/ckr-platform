"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormMessage } from "@/features/auth/components/auth-form-message";
import {
  forgotPasswordAction,
  type ActionState,
} from "@/features/auth/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Отправка..." : "Отправить ссылку"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <AuthFormMessage error={state.error} success={state.success} />

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm text-muted">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.ru"
          autoComplete="email"
          required
        />
      </div>

      <SubmitButton />
    </form>
  );
}
