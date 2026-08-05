"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ASSIGNABLE_ROLES,
  roleDescriptions,
  roleLabels,
  type AssignableRole,
} from "@/config/roles";
import { AuthFormMessage } from "@/features/auth/components/auth-form-message";
import { onboardingAction, type ActionState } from "@/features/auth/actions";
import type { ProfileRow } from "@/types/database";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Сохранение..." : "Сохранить и перейти в кабинет"}
    </Button>
  );
}

type OnboardingFormProps = {
  profile: ProfileRow;
  roles: AssignableRole[];
};

export function OnboardingForm({ profile, roles }: OnboardingFormProps) {
  const [state, formAction] = useFormState(onboardingAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <AuthFormMessage error={state.error} success={state.success} />

      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm text-muted">
          Имя
        </label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={profile.full_name}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="companyName" className="text-sm text-muted">
          Компания
        </label>
        <Input
          id="companyName"
          name="companyName"
          defaultValue={profile.company_name ?? ""}
          placeholder="Необязательно"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm text-muted">
            Город
          </label>
          <Input
            id="city"
            name="city"
            defaultValue={profile.city ?? ""}
            placeholder="Москва"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="region" className="text-sm text-muted">
            Регион
          </label>
          <Input
            id="region"
            name="region"
            defaultValue={profile.region ?? ""}
            placeholder="Центральный ФО"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm text-muted">
          Телефон
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ""}
          placeholder="+7 ..."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm text-muted">
          О себе
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          rows={3}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          placeholder="Кратко о вашем опыте и интересах"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm text-muted">
          Роли (можно выбрать несколько)
        </legend>
        <div className="space-y-2">
          {ASSIGNABLE_ROLES.map((role) => (
            <label
              key={role}
              className="flex cursor-pointer gap-3 rounded-sm border border-border px-3 py-3 transition-colors hover:border-accent/40 has-[:checked]:border-accent/60 has-[:checked]:bg-accent-muted"
            >
              <input
                type="checkbox"
                name="roles"
                value={role}
                defaultChecked={roles.includes(role)}
                className="mt-1 accent-[var(--ckr-accent)]"
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

      <SubmitButton />
    </form>
  );
}
