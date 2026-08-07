"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PILOT_PARTICIPANT_ROLES,
  PILOT_PARTICIPANT_STATUSES,
  pilotParticipantRoleLabels,
  pilotParticipantStatusLabels,
} from "@/config/pilot-operations";
import {
  createPilotParticipantAction,
  type PilotActionState,
} from "@/features/pilot/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: PilotActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Сохранение…" : "Добавить участника"}
    </Button>
  );
}

export function CreatePilotParticipantForm() {
  const [state, formAction] = useFormState(
    createPilotParticipantAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <h3 className="font-display text-lg text-foreground">
        Новый участник пилота
      </h3>
      <p className="text-xs text-muted">
        Создаёт запись в pilot_participants и типовой чеклист.
      </p>
      {state.error ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
      <div className="space-y-1">
        <label htmlFor="participant-user-id" className="text-sm text-muted">
          User ID (uuid, опционально)
        </label>
        <Input
          id="participant-user-id"
          name="userId"
          placeholder="uuid профиля"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="participant-role" className="text-sm text-muted">
          Роль
        </label>
        <select
          id="participant-role"
          name="role"
          defaultValue="entrepreneur"
          className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {PILOT_PARTICIPANT_ROLES.map((role) => (
            <option key={role} value={role}>
              {pilotParticipantRoleLabels[role]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="participant-status" className="text-sm text-muted">
          Статус
        </label>
        <select
          id="participant-status"
          name="status"
          defaultValue="invited"
          className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {PILOT_PARTICIPANT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {pilotParticipantStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="participant-notes" className="text-sm text-muted">
          Заметки
        </label>
        <textarea
          id="participant-notes"
          name="notes"
          rows={3}
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
          placeholder="Контекст приглашения"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
