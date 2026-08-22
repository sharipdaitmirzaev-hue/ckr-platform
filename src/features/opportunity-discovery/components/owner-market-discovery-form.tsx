"use client";

import { runMarketDiscoveryAction } from "@/features/opportunity-discovery/actions";
import { DISCOVERY_SOURCE_CATEGORIES } from "@/lib/opportunity-discovery/types";
import { useFormState, useFormStatus } from "react-dom";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-accent px-4 py-2 text-sm text-white disabled:opacity-60"
    >
      {pending ? "Ищем…" : "Найти возможности"}
    </button>
  );
}

const INTENT_OPTIONS = [
  { value: "", label: "— не задано —" },
  { value: "INVEST", label: "Инвестировать / проекты" },
  { value: "SEEK_INVESTMENT", label: "Ищу инвестиции" },
  { value: "BUY_BUSINESS", label: "Купить бизнес" },
  { value: "SEEK_BUYER", label: "Найти покупателя / спрос" },
  { value: "BUY_PROPERTY", label: "Недвижимость / земля" },
  { value: "SEEK_SUPPORT", label: "Господдержка" },
  { value: "SEEK_SUPPLIER", label: "Поставщики" },
  { value: "SEEK_PARTNER", label: "Партнёры" },
];

export function OwnerMarketDiscoveryForm() {
  const [state, action] = useFormState(runMarketDiscoveryAction, {});

  return (
    <form action={action} className="space-y-4 rounded-sm border border-border p-4">
      <div className="space-y-1">
        <label className="text-sm text-foreground" htmlFor="freeText">
          Что искать?
        </label>
        <textarea
          id="freeText"
          name="freeText"
          rows={3}
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
          placeholder="Например: инвестиционные проекты Дагестан / СКФО до 30 млн ₽, действущий бизнес или понятный проект"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm" htmlFor="intent">
            Intent
          </label>
          <select
            id="intent"
            name="intent"
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
            defaultValue="INVEST"
          >
            {INTENT_OPTIONS.map((o) => (
              <option key={o.value || "empty"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="category">
            Категория
          </label>
          <select
            id="category"
            name="category"
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
            defaultValue="INVESTMENT_PROJECT"
          >
            <option value="">— любая —</option>
            {DISCOVERY_SOURCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="region">
            Регион
          </label>
          <input
            id="region"
            name="region"
            defaultValue="Дагестан"
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="industry">
            Отрасль
          </label>
          <input
            id="industry"
            name="industry"
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
            placeholder="необязательно"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="budgetMax">
            Бюджет до, ₽
          </label>
          <input
            id="budgetMax"
            name="budgetMax"
            type="number"
            defaultValue={30000000}
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="expandExternal" value="1" />
          Расширить поиск (интернет)
        </label>
      </div>

      <Submit />

      <p className="text-xs text-muted">
        Ручной поиск. Не Scheduler. Результаты только для owner review — без
        автопубликации и outreach.
      </p>

      {state.error ? <p className="text-sm text-amber-800">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-foreground">{state.success}</p>
      ) : null}
      {state.summary ? (
        <pre className="overflow-auto whitespace-pre-wrap rounded-sm bg-surface p-3 text-xs text-muted">
          {state.summary}
        </pre>
      ) : null}
    </form>
  );
}
