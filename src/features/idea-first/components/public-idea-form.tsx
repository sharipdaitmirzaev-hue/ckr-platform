"use client";

import { IDEA_FORM } from "@/config/idea-first";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

type Step = "form" | "thanks" | "contact";

export function PublicIdeaForm() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
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

  function submitIdea() {
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
      setRequestId(data.requestId || null);
      setSavedName(data.name || name);
      setStep("thanks");
    });
  }

  function submitContact() {
    if (!requestId) return;
    setError(null);
    startTransition(async () => {
      // claim token is in httpOnly cookie; server contact update needs token —
      // re-read via dedicated endpoint that uses cookie
      const res = await fetch("/api/idea/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email, telegram }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Не удалось сохранить контакт.");
        return;
      }
      setStep("thanks");
    });
  }

  if (step === "thanks" || step === "contact") {
    const title = IDEA_FORM.thanksTitle.replace("{name}", savedName || "друг");
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl text-foreground">{title}</h2>
          <p className="mt-2 text-muted">{IDEA_FORM.thanksBody}</p>
          <p className="mt-1 text-sm text-muted">{IDEA_FORM.thanksNext}</p>
        </div>

        {step === "contact" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">{IDEA_FORM.contactPrompt}</p>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Телефон"
              className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
            />
            <input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="Telegram"
              className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <button
              type="button"
              disabled={pending}
              onClick={submitContact}
              className="rounded-sm bg-accent px-4 py-2.5 text-sm text-white disabled:opacity-60"
            >
              Сохранить контакт
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => setStep("contact")}
              className="rounded-sm bg-accent px-4 py-2.5 text-sm text-white"
            >
              {IDEA_FORM.leaveContact}
            </button>
            <Link
              href={`/register?next=${encodeURIComponent("/dashboard/ckr-requests?claim=1")}`}
              className="rounded-sm border border-border px-4 py-2.5 text-center text-sm"
            >
              {IDEA_FORM.createCabinet}
            </Link>
            <button
              type="button"
              onClick={() => setStep("thanks")}
              className="rounded-sm px-4 py-2.5 text-sm text-muted"
            >
              {IDEA_FORM.contactOptional}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
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
        {pending ? "Отправляем…" : IDEA_FORM.submit}
      </button>
      <p className="text-xs text-muted">
        Регистрация не нужна. Лия не обязательна для отправки.
      </p>
    </form>
  );
}
