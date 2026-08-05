"use client";

import {
  ROADMAP_ITEM_STATUSES,
  roadmapItemStatusLabels,
  type RoadmapItemStatus,
} from "@/config/execution";
import { updateRoadmapItemStatusAction } from "@/features/execution/actions";
import { useTransition } from "react";

type RoadmapItemStatusSelectProps = {
  projectId: string;
  itemId: string;
  status: RoadmapItemStatus;
};

export function RoadmapItemStatusSelect({
  projectId,
  itemId,
  status,
}: RoadmapItemStatusSelectProps) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      className="rounded-sm border border-border bg-background px-2 py-1 text-xs"
      defaultValue={status}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value as RoadmapItemStatus;
        startTransition(async () => {
          await updateRoadmapItemStatusAction(projectId, itemId, next);
        });
      }}
    >
      {ROADMAP_ITEM_STATUSES.map((value) => (
        <option key={value} value={value}>
          {roadmapItemStatusLabels[value]}
        </option>
      ))}
    </select>
  );
}
