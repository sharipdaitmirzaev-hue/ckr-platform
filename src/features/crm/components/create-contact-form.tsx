"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CRM_CONTACT_STATUSES,
  CRM_CONTACT_TYPES,
  crmContactStatusLabels,
  crmContactTypeLabels,
} from "@/config/crm";
import {
  createCrmContactAction,
  type CrmActionState,
} from "@/features/crm/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: CrmActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Создание…" : "Создать контакт"}
    </Button>
  );
}

export function CreateContactForm() {
  const [state, action] = useFormState(createCrmContactAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="contact-name" className="text-sm text-muted">
          Имя
        </label>
        <Input id="contact-name" name="name" required placeholder="Имя контакта" />
      </div>
      <div className="space-y-2">
        <label htmlFor="contact-company" className="text-sm text-muted">
          Компания
        </label>
        <Input id="contact-company" name="companyName" placeholder="ООО …" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="contact-email" className="text-sm text-muted">
            Email
          </label>
          <Input id="contact-email" name="email" type="email" />
        </div>
        <div className="space-y-2">
          <label htmlFor="contact-phone" className="text-sm text-muted">
            Телефон
          </label>
          <Input id="contact-phone" name="phone" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="contact-type" className="text-sm text-muted">
            Тип
          </label>
          <select
            id="contact-type"
            name="type"
            defaultValue="entrepreneur"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            {CRM_CONTACT_TYPES.map((type) => (
              <option key={type} value={type}>
                {crmContactTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="contact-status" className="text-sm text-muted">
            Статус
          </label>
          <select
            id="contact-status"
            name="status"
            defaultValue="new"
            className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          >
            {CRM_CONTACT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {crmContactStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="contact-source" className="text-sm text-muted">
          Источник
        </label>
        <Input
          id="contact-source"
          name="source"
          placeholder="Рекомендация, сайт, мероприятие…"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="contact-notes" className="text-sm text-muted">
          Заметки
        </label>
        <textarea
          id="contact-notes"
          name="notes"
          rows={2}
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
