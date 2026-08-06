"use client";

import {
  LAUNCH_GOAL_STATUSES,
  launchGoalStatusLabels,
  type LaunchGoalStatus,
} from "@/config/launch-goals";
import { updateLaunchGoalStatusAction } from "@/features/launch/actions";

type Props = {
  id: string;
  status: LaunchGoalStatus;
};

export function LaunchGoalStatusForm({ id, status }: Props) {
  return (
    <form action={updateLaunchGoalStatusAction} className="inline-flex">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-sm border border-border bg-surface px-2 text-xs"
      >
        {LAUNCH_GOAL_STATUSES.map((item) => (
          <option key={item} value={item}>
            {launchGoalStatusLabels[item]}
          </option>
        ))}
      </select>
    </form>
  );
}
