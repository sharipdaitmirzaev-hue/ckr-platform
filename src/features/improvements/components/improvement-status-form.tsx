"use client";

import {
  PRODUCT_IMPROVEMENT_STATUSES,
  productImprovementStatusLabels,
  type ProductImprovementStatus,
} from "@/config/improvements";
import { updateProductImprovementStatusAction } from "@/features/improvements/actions";

type Props = {
  id: string;
  status: ProductImprovementStatus;
};

export function ImprovementStatusForm({ id, status }: Props) {
  return (
    <form
      action={updateProductImprovementStatusAction}
      className="inline-flex"
    >
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-sm border border-border bg-surface px-2 text-xs"
      >
        {PRODUCT_IMPROVEMENT_STATUSES.map((item) => (
          <option key={item} value={item}>
            {productImprovementStatusLabels[item]}
          </option>
        ))}
      </select>
    </form>
  );
}
