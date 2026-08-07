"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CRM_ACTIVITY_TYPES,
  crmActivityTypeLabels,
} from "@/config/crm";
import {
  createCrmActivityAction,
  type CrmActionState,
} from "@/features/crm/actions";
import type { CrmContact, CrmLead } from "@/types";
import { useFormState, useFormStatus } from "react-dom";

const initialState: CrmActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Сохранение…" : "Добавить"}
    </Button>
  );
}

type CreateActivityFormProps = {
  contacts: CrmContact[];
  leads: CrmLead[];
  defaultLeadId?: string;
  defaultContactId?: string;
};

export function CreateActivityForm({
  contacts,
  leads,
  defaultLeadId,
  defaultContactId,
}: CreateActivityFormProps) {
  const [state, action] = useFormState(createCrmActivityAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="activity-type" className="text-sm text-muted">
          Тип
        </label>
        <select
          id="activity-type"
          name="type"
          defaultValue="comment"
          className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {CRM_ACTIVITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {crmActivityTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="activity-contact" className="text-sm text-muted">
            Контакт
          </label>
          <select
            id="activity-contact"
            name="contactId"
            defaultValue={defaultContactId ?? ""}
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            <option value="">—</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="activity-lead" className="text-sm text-muted">
            Лид
          </label>
          <select
            id="activity-lead"
            name="leadId"
            defaultValue={defaultLeadId ?? ""}
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            <option value="">—</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="activity-title" className="text-sm text-muted">
          Заголовок
        </label>
        <Input id="activity-title" name="title" placeholder="Кратко" />
      </div>
      <div className="space-y-2">
        <label htmlFor="activity-body" className="text-sm text-muted">
          Текст
        </label>
        <textarea
          id="activity-body"
          name="body"
          rows={3}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="activity-due" className="text-sm text-muted">
          Срок (для задачи)
        </label>
        <Input id="activity-due" name="dueAt" type="datetime-local" />
      </div>
      <SubmitButton />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
    </form>
  );
}
