"use client";

import { MessageBubble } from "@/components/messages/message-bubble";
import { Button } from "@/components/ui/button";
import {
  sendMessageAction,
  type MessageActionState,
} from "@/features/messages/actions";
import type { Conversation } from "@/lib/messages/mappers";
import type { ChatMessageWithSender } from "@/lib/messages/queries";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type ChatWindowProps = {
  conversation: Conversation;
  messages: ChatMessageWithSender[];
  currentUserId: string;
  projectTitle?: string | null;
};

export function ChatWindow({
  conversation,
  messages,
  currentUserId,
  projectTitle,
}: ChatWindowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<MessageActionState>({});
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="border-b border-border px-4 py-3">
        <p className="font-display text-lg text-foreground">
          {conversation.title}
        </p>
        {projectTitle || conversation.projectId ? (
          <p className="mt-1 text-sm text-muted">
            Проект:{" "}
            {conversation.projectId ? (
              <Link
                href={`/dashboard/projects/${conversation.projectId}/workspace`}
                className="text-accent hover:underline"
              >
                {projectTitle || "Кабинет"}
              </Link>
            ) : (
              projectTitle
            )}
          </p>
        ) : null}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">
            Начните переписку — напишите первое сообщение.
          </p>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="space-y-2 border-t border-border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);
          startTransition(async () => {
            const result = await sendMessageAction(conversation.id, formData);
            setState(result);
            if (result.success) {
              form.reset();
              router.refresh();
            }
          });
        }}
      >
        <textarea
          name="body"
          rows={3}
          maxLength={4000}
          required
          placeholder="Сообщение…"
          className="flex w-full rounded-sm border border-border bg-background px-3.5 py-2.5 text-sm"
        />
        <div className="flex items-center justify-between gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Отправка…" : "Отправить"}
          </Button>
          {state.error ? (
            <p className="text-sm text-danger" role="alert">
              {state.error}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
