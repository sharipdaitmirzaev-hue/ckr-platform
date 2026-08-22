"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { isInviteRequired } from "@/config/beta";
import {
  ASSIGNABLE_ROLES,
  roleDescriptions,
  roleLabels,
} from "@/config/roles";
import { AuthFormMessage } from "@/features/auth/components/auth-form-message";
import { registerAction, type ActionState } from "@/features/auth/actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Создание..." : "Создать аккаунт"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useFormState(registerAction, initialState);
  const searchParams = useSearchParams();
  const inviteFromQuery = searchParams.get("invite") ?? "";
  const requireInvite = isInviteRequired();

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <AuthFormMessage error={state.error} success={state.success} />

      <div className="space-y-2">
        <label htmlFor="inviteCode" className="text-sm text-muted">
          Код приглашения{requireInvite ? "" : " (если есть)"}
        </label>
        <Input
          id="inviteCode"
          name="inviteCode"
          defaultValue={inviteFromQuery}
          placeholder="CKR-XXXXXXXX"
          required={requireInvite}
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm text-muted">
          Имя
        </label>
        <Input
          id="fullName"
          name="fullName"
          placeholder="Как к вам обращаться"
          autoComplete="name"
          required
        />
      </div>

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
        <label htmlFor="password" className="text-sm text-muted">
          Пароль
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

      <fieldset className="space-y-3">
        <legend className="text-sm text-muted">Роль</legend>
        <div className="space-y-2">
          {ASSIGNABLE_ROLES.map((role) => (
            <label
              key={role}
              className="flex cursor-pointer gap-3 rounded-sm border border-border px-3 py-3 transition-colors hover:border-accent/40 has-[:checked]:border-accent/60 has-[:checked]:bg-accent-muted"
            >
              <input
                type="radio"
                name="role"
                value={role}
                defaultChecked={role === "entrepreneur"}
                className="mt-1 accent-[var(--ckr-accent)]"
                required
              />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  {roleLabels[role]}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {roleDescriptions[role]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted">
        <input
          type="checkbox"
          name="acceptTerms"
          value="on"
          required
          className="mt-1 accent-[var(--ckr-accent)]"
        />
        <span>
          Я принимаю{" "}
          <Link href="/terms" className="text-accent hover:underline">
            пользовательское соглашение
          </Link>{" "}
          и{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            политику конфиденциальности
          </Link>
        </span>
      </label>

      <SubmitButton />
    </form>
  );
}
