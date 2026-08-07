"use client";

import { Button } from "@/components/ui/button";
import {
  PARTNERSHIP_STATUSES,
  PARTNERSHIP_TYPES,
  partnershipStatusLabels,
  partnershipTypeLabels,
} from "@/config/partners";
import {
  createPartnershipAction,
  type PartnerActionState,
} from "@/features/partners/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: PartnerActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Создание…" : "Создать партнёрство"}
    </Button>
  );
}

export function CreatePartnershipForm() {
  const [state, action] = useFormState(createPartnershipAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="partnership-type" className="text-sm text-muted">
            Тип
          </label>
          <select
            id="partnership-type"
            name="type"
            defaultValue="strategic"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            {PARTNERSHIP_TYPES.map((type) => (
              <option key={type} value={type}>
                {partnershipTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="partnership-status" className="text-sm text-muted">
            Статус
          </label>
          <select
            id="partnership-status"
            name="status"
            defaultValue="pending"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            {PARTNERSHIP_STATUSES.map((status) => (
              <option key={status} value={status}>
                {partnershipStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="partnership-description" className="text-sm text-muted">
          Описание
        </label>
        <textarea
          id="partnership-description"
          name="description"
          rows={3}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
          placeholder="Чем организация полезна экосистеме ЦКР"
        />
      </div>
      <SubmitButton />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
    </form>
  );
}
