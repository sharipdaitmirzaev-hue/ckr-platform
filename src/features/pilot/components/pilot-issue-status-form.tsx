"use client";

import {
  PILOT_ISSUE_STATUSES,
  pilotIssueStatusLabels,
  type PilotIssueStatus,
} from "@/config/pilot";
import { updatePilotIssueStatusAction } from "@/features/pilot/actions";
import { useTransition } from "react";

type PilotIssueStatusFormProps = {
  id: string;
  status: PilotIssueStatus;
};

export function PilotIssueStatusForm({
  id,
  status,
}: PilotIssueStatusFormProps) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      disabled={pending}
      defaultValue={status}
      onChange={(event) => {
        const next = event.target.value;
        const formData = new FormData();
        formData.set("id", id);
        formData.set("status", next);
        startTransition(async () => {
          await updatePilotIssueStatusAction(formData);
        });
      }}
      className="h-9 rounded-sm border border-border bg-surface px-2 text-xs"
      aria-label="Статус проблемы"
    >
      {PILOT_ISSUE_STATUSES.map((item) => (
        <option key={item} value={item}>
          {pilotIssueStatusLabels[item]}
        </option>
      ))}
    </select>
  );
}
