"use client";

import {
  PRODUCT_IMPROVEMENT_PRIORITIES,
  productImprovementPriorityLabels,
  type ProductImprovementPriority,
} from "@/config/improvements";
import { updateProductImprovementPriorityAction } from "@/features/improvements/actions";

type Props = {
  id: string;
  priority: ProductImprovementPriority;
};

export function ImprovementPriorityForm({ id, priority }: Props) {
  return (
    <form
      action={updateProductImprovementPriorityAction}
      className="inline-flex"
    >
      <input type="hidden" name="id" value={id} />
      <select
        name="priority"
        defaultValue={priority}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-sm border border-border bg-surface px-2 text-xs"
      >
        {PRODUCT_IMPROVEMENT_PRIORITIES.map((item) => (
          <option key={item} value={item}>
            {productImprovementPriorityLabels[item]}
          </option>
        ))}
      </select>
    </form>
  );
}
