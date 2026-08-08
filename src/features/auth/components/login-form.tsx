"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormMessage } from "@/features/auth/components/auth-form-message";
import { loginAction, type ActionState } from "@/features/auth/actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Вход..." : "Войти"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const resetOk = searchParams.get("reset") === "1";

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <AuthFormMessage
        error={state.error}
        success={
          state.success ??
          (resetOk ? "Пароль обновлён. Войдите с новым паролем." : undefined)
        }
      />
      <input type="hidden" name="next" value={next} />

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

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-sm text-muted">
            Пароль
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-accent hover:underline"
          >
            Забыли пароль?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <SubmitButton />
    </form>
  );
}
