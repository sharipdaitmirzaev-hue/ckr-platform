"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { betaInviteRoles } from "@/config/beta";
import {
  INVITE_SOURCES,
  inviteSourceLabels,
} from "@/config/first-users-wave";
import { roleLabels } from "@/config/roles";
import {
  createBetaInviteAction,
  type BetaActionState,
} from "@/features/beta/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: BetaActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Создание…" : "Создать приглашение"}
    </Button>
  );
}

export function CreateInviteForm() {
  const [state, action] = useFormState(createBetaInviteAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="invite-email" className="text-sm text-muted">
          Email
        </label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder="partner@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="invite-role" className="text-sm text-muted">
          Роль участника
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue="entrepreneur"
          className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {betaInviteRoles.map((role) => (
            <option key={role} value={role}>
              {roleLabels[role]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="invite-source" className="text-sm text-muted">
          Источник приглашения
        </label>
        <select
          id="invite-source"
          name="source"
          defaultValue="first_users_wave"
          className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {INVITE_SOURCES.map((source) => (
            <option key={source} value={source}>
              {inviteSourceLabels[source]}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="markSent" className="accent-[var(--ckr-accent)]" />
        Сразу отметить как отправленное
      </label>
      <SubmitButton />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <div className="space-y-1 text-sm text-accent">
          <p>{state.success}</p>
          {state.code ? (
            <p className="font-mono text-foreground">Код: {state.code}</p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
