import { LiaResults } from "@/components/lia/lia-results";
import { LiaProjectFlow } from "@/features/lia/components/lia-project-flow";
import type { LiaMessage } from "@/types/lia";
import type { CategoryRow } from "@/types/database";
import { cn } from "@/lib/utils";

type LiaMessageListProps = {
  messages: LiaMessage[];
  categories: CategoryRow[];
};

function renderContent(content: string) {
  const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) {
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    }
    return (
      <a
        key={index}
        href={match[2]}
        className="text-accent underline-offset-2 hover:underline"
      >
        {match[1]}
      </a>
    );
  });
}

export function LiaMessageList({ messages, categories }: LiaMessageListProps) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted">
        Начните с сценария «Помоги создать бизнес-проект» — Лия соберёт
        предварительный проект и предложит создать его после вашего
        подтверждения.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const results = message.metadata?.results || [];
        const projectDraft = message.metadata?.projectDraft;

        return (
          <li
            key={message.id}
            className={cn(
              "rounded-sm border px-4 py-3",
              isUser
                ? "ml-6 border-accent/30 bg-accent-muted/40"
                : "mr-6 border-border bg-surface/70",
            )}
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
              {isUser ? "Вы" : "Лия"}
            </p>
            <div className="mt-2 text-sm leading-relaxed text-foreground">
              {renderContent(message.content)}
            </div>
            {!isUser && results.length > 0 ? (
              <LiaResults results={results} />
            ) : null}
            {!isUser && projectDraft ? (
              <LiaProjectFlow draft={projectDraft} categories={categories} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
