import type { ConversationListItem } from "@/lib/messages/queries";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ChatListProps = {
  conversations: ConversationListItem[];
  activeId?: string | null;
};

export function ChatList({ conversations, activeId }: ChatListProps) {
  if (conversations.length === 0) {
    return (
      <p className="p-4 text-sm text-muted">
        Диалогов пока нет. Они появляются после принятия заявки.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {conversations.map((item) => {
        const active = item.id === activeId;
        return (
          <li key={item.id}>
            <Link
              href={`/messages?c=${item.id}`}
              className={cn(
                "block px-4 py-3 transition-colors",
                active
                  ? "bg-accent-muted/50"
                  : "hover:bg-foreground/5",
              )}
            >
              <p className="text-sm font-medium text-foreground">
                {item.peerName || item.title}
              </p>
              {item.projectTitle ? (
                <p className="mt-0.5 text-xs text-accent">{item.projectTitle}</p>
              ) : null}
              <p className="mt-1 line-clamp-2 text-xs text-muted">
                {item.lastMessage || "Нет сообщений"}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
