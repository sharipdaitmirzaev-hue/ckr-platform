"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ORGANIZATION_TYPES,
  organizationTypeLabels,
} from "@/config/partners";
import {
  createOrganizationAction,
  type PartnerActionState,
} from "@/features/partners/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: PartnerActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Создание…" : "Создать организацию"}
    </Button>
  );
}

export function CreateOrganizationForm() {
  const [state, action] = useFormState(createOrganizationAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="org-name" className="text-sm text-muted">
          Название
        </label>
        <Input id="org-name" name="name" required placeholder="ООО «…»" />
      </div>
      <div className="space-y-2">
        <label htmlFor="org-type" className="text-sm text-muted">
          Тип
        </label>
        <select
          id="org-type"
          name="type"
          defaultValue="company"
          className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {ORGANIZATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {organizationTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="org-region" className="text-sm text-muted">
            Регион
          </label>
          <Input id="org-region" name="region" />
        </div>
        <div className="space-y-2">
          <label htmlFor="org-city" className="text-sm text-muted">
            Город
          </label>
          <Input id="org-city" name="city" />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="org-website" className="text-sm text-muted">
          Сайт
        </label>
        <Input id="org-website" name="website" placeholder="https://" />
      </div>
      <div className="space-y-2">
        <label htmlFor="org-description" className="text-sm text-muted">
          Описание
        </label>
        <textarea
          id="org-description"
          name="description"
          rows={3}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
        />
      </div>
      <SubmitButton />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
