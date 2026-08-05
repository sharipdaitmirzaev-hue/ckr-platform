"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEAL_PARTICIPANT_ROLES,
  dealParticipantRoleLabels,
  dealTypeLabels,
} from "@/config/deals";
import {
  addDealParticipantAction,
  type DealActionState,
} from "@/features/deals/actions";
import type { DealWithNames } from "@/lib/deals/queries";
import { useState, useTransition } from "react";

type AddParticipantFormProps = {
  projectId: string;
  deals: DealWithNames[];
};

export function AddParticipantForm({
  projectId,
  deals,
}: AddParticipantFormProps) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<DealActionState>({});

  if (deals.length === 0) {
    return (
      <p className="text-sm text-muted">
        Сначала создайте сделку, чтобы добавить участников.
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const dealId = String(formData.get("dealId") || "");
        startTransition(async () => {
          const result = await addDealParticipantAction(
            dealId,
            projectId,
            formData,
          );
          setState(result);
          if (result.success) event.currentTarget.reset();
        });
      }}
    >
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
        Добавить участника
      </p>
      <select
        name="dealId"
        required
        className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
      >
        {deals.map((deal) => (
          <option key={deal.id} value={deal.id}>
            {dealTypeLabels[deal.dealType]} · {deal.status}
          </option>
        ))}
      </select>
      <Input name="userId" placeholder="UUID пользователя" required />
      <select
        name="role"
        defaultValue="partner"
        className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
      >
        {DEAL_PARTICIPANT_ROLES.map((role) => (
          <option key={role} value={role}>
            {dealParticipantRoleLabels[role]}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={pending}>
        {pending ? "Добавление…" : "Добавить"}
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
