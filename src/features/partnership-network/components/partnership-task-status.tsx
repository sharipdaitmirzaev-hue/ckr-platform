"use client";

import {
  PARTNERSHIP_TASK_STATUSES,
  partnershipTaskStatusLabels,
  type PartnershipTaskStatus,
} from "@/config/partnership-network";
import { updatePartnershipTaskStatusAction } from "@/features/partnership-network/actions";

type Props = {
  taskId: string;
  status: PartnershipTaskStatus;
};

export function PartnershipTaskStatusSelect({ taskId, status }: Props) {
  return (
    <form action={updatePartnershipTaskStatusAction}>
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="status"
        defaultValue={status}
        className="h-9 rounded-sm border border-border bg-surface px-2 text-xs"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {PARTNERSHIP_TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {partnershipTaskStatusLabels[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
