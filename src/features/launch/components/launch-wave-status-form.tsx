"use client";

import {
  LAUNCH_WAVE_STATUSES,
  launchWaveStatusLabels,
  type LaunchWaveStatus,
} from "@/config/launch-waves";
import { updateLaunchWaveStatusAction } from "@/features/launch/actions";

type Props = {
  id: string;
  status: LaunchWaveStatus;
};

export function LaunchWaveStatusForm({ id, status }: Props) {
  return (
    <form action={updateLaunchWaveStatusAction} className="inline-flex">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-sm border border-border bg-surface px-2 text-xs"
      >
        {LAUNCH_WAVE_STATUSES.map((item) => (
          <option key={item} value={item}>
            {launchWaveStatusLabels[item]}
          </option>
        ))}
      </select>
    </form>
  );
}
