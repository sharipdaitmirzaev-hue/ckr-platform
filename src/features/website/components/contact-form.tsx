"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  submitContactFormAction,
  type ContactActionState,
} from "@/features/website/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ContactActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Отправка…" : "Отправить обращение"}
    </Button>
  );
}

export function ContactForm() {
  const [state, formAction] = useFormState(
    submitContactFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="contact-name" className="text-sm text-muted">
          Имя
        </label>
        <Input
          id="contact-name"
          name="name"
          required
          minLength={2}
          placeholder="Как к вам обращаться"
          autoComplete="name"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="contact-email" className="text-sm text-muted">
          Email
        </label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          required
          placeholder="you@company.ru"
          autoComplete="email"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="contact-topic" className="text-sm text-muted">
          Тема
        </label>
        <Input
          id="contact-topic"
          name="topic"
          placeholder="Партнёрство / услуги / пилот"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="contact-message" className="text-sm text-muted">
          Сообщение
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          rows={5}
          placeholder="Кратко опишите задачу или вопрос"
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
