"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CRM_LEAD_STAGES, crmLeadStageLabels } from "@/config/crm";
import {
  createCrmLeadAction,
  type CrmActionState,
} from "@/features/crm/actions";
import type { CrmContact } from "@/types";
import { useFormState, useFormStatus } from "react-dom";

const initialState: CrmActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Создание…" : "Создать лид"}
    </Button>
  );
}

type CreateLeadFormProps = {
  contacts: CrmContact[];
};

export function CreateLeadForm({ contacts }: CreateLeadFormProps) {
  const [state, action] = useFormState(createCrmLeadAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="lead-contact" className="text-sm text-muted">
          Контакт
        </label>
        <select
          id="lead-contact"
          name="contactId"
          required
          defaultValue=""
          className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          <option value="" disabled>
            Выберите контакт
          </option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
              {contact.companyName ? ` · ${contact.companyName}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="lead-title" className="text-sm text-muted">
          Название
        </label>
        <Input
          id="lead-title"
          name="title"
          required
          placeholder="Потенциальный проект / сделка"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="lead-category" className="text-sm text-muted">
          Категория
        </label>
        <Input
          id="lead-category"
          name="category"
          placeholder="production, it, tourism…"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="lead-stage" className="text-sm text-muted">
          Этап
        </label>
        <select
          id="lead-stage"
          name="stage"
          defaultValue="new"
          className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {CRM_LEAD_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {crmLeadStageLabels[stage]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="lead-description" className="text-sm text-muted">
          Описание
        </label>
        <textarea
          id="lead-description"
          name="description"
          rows={3}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
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
