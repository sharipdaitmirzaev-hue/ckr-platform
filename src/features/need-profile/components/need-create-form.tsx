"use client";

import {
  createNeedProfileAction,
  type NeedActionState,
} from "@/features/need-profile/actions";
import { NEED_ONBOARDING_CARDS } from "@/config/need-intents";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

const initial: NeedActionState = {};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      Сохранить потребность
    </button>
  );
}

export function NeedCreateForm({
  defaultIntent,
}: {
  defaultIntent?: string;
}) {
  const [intent, setIntent] = useState(defaultIntent || "");
  const [state, action] = useFormState(createNeedProfileAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <p className="text-sm text-foreground">Тип потребности</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {NEED_ONBOARDING_CARDS.map((card) => (
            <label
              key={card.intentType}
              className={`cursor-pointer rounded-sm border px-3 py-2 text-sm ${
                intent === card.intentType
                  ? "border-accent text-accent"
                  : "border-border text-foreground"
              }`}
            >
              <input
                type="radio"
                name="intentType"
                value={card.intentType}
                checked={intent === card.intentType}
                onChange={() => setIntent(card.intentType)}
                className="sr-only"
                required
              />
              {card.label}
            </label>
          ))}
        </div>
      </div>

      <label className="block text-sm">
        Название
        <input
          name="title"
          className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          placeholder="Кратко"
        />
      </label>
      <label className="block text-sm">
        Описание
        <textarea
          name="description"
          rows={3}
          className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        Бюджет max, ₽
        <input
          name="budgetMax"
          type="number"
          min={0}
          className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        Регионы (через запятую)
        <input
          name="regions"
          className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          placeholder="Дагестан, Ставропольский край"
        />
      </label>
      <label className="block text-sm">
        Отрасли (через запятую)
        <input
          name="industries"
          className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          placeholder="manufacturing"
        />
      </label>
      <label className="block text-sm">
        Видимость
        <select
          name="visibility"
          defaultValue="CKR_ONLY"
          className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="PRIVATE">PRIVATE</option>
          <option value="CKR_ONLY">CKR_ONLY</option>
          <option value="PUBLIC">PUBLIC</option>
        </select>
      </label>
      <input type="hidden" name="status" value="ACTIVE" />
      <input type="hidden" name="ownerType" value="user" />

      {state.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}
      <SubmitButton disabled={!intent} />
    </form>
  );
}
