"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEAL_STATUSES,
  DEAL_TYPES,
  dealStatusLabels,
  dealTypeLabels,
} from "@/config/deals";
import {
  createDealAction,
  type DealActionState,
} from "@/features/deals/actions";
import { useState, useTransition } from "react";

type CreateDealFormProps = {
  projectId: string;
};

export function CreateDealForm({ projectId }: CreateDealFormProps) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<DealActionState>({});

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await createDealAction(projectId, formData);
          setState(result);
          if (result.success) event.currentTarget.reset();
        });
      }}
    >
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
        Новая сделка
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          name="dealType"
          defaultValue="investment"
          className="h-11 rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {DEAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {dealTypeLabels[type]}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue="draft"
          className="h-11 rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {DEAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {dealStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="amount" type="number" min={0} placeholder="Сумма" />
        <Input name="currency" defaultValue="RUB" placeholder="Валюта" />
      </div>
      <Input
        name="partnerId"
        placeholder="ID партнёра (опционально, uuid профиля)"
      />
      <textarea
        name="description"
        rows={3}
        placeholder="Описание сделки"
        className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Создание…" : "Создать сделку"}
      </Button>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
    </form>
  );
}
