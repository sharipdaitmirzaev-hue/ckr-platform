import { ChatList } from "@/components/messages/chat-list";
import { ChatWindow } from "@/components/messages/chat-window";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getConversationForUser,
  listMessages,
  listMyConversations,
} from "@/lib/messages/queries";
import { getProjectById } from "@/lib/projects/queries";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Сообщения" };
export const dynamic = "force-dynamic";

type MessagesPageProps = {
  searchParams?: { c?: string };
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/messages");

  const conversations = await listMyConversations(current.user.id);
  const activeId =
    searchParams?.c ||
    conversations[0]?.id ||
    null;

  const conversation =
    activeId
      ? await getConversationForUser(activeId, current.user.id)
      : null;

  const messages =
    conversation
      ? await listMessages(conversation.id)
      : [];

  const project =
    conversation?.projectId
      ? await getProjectById(conversation.projectId)
      : null;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Коммуникации"
        title="Сообщения"
        description="Диалоги по принятым заявкам и проектам. Доступны только ваши переписки."
      />

      <Card variant="surface" className="overflow-hidden">
        <div className="grid min-h-[520px] lg:grid-cols-[280px_1fr]">
          <div className="border-b border-border lg:border-b-0 lg:border-r">
            <p className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-muted">
              Диалоги
            </p>
            <ChatList
              conversations={conversations}
              activeId={conversation?.id ?? activeId}
            />
          </div>
          <div>
            {conversation ? (
              <ChatWindow
                conversation={conversation}
                messages={messages}
                currentUserId={current.user.id}
                projectTitle={project?.title ?? null}
              />
            ) : (
              <div className="flex h-full min-h-[420px] items-center justify-center p-6">
                <p className="max-w-sm text-center text-sm text-muted">
                  Выберите диалог или дождитесь принятия заявки — после этого
                  здесь появится переписка.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
