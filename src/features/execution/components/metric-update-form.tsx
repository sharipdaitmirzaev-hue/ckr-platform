"use client";

import { updateProjectMetricAction } from "@/features/execution/actions";
import { useTransition } from "react";

type MetricUpdateFormProps = {
  projectId: string;
  metricId: string;
  currentValue: number;
};

export function MetricUpdateForm({
  projectId,
  metricId,
  currentValue,
}: MetricUpdateFormProps) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-2 flex items-center gap-2"
      action={(formData) => {
        startTransition(async () => {
          await updateProjectMetricAction(projectId, metricId, formData);
        });
      }}
    >
      <input
        type="number"
        name="currentValue"
        step="any"
        defaultValue={currentValue}
        className="w-24 rounded-sm border border-border bg-background px-2 py-1 text-xs"
        aria-label="Текущее значение KPI"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-accent underline-offset-2 hover:underline disabled:opacity-50"
      >
        {pending ? "…" : "Обновить"}
      </button>
    </form>
  );
}
