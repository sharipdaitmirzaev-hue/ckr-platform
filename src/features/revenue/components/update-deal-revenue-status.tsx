"use client";

import {
  DEAL_REVENUE_STATUSES,
  dealRevenueStatusLabels,
  type DealRevenueStatus,
} from "@/config/revenue";
import { updateDealRevenueStatusAction } from "@/features/revenue/actions";

type Props = {
  dealId: string;
  projectId: string;
  status: DealRevenueStatus;
};

export function UpdateDealRevenueStatusForm({
  dealId,
  projectId,
  status,
}: Props) {
  return (
    <form action={updateDealRevenueStatusAction}>
      <input type="hidden" name="dealId" value={dealId} />
      <input type="hidden" name="projectId" value={projectId} />
      <label className="sr-only" htmlFor={`rev-${dealId}`}>
        Коммерческий статус
      </label>
      <select
        id={`rev-${dealId}`}
        name="revenueStatus"
        defaultValue={status}
        className="h-9 rounded-sm border border-border bg-surface px-2 text-xs"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {DEAL_REVENUE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {dealRevenueStatusLabels[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
