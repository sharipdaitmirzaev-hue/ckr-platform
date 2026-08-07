"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { organizationMemberRoleLabels } from "@/config/partners";
import {
  addOrganizationMemberAction,
  type PartnerActionState,
} from "@/features/partners/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: PartnerActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Добавление…" : "Добавить"}
    </Button>
  );
}

export function AddMemberForm() {
  const [state, action] = useFormState(addOrganizationMemberAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="member-user-id" className="text-sm text-muted">
          User ID сотрудника
        </label>
        <Input
          id="member-user-id"
          name="userId"
          required
          placeholder="uuid профиля"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="member-role" className="text-sm text-muted">
          Роль
        </label>
        <select
          id="member-role"
          name="role"
          defaultValue="employee"
          className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          <option value="manager">
            {organizationMemberRoleLabels.manager}
          </option>
          <option value="employee">
            {organizationMemberRoleLabels.employee}
          </option>
        </select>
      </div>
      <SubmitButton />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
    </form>
  );
}
