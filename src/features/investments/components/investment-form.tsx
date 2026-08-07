"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  INVESTMENT_CURRENCIES,
  INVESTMENT_DIRECTIONS,
  INVESTMENT_OFFER_STATUSES,
  INVESTMENT_TYPES,
  investmentStatusDescriptions,
  investmentStatusLabels,
  investmentTypeLabels,
} from "@/config/investments";
import {
  createInvestmentOfferAction,
  updateInvestmentOfferAction,
  type InvestmentActionState,
} from "@/features/investments/actions";
import type { InvestmentOffer } from "@/types";
import { useFormState, useFormStatus } from "react-dom";

const initialState: InvestmentActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохранение..." : label}
    </Button>
  );
}

type InvestmentFormProps = {
  mode: "create" | "edit";
  offer?: InvestmentOffer;
};

export function InvestmentForm({ mode, offer }: InvestmentFormProps) {
  const action =
    mode === "create"
      ? createInvestmentOfferAction
      : updateInvestmentOfferAction;
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && offer ? (
        <input type="hidden" name="offerId" value={offer.id} />
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
          Название предложения
        </label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={offer?.title ?? ""}
          placeholder="Например: Инвестиции в производство до 30 млн ₽"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm text-muted">
          Описание интересов
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={7}
          defaultValue={offer?.description ?? ""}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          placeholder="Критерии проектов, ожидания по участию, горизонт инвестиций"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="amountMin" className="text-sm text-muted">
            Сумма от
          </label>
          <Input
            id="amountMin"
            name="amountMin"
            type="number"
            min={0}
            step="100000"
            required
            defaultValue={offer?.amountMin ?? ""}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="amountMax" className="text-sm text-muted">
            Сумма до
          </label>
          <Input
            id="amountMax"
            name="amountMax"
            type="number"
            min={0}
            step="100000"
            required
            defaultValue={offer?.amountMax ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="currency" className="text-sm text-muted">
            Валюта
          </label>
          <select
            id="currency"
            name="currency"
            required
            defaultValue={offer?.currency ?? "RUB"}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {INVESTMENT_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="investmentType" className="text-sm text-muted">
            Тип участия
          </label>
          <select
            id="investmentType"
            name="investmentType"
            required
            defaultValue={offer?.investmentType ?? "equity"}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {INVESTMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {investmentTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="regions" className="text-sm text-muted">
          Регионы (через запятую)
        </label>
        <Input
          id="regions"
          name="regions"
          required
          defaultValue={offer?.regions.join(", ") ?? ""}
          placeholder="Москва, Центральный ФО"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm text-muted">Направления</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {INVESTMENT_DIRECTIONS.map((direction) => (
            <label
              key={direction.slug}
              className="flex cursor-pointer items-center gap-2 rounded-sm border border-border px-3 py-2.5 text-sm text-foreground has-[:checked]:border-accent/60 has-[:checked]:bg-accent-muted"
            >
              <input
                type="checkbox"
                name="categories"
                value={direction.slug}
                defaultChecked={offer?.categories.includes(direction.slug)}
                className="accent-[var(--ckr-accent)]"
              />
              {direction.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="status" className="text-sm text-muted">
          Статус
        </label>
        <select
          id="status"
          name="status"
          required
          defaultValue={offer?.status ?? "draft"}
          className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
        >
          {INVESTMENT_OFFER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {investmentStatusLabels[status]}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted">
          {investmentStatusDescriptions[offer?.status ?? "draft"]}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        <SubmitButton
          label={
            mode === "create" ? "Создать предложение" : "Сохранить изменения"
          }
        />
      </div>
    </form>
  );
}
