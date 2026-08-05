"use client";

import { LiaMessageList } from "@/components/lia/lia-message-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LIA_DISCLAIMER, LIA_MAX_MESSAGE_LENGTH, LIA_SCENARIOS } from "@/config/lia";
import type { LiaChatResponse, LiaMessage, LiaScenarioId, LiaSession } from "@/types/lia";
import type { CategoryRow } from "@/types/database";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type LiaChatProps = {
  sessions: LiaSession[];
  activeSessionId: string | null;
  initialMessages: LiaMessage[];
  isAuthenticated: boolean;
  categories: CategoryRow[];
  projectId?: string | null;
  autoStartRealize?: boolean;
};

export function LiaChat({
  sessions,
  activeSessionId,
  initialMessages,
  isAuthenticated,
  categories,
  projectId = null,
  autoStartRealize = false,
}: LiaChatProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(activeSessionId);
  const [messages, setMessages] = useState<LiaMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    setSessionId(activeSessionId);
    setMessages(initialMessages);
  }, [activeSessionId, initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  useEffect(() => {
    if (
      !autoStartRealize ||
      !projectId ||
      !isAuthenticated ||
      autoStartedRef.current ||
      initialMessages.length > 0
    ) {
      return;
    }
    autoStartedRef.current = true;
    void sendMessage("Помоги реализовать проект", "realize_project");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartRealize, projectId, isAuthenticated]);

  async function sendMessage(message: string, scenario?: LiaScenarioId | null) {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/lia")}`);
      return;
    }

    const text = message.trim();
    if (!text) return;

    setError(null);
    const optimisticId = `tmp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        sessionId: sessionId || "pending",
        role: "user",
        content: text,
        metadata: scenario ? { scenario } : {},
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/lia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            message: text,
            scenario: scenario ?? null,
            projectId: projectId ?? null,
          }),
        });
        const data = (await response.json()) as LiaChatResponse & {
          error?: string;
        };

        if (!response.ok || !data.ok) {
          setError(data.error || "Не удалось получить ответ Лии.");
          setMessages((prev) => prev.filter((item) => item.id !== optimisticId));
          return;
        }

        setSessionId(data.sessionId);
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((item) => item.id !== optimisticId);
          return [
            ...withoutOptimistic,
            {
              id: `user-${data.assistantMessage.id}`,
              sessionId: data.sessionId,
              role: "user",
              content: text,
              metadata: scenario ? { scenario } : {},
              createdAt: new Date().toISOString(),
            },
            data.assistantMessage,
          ];
        });

        if (!activeSessionId || activeSessionId !== data.sessionId) {
          router.replace(`/lia?session=${data.sessionId}`);
          router.refresh();
        } else {
          router.refresh();
        }
      } catch {
        setError("Сеть недоступна. Попробуйте ещё раз.");
        setMessages((prev) => prev.filter((item) => item.id !== optimisticId));
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <Card variant="surface" className="h-fit space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            Диалоги
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setSessionId(null);
              setMessages([]);
              router.push("/lia");
            }}
          >
            Новый
          </Button>
        </div>
        {sessions.length === 0 ? (
          <p className="text-xs text-muted">Пока нет сохранённых диалогов.</p>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => {
              const active = session.id === sessionId;
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/lia?session=${session.id}`)}
                    className={
                      active
                        ? "w-full rounded-sm bg-accent-muted px-3 py-2 text-left text-sm text-accent"
                        : "w-full rounded-sm px-3 py-2 text-left text-sm text-muted hover:bg-foreground/5 hover:text-foreground"
                    }
                  >
                    <span className="line-clamp-2">{session.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="space-y-4">
        <Card variant="surface" className="space-y-3 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            Быстрые сценарии
          </p>
          <div className="flex flex-wrap gap-2">
            {LIA_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                disabled={pending}
                onClick={() => sendMessage(scenario.prompt, scenario.id)}
                className="rounded-sm border border-border px-3 py-2 text-left text-sm text-muted transition-colors hover:border-accent/40 hover:text-foreground disabled:opacity-60"
                title={scenario.description}
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </Card>

        <Card variant="surface" className="flex min-h-[420px] flex-col p-4 sm:p-5">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <LiaMessageList messages={messages} categories={categories} />
            {pending ? (
              <p className="text-sm text-muted">Лия готовит рекомендацию…</p>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <form
            className="mt-4 space-y-3 border-t border-border pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={3}
              maxLength={LIA_MAX_MESSAGE_LENGTH}
              placeholder={
                isAuthenticated
                  ? "Опишите задачу: регион, отрасль, что нужно…"
                  : "Войдите, чтобы начать диалог с Лией"
              }
              className="flex w-full rounded-sm border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-xl text-xs text-muted">{LIA_DISCLAIMER}</p>
              <Button type="submit" disabled={pending || !input.trim()}>
                {pending ? "Отправка…" : "Отправить"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
