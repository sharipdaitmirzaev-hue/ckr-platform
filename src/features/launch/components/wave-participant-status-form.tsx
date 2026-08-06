"use client";

import {
  LAUNCH_WAVE_PARTICIPANT_STATUSES,
  launchWaveParticipantStatusLabels,
  type LaunchWaveParticipantStatus,
} from "@/config/launch-waves";
import { updateLaunchWaveParticipantStatusAction } from "@/features/launch/actions";

type Props = {
  id: string;
  status: LaunchWaveParticipantStatus;
};

export function WaveParticipantStatusForm({ id, status }: Props) {
  return (
    <form
      action={updateLaunchWaveParticipantStatusAction}
      className="inline-flex"
    >
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-sm border border-border bg-surface px-2 text-xs"
      >
        {LAUNCH_WAVE_PARTICIPANT_STATUSES.map((item) => (
          <option key={item} value={item}>
            {launchWaveParticipantStatusLabels[item]}
          </option>
        ))}
      </select>
    </form>
  );
}
