import { ButtonLink } from "@/components/ui/button-link";
import { UX_CTA } from "@/config/ux-simplification";
import type { FeedRecommendation } from "@/types/personalized-feed";

function money(n: number | null | undefined): string | null {
  if (n == null) return null;
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `≈ ${Number.isInteger(m) ? m : m.toFixed(1)} млн ₽`;
  }
  return `≈ ${Math.round(n).toLocaleString("ru-RU")} ₽`;
}

/**
 * UX B — clean opportunity card for clients.
 * Answers: what / why / what next. No UUID, score, raw itemType.
 */
export function FeedRecommendationCard({
  item,
}: {
  item: FeedRecommendation;
}) {
  const c = item.candidate;
  const amount = c.priceKnown ? money(c.price) : null;
  const deadline =
    "deadlineAt" in c && c.deadlineAt
      ? `до ${new Date(String(c.deadlineAt)).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
        })}`
      : null;

  return (
    <article className="space-y-3 py-5">
      <div className="space-y-1">
        <h3 className="font-display text-xl text-foreground">{c.title}</h3>
        <p className="text-sm text-muted">
          {[c.region, c.industry].filter(Boolean).join(" · ") ||
            "Регион уточняется"}
        </p>
        {(amount || deadline) && (
          <p className="text-sm text-foreground">
            {[amount, deadline].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div className="space-y-1 text-sm">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Почему ЦКР показывает
        </p>
        <p className="text-muted">{item.explanation.why}</p>
      </div>

      <ButtonLink href={c.href} size="sm">
        {UX_CTA.open}
      </ButtonLink>
    </article>
  );
}
