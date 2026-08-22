"use client";

import {
  ownerSeedCompanyAction,
  type OwnerCompanyActionState,
} from "@/features/company-intelligence/owner-actions";
import { ORGANIZATION_TYPES, organizationTypeLabels } from "@/config/partners";
import { useFormState, useFormStatus } from "react-dom";

const initial: OwnerCompanyActionState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-accent px-3 py-2 text-sm text-white disabled:opacity-50"
    >
      {pending ? "Сохранение…" : "Добавить компанию"}
    </button>
  );
}

export function OwnerCompanySeedForm() {
  const [state, action] = useFormState(ownerSeedCompanyAction, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input
        name="name"
        required
        placeholder="Название *"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
      />
      <select
        name="type"
        defaultValue="company"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
      >
        {ORGANIZATION_TYPES.map((t) => (
          <option key={t} value={t}>
            {organizationTypeLabels[t]}
          </option>
        ))}
      </select>
      <input
        name="region"
        defaultValue="Дагестан"
        placeholder="Регион"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
      />
      <input
        name="city"
        placeholder="Город"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
      />
      <input
        name="industry"
        placeholder="Отрасль (beverage / food / manufacturing…)"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
      />
      <input
        name="website"
        placeholder="Сайт https://"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
      />
      <input
        name="sourceUrl"
        placeholder="Source URL (provenance) *"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm sm:col-span-2"
      />
      <input
        name="sourceLabel"
        placeholder="Source label (official site / portal…)"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
      />
      <input
        name="legalName"
        placeholder="Юр. название (или пусто = UNKNOWN)"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
      />
      <input
        name="inn"
        placeholder="ИНН (только если известен)"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
      />
      <input
        name="ogrn"
        placeholder="ОГРН (только если известен)"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
      />
      <input
        name="offersSummary"
        placeholder="Что предлагает"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm sm:col-span-2"
      />
      <input
        name="seeksSummary"
        placeholder="Что ищет"
        className="h-10 rounded-sm border border-border bg-surface px-3 text-sm sm:col-span-2"
      />
      <textarea
        name="description"
        placeholder="Описание"
        rows={3}
        className="rounded-sm border border-border bg-surface px-3 py-2 text-sm sm:col-span-2"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="markVerified" /> Mark verified (listed)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="bridgeGraph" defaultChecked /> Bridge → Graph
        COMPANY
      </label>
      <div className="sm:col-span-2">
        <Submit />
        {state.error ? (
          <p className="mt-2 text-sm text-red-600">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="mt-2 text-sm text-muted">
            {state.success}{" "}
            {state.organizationId ? (
              <a
                href={`/organizations/${state.organizationId}`}
                className="text-accent hover:underline"
              >
                открыть
              </a>
            ) : null}
          </p>
        ) : null}
      </div>
    </form>
  );
}
