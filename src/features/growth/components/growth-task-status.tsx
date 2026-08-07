"use client";

import {
  GROWTH_TASK_STATUSES,
  growthTaskStatusLabels,
  type GrowthTaskStatus,
} from "@/config/growth";
import { updateGrowthTaskStatusAction } from "@/features/growth/actions";

type Props = {
  taskId: string;
  status: GrowthTaskStatus;
};

export function GrowthTaskStatusSelect({ taskId, status }: Props) {
  return (
    <form action={updateGrowthTaskStatusAction}>
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="status"
        defaultValue={status}
        className="h-9 rounded-sm border border-border bg-surface px-2 text-xs"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {GROWTH_TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {growthTaskStatusLabels[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
