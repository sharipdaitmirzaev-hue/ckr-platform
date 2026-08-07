"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LAUNCH_WAVE_PARTICIPANT_STATUSES,
  launchWaveParticipantStatusLabels,
} from "@/config/launch-waves";
import {
  addLaunchWaveParticipantAction,
  type LaunchActionState,
} from "@/features/launch/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: LaunchActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Сохранение…" : "Добавить участника"}
    </Button>
  );
}

type Props = {
  waveId: string;
  waveName: string;
};

export function AddWaveParticipantForm({ waveId, waveName }: Props) {
  const [state, formAction] = useFormState(
    addLaunchWaveParticipantAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <h3 className="font-display text-lg text-foreground">
        Участник волны
      </h3>
      <p className="text-xs text-muted">{waveName}</p>
      <input type="hidden" name="waveId" value={waveId} />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
      <div className="space-y-1">
        <label htmlFor="wave-user-id" className="text-sm text-muted">
          User ID (uuid)
        </label>
        <Input id="wave-user-id" name="userId" placeholder="uuid профиля" />
      </div>
      <div className="space-y-1">
        <label htmlFor="wave-p-status" className="text-sm text-muted">
          Статус
        </label>
        <select
          id="wave-p-status"
          name="status"
          defaultValue="invited"
          className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {LAUNCH_WAVE_PARTICIPANT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {launchWaveParticipantStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="wave-notes" className="text-sm text-muted">
          Заметки
        </label>
        <Input id="wave-notes" name="notes" placeholder="опционально" />
      </div>
      <SubmitButton />
    </form>
  );
}
