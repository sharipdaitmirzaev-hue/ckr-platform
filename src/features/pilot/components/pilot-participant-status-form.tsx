"use client";

import {
  PILOT_PARTICIPANT_STATUSES,
  pilotParticipantStatusLabels,
  type PilotParticipantStatus,
} from "@/config/pilot-operations";
import { updatePilotParticipantStatusAction } from "@/features/pilot/actions";

type Props = {
  id: string;
  status: PilotParticipantStatus;
};

export function PilotParticipantStatusForm({ id, status }: Props) {
  return (
    <form action={updatePilotParticipantStatusAction} className="inline-flex">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-sm border border-border bg-surface px-2 text-xs"
      >
        {PILOT_PARTICIPANT_STATUSES.map((item) => (
          <option key={item} value={item}>
            {pilotParticipantStatusLabels[item]}
          </option>
        ))}
      </select>
    </form>
  );
}
