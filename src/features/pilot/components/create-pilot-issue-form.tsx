"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PILOT_ISSUE_SEVERITIES,
  PILOT_ISSUE_STATUSES,
  pilotIssueSeverityLabels,
  pilotIssueStatusLabels,
} from "@/config/pilot";
import {
  createPilotIssueAction,
  type PilotActionState,
} from "@/features/pilot/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: PilotActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохранение…" : "Добавить проблему"}
    </Button>
  );
}

export function CreatePilotIssueForm() {
  const [state, action] = useFormState(createPilotIssueAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
        Новая проблема пилота
      </p>
      <Input name="title" placeholder="Заголовок" required minLength={3} />
      <textarea
        name="description"
        rows={3}
        placeholder="Описание"
        className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          name="severity"
          defaultValue="medium"
          className="h-11 rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {PILOT_ISSUE_SEVERITIES.map((severity) => (
            <option key={severity} value={severity}>
              {pilotIssueSeverityLabels[severity]}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue="open"
          className="h-11 rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {PILOT_ISSUE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {pilotIssueStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>
      <SubmitButton />
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
