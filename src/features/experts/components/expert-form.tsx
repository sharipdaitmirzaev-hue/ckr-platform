"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EXPERT_SPECIALIZATIONS,
  EXPERT_STATUSES,
  expertSpecializationLabels,
  expertStatusDescriptions,
  expertStatusLabels,
} from "@/config/experts";
import {
  createExpertProfileAction,
  updateExpertProfileAction,
  type ExpertActionState,
} from "@/features/experts/actions";
import type { ExpertProfile } from "@/types";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ExpertActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохранение..." : label}
    </Button>
  );
}

type ExpertFormProps = {
  mode: "create" | "edit";
  expert?: ExpertProfile;
};

export function ExpertForm({ mode, expert }: ExpertFormProps) {
  const action =
    mode === "create" ? createExpertProfileAction : updateExpertProfileAction;
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="specialization" className="text-sm text-muted">
            Специализация
          </label>
          <select
            id="specialization"
            name="specialization"
            required
            defaultValue={expert?.specialization ?? "consultant"}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {EXPERT_SPECIALIZATIONS.map((item) => (
              <option key={item} value={item}>
                {expertSpecializationLabels[item]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="experienceYears" className="text-sm text-muted">
            Опыт, лет
          </label>
          <Input
            id="experienceYears"
            name="experienceYears"
            type="number"
            min={0}
            max={70}
            required
            defaultValue={expert?.experienceYears ?? 0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="headline" className="text-sm text-muted">
          Заголовок профиля
        </label>
        <Input
          id="headline"
          name="headline"
          required
          defaultValue={expert?.headline ?? ""}
          placeholder="Юрист по корпоративным сделкам и партнёрствам"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm text-muted">
          Опыт и компетенции
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={7}
          defaultValue={expert?.description ?? ""}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          placeholder="Опишите экспертизу, отрасли и формат работы с проектами ЦКР"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="services" className="text-sm text-muted">
          Услуги
        </label>
        <textarea
          id="services"
          name="services"
          required
          rows={4}
          defaultValue={expert?.services ?? ""}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          placeholder="Структурирование сделок, due diligence, договоры партнёрства…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="region" className="text-sm text-muted">
            Регион
          </label>
          <Input
            id="region"
            name="region"
            required
            defaultValue={expert?.region ?? ""}
            placeholder="Москва"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm text-muted">
            Статус публикации
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={expert?.status ?? "draft"}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {EXPERT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {expertStatusLabels[status]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">
            {expertStatusDescriptions[expert?.status ?? "draft"]}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        <SubmitButton
          label={mode === "create" ? "Создать профиль" : "Сохранить изменения"}
        />
      </div>
    </form>
  );
}
