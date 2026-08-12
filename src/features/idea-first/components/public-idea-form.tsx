"use client";

import { IDEA_FORM } from "@/config/idea-first";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

type Step = "form" | "thanks";

export function PublicIdeaForm() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [pending, startTransition] = useTransition();
  const idempotencyKey = useMemo(
    () =>
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `idea-${Date.now()}`,
    [],
  );

  const hasContact =
    phone.trim().length > 0 ||
    email.trim().length > 0 ||
    telegram.trim().length > 0;

  function submitIdea() {
    setError(null);
    const trimmedName = name.trim();
    const trimmedIdea = idea.trim();
    if (trimmedName.length < IDEA_FORM.minNameLength) {
      setError("Укажите имя.");
      return;
    }
    if (trimmedIdea.length < IDEA_FORM.minIdeaLength) {
      setError("Расскажите идею чуть подробнее — своими словами.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          name,
          idea,
          idempotencyKey,
          phone,
          email,
          telegram,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        requestId?: string;
        name?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Не удалось отправить.");
        return;
      }
      setSavedName(data.name || name);
      setStep("thanks");
    });
  }

  if (step === "thanks") {
    const title = IDEA_FORM.thanksTitle.replace("{name}", savedName || "друг");
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl text-foreground">{title}</h2>
          <p className="mt-3 text-muted">{IDEA_FORM.thanksBody}</p>
          {hasContact ? (
            <p className="mt-2 text-sm text-muted">
              Мы свяжемся с вами по оставленному контакту.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Контакт не указан. Создайте аккаунт или напишите позже — так
              проще получить ответ ЦКР.
            </p>
          )}
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {IDEA_FORM.thanksNext}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={`/register?next=${encodeURIComponent("/dashboard?claim=1")}`}
            className="rounded-sm bg-accent px-4 py-2.5 text-center text-sm font-medium text-white"
          >
            {IDEA_FORM.createCabinet}
          </Link>
          <Link
            href="/"
            className="rounded-sm border border-border px-4 py-2.5 text-center text-sm text-muted"
          >
            {IDEA_FORM.doLater}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        submitIdea();
      }}
    >
      <label className="block text-sm">
        {IDEA_FORM.nameLabel}
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          autoComplete="name"
        />
      </label>

      <label className="block text-sm">
        {IDEA_FORM.ideaLabel}
        <textarea
          required
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={7}
          maxLength={IDEA_FORM.maxIdeaLength}
          placeholder={IDEA_FORM.ideaPlaceholder}
          className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm leading-relaxed"
        />
      </label>

      <fieldset className="space-y-3 border-t border-border pt-5">
        <legend className="font-display text-lg text-foreground">
          {IDEA_FORM.contactTitle}
        </legend>
        <p className="text-sm leading-relaxed text-muted">
          {IDEA_FORM.contactPrompt}
        </p>
        <label className="block text-sm">
          {IDEA_FORM.contactPhoneLabel}
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            autoComplete="tel"
            placeholder="+7 …"
            className="mt-1 h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          {IDEA_FORM.contactEmailLabel}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            className="mt-1 h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          {IDEA_FORM.contactTelegramLabel}
          <input
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@username"
            className="mt-1 h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          />
        </label>
        <p className="text-xs text-muted">{IDEA_FORM.contactHint}</p>
      </fieldset>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Отправляем…" : IDEA_FORM.submit}
      </button>
      <p className="text-xs text-muted">
        Регистрация не нужна. Достаточно имени, идеи и любого удобного контакта.
      </p>
    </form>
  );
}
