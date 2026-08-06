"use client";

import { Button } from "@/components/ui/button";
import {
  requestPlanCheckoutAction,
  requestServiceCheckoutAction,
  type BillingActionState,
} from "@/features/billing/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: BillingActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Отправка…" : label}
    </Button>
  );
}

type PlanCheckoutFormProps = {
  planId: string;
  planName: string;
  price: number;
};

export function PlanCheckoutForm({
  planId,
  planName,
  price,
}: PlanCheckoutFormProps) {
  const [state, action] = useFormState(requestPlanCheckoutAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="planName" value={planName} />
      <input type="hidden" name="price" value={price} />
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor={`method-${planId}`}>
          Способ оплаты
        </label>
        <select
          id={`method-${planId}`}
          name="method"
          defaultValue="card"
          className="h-9 rounded-sm border border-border bg-surface px-2 text-sm"
        >
          <option value="card">Банковская карта</option>
          <option value="sbp">СБП</option>
          <option value="other">Другой способ</option>
        </select>
        <SubmitButton label="Запросить оформление" />
      </div>
      {state.error ? (
        <p className="text-sm text-red-300">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
    </form>
  );
}

type ServiceCheckoutFormProps = {
  serviceId: string;
  title: string;
  price: number;
};

export function ServiceCheckoutForm({
  serviceId,
  title,
  price,
}: ServiceCheckoutFormProps) {
  const [state, action] = useFormState(
    requestServiceCheckoutAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="price" value={price} />
      <SubmitButton label="Запросить услугу" />
      {state.error ? (
        <p className="text-sm text-red-300">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
    </form>
  );
}
