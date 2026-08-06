"use client";

import { Button } from "@/components/ui/button";
import {
  CRM_CONVERSION_TARGETS,
  crmConversionTargetLabels,
} from "@/config/crm";
import {
  convertCrmLeadAction,
  type CrmActionState,
} from "@/features/crm/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: CrmActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Конвертация…" : "Конвертировать"}
    </Button>
  );
}

type ConvertLeadFormProps = {
  leadId: string;
};

export function ConvertLeadForm({ leadId }: ConvertLeadFormProps) {
  const [state, action] = useFormState(convertCrmLeadAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="space-y-2">
        <label htmlFor="convert-target" className="text-sm text-muted">
          Цель конвертации
        </label>
        <select
          id="convert-target"
          name="target"
          defaultValue="project"
          className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {CRM_CONVERSION_TARGETS.map((target) => (
            <option key={target} value={target}>
              Лид → {crmConversionTargetLabels[target]}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          name="confirm"
          className="mt-1 accent-[var(--ckr-accent)]"
        />
        <span>
          Подтверждаю конвертацию от имени администратора ЦКР. Будет создана
          сущность или приглашение; действие необратимо без ручной правки.
        </span>
      </label>
      <SubmitButton />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <div className="space-y-1 text-sm text-accent">
          <p>{state.success}</p>
          {state.inviteCode ? (
            <p className="font-mono text-foreground">
              Код: {state.inviteCode}
            </p>
          ) : null}
          {state.entityId ? (
            <p className="font-mono text-xs text-muted">ID: {state.entityId}</p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
