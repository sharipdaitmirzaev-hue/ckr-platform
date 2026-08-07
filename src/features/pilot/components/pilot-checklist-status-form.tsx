"use client";

import {
  PILOT_CHECKLIST_STATUSES,
  pilotChecklistStatusLabels,
  type PilotChecklistStatus,
} from "@/config/pilot-operations";
import { updatePilotChecklistStatusAction } from "@/features/pilot/actions";

type Props = {
  id: string;
  status: PilotChecklistStatus;
};

export function PilotChecklistStatusForm({ id, status }: Props) {
  return (
    <form action={updatePilotChecklistStatusAction} className="inline-flex">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-sm border border-border bg-surface px-2 text-xs"
      >
        {PILOT_CHECKLIST_STATUSES.map((item) => (
          <option key={item} value={item}>
            {pilotChecklistStatusLabels[item]}
          </option>
        ))}
      </select>
    </form>
  );
}
