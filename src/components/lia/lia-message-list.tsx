import { LiaResults } from "@/components/lia/lia-results";
import { ButtonLink } from "@/components/ui/button-link";
import { projectDraftToSearchParams } from "@/lib/lia/project-draft";
import type { LiaMessage } from "@/types/lia";
import { cn } from "@/lib/utils";

type LiaMessageListProps = {
  messages: LiaMessage[];
};

function renderContent(content: string) {
  // Простой рендер markdown-ссылок [title](/path)
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

export function LiaMessageList({ messages }: LiaMessageListProps) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted">
        Начните диалог или выберите быстрый сценарий. Лия подбирает объекты
        только из открытых каталогов ЦКР.
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
              <div className="mt-4">
                <ButtonLink
                  href={`/dashboard/projects/create?${projectDraftToSearchParams(projectDraft)}`}
                  size="sm"
                >
                  Перейти к созданию проекта
                </ButtonLink>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
