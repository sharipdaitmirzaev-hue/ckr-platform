"use client";

import {
  LAUNCH_OPS_TASK_STATUSES,
  launchOpsTaskStatusLabels,
  type LaunchOpsTaskStatus,
} from "@/config/launch-operations";
import { updateLaunchOpsTaskStatusAction } from "@/features/launch/actions";

type Props = {
  taskId: string;
  status: LaunchOpsTaskStatus;
};

export function LaunchOpsTaskStatusSelect({ taskId, status }: Props) {
  return (
    <form action={updateLaunchOpsTaskStatusAction}>
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="status"
        defaultValue={status}
        className="h-9 rounded-sm border border-border bg-surface px-2 text-xs"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {LAUNCH_OPS_TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {launchOpsTaskStatusLabels[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
