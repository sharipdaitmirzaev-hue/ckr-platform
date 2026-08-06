"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pathForRoles, rolePaths } from "@/config/onboarding";
import {
  ASSIGNABLE_ROLES,
  roleDescriptions,
  roleLabels,
  type AssignableRole,
} from "@/config/roles";
import { AuthFormMessage } from "@/features/auth/components/auth-form-message";
import { onboardingAction, type ActionState } from "@/features/auth/actions";
import type { ProfileRow } from "@/types/database";
import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Сохранение..." : label}
    </Button>
  );
}

type OnboardingFormProps = {
  profile: ProfileRow;
  roles: AssignableRole[];
};

export function OnboardingForm({ profile, roles }: OnboardingFormProps) {
  const [state, formAction] = useFormState(onboardingAction, initialState);
  const [selected, setSelected] = useState<AssignableRole[]>(
    roles.length > 0 ? roles : ["entrepreneur"],
  );

  const path = useMemo(() => pathForRoles(selected), [selected]);

  function toggleRole(role: AssignableRole) {
    setSelected((prev) => {
      if (prev.includes(role)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== role);
      }
      return [...prev, role];
    });
  }

  return (
    <form action={formAction} className="mt-8 space-y-8">
      <AuthFormMessage error={state.error} success={state.success} />

      <section className="space-y-3">
        <h2 className="font-display text-lg text-foreground">1. Выберите роль</h2>
        <p className="text-sm text-muted">
          Можно выбрать несколько. Первый шаг подстроится под основную роль.
        </p>
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
                checked={selected.includes(role)}
                onChange={() => toggleRole(role)}
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
      </section>

      <section className="rounded-sm border border-accent/40 bg-accent-muted/20 px-4 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-accent">
          Ваш первый шаг
        </p>
        <h3 className="mt-2 font-display text-xl text-foreground">
          {path.title}
        </h3>
        <p className="mt-2 text-sm text-muted">{path.description}</p>
        <p className="mt-2 text-xs text-muted">
          Важно: после сохранения профиля сразу откройте первый шаг — на этом
          месте чаще всего «выходят» из онбординга.
        </p>
        <ul className="mt-4 space-y-1.5 text-xs text-muted">
          {selected.map((role) => (
            <li key={role}>
              {roleLabels[role]}: {rolePaths[role].title}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg text-foreground">2. Профиль</h2>

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

        <div className="space-y-2">
          <label htmlFor="website" className="text-sm text-muted">
            Сайт
          </label>
          <Input
            id="website"
            name="website"
            type="url"
            defaultValue={profile.website ?? ""}
            placeholder="https://..."
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

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="telegram" className="text-sm text-muted">
              Telegram
            </label>
            <Input
              id="telegram"
              name="telegram"
              defaultValue={profile.social_links?.telegram ?? ""}
              placeholder="@username"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="linkedin" className="text-sm text-muted">
              LinkedIn
            </label>
            <Input
              id="linkedin"
              name="linkedin"
              defaultValue={profile.social_links?.linkedin ?? ""}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="vk" className="text-sm text-muted">
              VK
            </label>
            <Input
              id="vk"
              name="vk"
              defaultValue={profile.social_links?.vk ?? ""}
              placeholder="https://vk.com/..."
            />
          </div>
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

        <fieldset className="space-y-3 rounded-sm border border-border px-3 py-3">
          <legend className="px-1 text-sm text-muted">Приватность профиля</legend>
          <label className="flex cursor-pointer gap-3">
            <input
              type="checkbox"
              name="isPublic"
              defaultChecked={profile.is_public !== false}
              className="mt-1 accent-[var(--ckr-accent)]"
            />
            <span className="text-sm text-foreground">
              Публичный профиль{" "}
              <span className="text-muted">(/profile/… видимо другим)</span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3">
            <input
              type="checkbox"
              name="showContact"
              defaultChecked={Boolean(profile.show_contact)}
              className="mt-1 accent-[var(--ckr-accent)]"
            />
            <span className="text-sm text-foreground">
              Показывать телефон на публичном профиле
            </span>
          </label>
        </fieldset>
      </section>

      <SubmitButton label={`${path.ctaLabel} →`} />
    </form>
  );
}
