"use client";

import { IDEA_FORM } from "@/config/idea-first";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

type Step = "form" | "contact" | "thanks";

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

  function goToContact() {
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
    setStep("contact");
  }

  function submitIdea(withContacts: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          name,
          idea,
          idempotencyKey,
          phone: withContacts ? phone : "",
          email: withContacts ? email : "",
          telegram: withContacts ? telegram : "",
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

  if (step === "contact") {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-xl text-foreground">
            {IDEA_FORM.contactTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {IDEA_FORM.contactPrompt}
          </p>
        </div>
        <label className="block text-sm">
          {IDEA_FORM.contactPhoneLabel}
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            autoComplete="tel"
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
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={pending}
            onClick={() => submitIdea(true)}
            className="rounded-sm bg-accent px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Отправляем…" : IDEA_FORM.contactSubmit}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submitIdea(false)}
            className="rounded-sm border border-border px-5 py-3 text-sm text-muted disabled:opacity-60"
          >
            {IDEA_FORM.contactSkip}
          </button>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => setStep("form")}
          className="text-sm text-muted hover:text-foreground"
        >
          ← Назад
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        goToContact();
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
          rows={8}
          maxLength={IDEA_FORM.maxIdeaLength}
          placeholder={IDEA_FORM.ideaPlaceholder}
          className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm leading-relaxed"
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {IDEA_FORM.submit}
      </button>
      <p className="text-xs text-muted">
        Регистрация не нужна. Контакт можно оставить на следующем шаге или
        пропустить.
      </p>
    </form>
  );
}
