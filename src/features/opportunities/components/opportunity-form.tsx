"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  OPPORTUNITY_CURRENCIES,
  OPPORTUNITY_STATUSES,
  opportunityStatusDescriptions,
  opportunityStatusLabels,
  opportunityTypeLabels,
} from "@/config/opportunities";
import {
  createOpportunityAction,
  updateOpportunityAction,
  type OpportunityActionState,
} from "@/features/opportunities/actions";
import type { Opportunity } from "@/types";
import type { OpportunityCategoryRow } from "@/types/database";
import { useFormState, useFormStatus } from "react-dom";

const initialState: OpportunityActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохранение..." : label}
    </Button>
  );
}

type OpportunityFormProps = {
  mode: "create" | "edit";
  categories: OpportunityCategoryRow[];
  opportunity?: Opportunity;
};

export function OpportunityForm({
  mode,
  categories,
  opportunity,
}: OpportunityFormProps) {
  const action =
    mode === "create" ? createOpportunityAction : updateOpportunityAction;
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && opportunity ? (
        <input type="hidden" name="opportunityId" value={opportunity.id} />
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-sm border border-danger/40 bg-danger-muted px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          role="status"
          className="rounded-sm border border-accent/30 bg-accent-muted px-3 py-2 text-sm text-accent"
        >
          {state.success}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm text-muted">
          Название возможности
        </label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={opportunity?.title ?? ""}
          placeholder="Например: Участок под производство"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm text-muted">
          Описание
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={8}
          defaultValue={opportunity?.description ?? ""}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          placeholder="Что предлагаете, условия, для каких проектов подходит"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm text-muted">
            Тип
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue={opportunity?.type ?? ""}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            <option value="" disabled>
              Выберите тип
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm text-muted">
            Статус публикации
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={opportunity?.status ?? "draft"}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {OPPORTUNITY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {opportunityStatusLabels[status]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">
            {opportunityStatusDescriptions[opportunity?.status ?? "draft"]}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm text-muted">
            Город
          </label>
          <Input
            id="city"
            name="city"
            required
            defaultValue={opportunity?.city ?? ""}
            placeholder="Казань"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="region" className="text-sm text-muted">
            Регион
          </label>
          <Input
            id="region"
            name="region"
            required
            defaultValue={opportunity?.region ?? ""}
            placeholder="Республика Татарстан"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="price" className="text-sm text-muted">
            Стоимость (необязательно)
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step="1000"
            defaultValue={
              opportunity?.price === null || opportunity?.price === undefined
                ? ""
                : opportunity.price
            }
            placeholder="Оставьте пустым — «по запросу»"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="currency" className="text-sm text-muted">
            Валюта
          </label>
          <select
            id="currency"
            name="currency"
            required
            defaultValue={opportunity?.currency ?? "RUB"}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {OPPORTUNITY_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted">
          Справочник типов пуст. Типы по умолчанию:{" "}
          {Object.values(opportunityTypeLabels).join(", ")}.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        <SubmitButton
          label={
            mode === "create" ? "Создать возможность" : "Сохранить изменения"
          }
        />
      </div>
    </form>
  );
}
