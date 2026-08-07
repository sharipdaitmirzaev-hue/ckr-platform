import { cn } from "@/lib/utils";
import type { ChatMessageWithSender } from "@/lib/messages/queries";

type MessageBubbleProps = {
  message: ChatMessageWithSender;
  isOwn: boolean;
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "max-w-[85%] rounded-sm border px-3.5 py-2.5",
        isOwn
          ? "ml-auto border-accent/30 bg-accent-muted/40"
          : "mr-auto border-border bg-surface/70",
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
        {isOwn ? "Вы" : message.senderName || "Участник"}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
        {message.body}
      </p>
      <p className="mt-1 text-[11px] text-muted">
        {new Date(message.createdAt).toLocaleString("ru-RU")}
      </p>
    </div>
  );
}
