import { Badge } from "@/components/ui/badge";
import { FeedCardActions } from "@/features/personalized-feed/components/feed-card-actions";
import type { FeedRecommendation } from "@/types/personalized-feed";

function money(n: number | null | undefined): string {
  if (n == null) return "Цена не подтверждена";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)} млн ₽`;
  }
  return `${Math.round(n).toLocaleString("ru-RU")} ₽`;
}

export function FeedRecommendationCard({
  item,
}: {
  item: FeedRecommendation;
}) {
  const c = item.candidate;
  return (
    <article className="space-y-3 border-b border-border py-5 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">{c.sourceLabel}</Badge>
            <Badge>{c.itemType}</Badge>
            <Badge>score {item.score}</Badge>
          </div>
          <h3 className="font-display text-xl text-foreground">{c.title}</h3>
          <p className="text-sm text-muted">
            {[c.region || "Регион не указан", c.industry || null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="text-foreground">
            {c.priceKnown ? money(c.price) : "Цена не подтверждена"}
          </p>
          <p className="text-xs text-muted">
            {c.updatedAt
              ? `обновлено ${new Date(c.updatedAt).toLocaleDateString("ru-RU")}`
              : "свежесть неизвестна"}
          </p>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <p className="font-medium text-foreground">Почему это вам</p>
        <p className="text-muted">{item.explanation.why}</p>
        {item.explanation.notes.length ? (
          <ul className="list-disc pl-5 text-xs text-muted">
            {item.explanation.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span>
          Подтверждено:{" "}
          {c.confirmedFields.length ? c.confirmedFields.join(", ") : "—"}
        </span>
        <span>
          Неизвестно:{" "}
          {c.unknownFields.length ? c.unknownFields.join(", ") : "—"}
        </span>
        <span className="text-foreground/80">
          для потребности {item.recommendationForNeedProfileId.slice(0, 8)}…
        </span>
      </div>

      <FeedCardActions
        itemType={c.itemType}
        itemId={c.id}
        needProfileId={item.recommendationForNeedProfileId}
        score={item.score}
        title={c.title}
        href={c.href}
      />
    </article>
  );
}
