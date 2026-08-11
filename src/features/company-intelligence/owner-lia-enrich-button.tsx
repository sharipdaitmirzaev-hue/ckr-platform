"use client";

import {
  ownerLiaEnrichCompanyDraftAction,
  type OwnerCompanyActionState,
} from "@/features/company-intelligence/owner-actions";
import { useFormState, useFormStatus } from "react-dom";

const initial: OwnerCompanyActionState = {};

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 text-xs text-accent hover:underline disabled:opacity-50"
    >
      {pending ? "…" : "Обновить данные компании через Лию (draft)"}
    </button>
  );
}

export function OwnerLiaEnrichButton({
  organizationId,
}: {
  organizationId: string;
}) {
  const [state, action] = useFormState(
    ownerLiaEnrichCompanyDraftAction,
    initial,
  );
  return (
    <form action={action}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <Btn />
      {state.error ? (
        <span className="ml-2 text-xs text-red-600">{state.error}</span>
      ) : null}
      {state.success ? (
        <span className="ml-2 text-xs text-muted">{state.success}</span>
      ) : null}
    </form>
  );
}
