"use client";

import { Badge } from "@/components/ui/badge";
import {
  MILESTONE_STATUSES,
  milestoneStatusLabels,
} from "@/config/deals";
import { updateMilestoneStatusAction } from "@/features/deals/actions";
import type { MilestoneStatus, ProjectMilestone } from "@/types";
import { useTransition } from "react";

type MilestoneListProps = {
  milestones: ProjectMilestone[];
  projectId: string;
  canManage: boolean;
};

export function MilestoneList({
  milestones,
  projectId,
  canManage,
}: MilestoneListProps) {
  const [pending, startTransition] = useTransition();

  if (milestones.length === 0) {
    return (
      <p className="text-sm text-muted">
        Этапы пока не созданы. Добавьте типовой план или свой этап.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {milestones.map((item, index) => (
        <li
          key={item.id}
          className="rounded-sm border border-border bg-background/40 px-4 py-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="soft">Шаг {index + 1}</Badge>
            <Badge
              variant={
                item.status === "completed"
                  ? "accent"
                  : item.status === "blocked"
                    ? "default"
                    : "soft"
              }
            >
              {milestoneStatusLabels[item.status]}
            </Badge>
          </div>
          <p className="mt-2 font-display text-base text-foreground">
            {item.title}
          </p>
          {item.description ? (
            <p className="mt-1 text-sm text-muted">{item.description}</p>
          ) : null}
          {item.deadline ? (
            <p className="mt-1 text-xs text-muted">Срок: {item.deadline}</p>
          ) : null}

          {canManage ? (
            <div className="mt-3">
              <select
                disabled={pending}
                defaultValue={item.status}
                onChange={(event) => {
                  const status = event.target.value as MilestoneStatus;
                  startTransition(async () => {
                    await updateMilestoneStatusAction(
                      item.id,
                      projectId,
                      status,
                    );
                  });
                }}
                className="h-9 rounded-sm border border-border bg-surface px-2 text-sm"
              >
                {MILESTONE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {milestoneStatusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
