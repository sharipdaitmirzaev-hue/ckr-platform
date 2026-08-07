"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createOrgInvestmentAction,
  createOrgOpportunityAction,
  createOrgProjectAction,
  type PartnerActionState,
} from "@/features/partners/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: PartnerActionState = {};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Создание…" : label}
    </Button>
  );
}

function FormMessage({ state }: { state: PartnerActionState }) {
  if (state.error) return <p className="text-sm text-danger">{state.error}</p>;
  if (state.success) return <p className="text-sm text-accent">{state.success}</p>;
  return null;
}

export function CreateOrgProjectForm() {
  const [state, action] = useFormState(createOrgProjectAction, initialState);
  return (
    <form action={action} className="space-y-3">
      <Input name="title" required placeholder="Название проекта" />
      <Input name="category" placeholder="Категория (it, production…)" />
      <Input name="region" placeholder="Регион" />
      <textarea
        name="summary"
        rows={2}
        placeholder="Кратко"
        className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
      />
      <textarea
        name="description"
        rows={3}
        placeholder="Описание"
        className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
      />
      <Submit label="Создать проект" />
      <FormMessage state={state} />
    </form>
  );
}

export function CreateOrgOpportunityForm() {
  const [state, action] = useFormState(
    createOrgOpportunityAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-3">
      <Input name="title" required placeholder="Название возможности" />
      <select
        name="type"
        defaultValue="service"
        className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
      >
        <option value="service">Услуга</option>
        <option value="partner">Партнёрство</option>
        <option value="equipment">Оборудование</option>
        <option value="technology">Технология</option>
        <option value="premises">Помещение</option>
        <option value="land">Земля</option>
        <option value="ready_business">Готовый бизнес</option>
      </select>
      <Input name="region" placeholder="Регион" />
      <Input name="city" placeholder="Город" />
      <textarea
        name="description"
        rows={3}
        placeholder="Описание предложения"
        className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
      />
      <Submit label="Создать возможность" />
      <FormMessage state={state} />
    </form>
  );
}

export function CreateOrgInvestmentForm() {
  const [state, action] = useFormState(createOrgInvestmentAction, initialState);
  return (
    <form action={action} className="space-y-3">
      <Input name="title" required placeholder="Инвестиционное предложение" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="amountMin" type="number" placeholder="Сумма от" />
        <Input name="amountMax" type="number" placeholder="Сумма до" />
      </div>
      <textarea
        name="description"
        rows={3}
        placeholder="Условия участия капитала"
        className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
      />
      <Submit label="Создать инвестицию" />
      <FormMessage state={state} />
    </form>
  );
}
