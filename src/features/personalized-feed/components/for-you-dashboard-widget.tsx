import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import type { FeedRecommendation } from "@/types/personalized-feed";
import Link from "next/link";

export function ForYouDashboardWidget({
  total,
  top,
  hasNeeds,
}: {
  total: number;
  top: FeedRecommendation[];
  hasNeeds: boolean;
}) {
  if (!hasNeeds) {
    return (
      <section className="space-y-3">
        <SectionHeading
          eyebrow="Для вас"
          title="Персональная лента"
          description="Расскажите, что ищете — ЦКР подберёт варианты из каталога и открытых данных."
        />
        <ButtonLink href="/dashboard/needs/new">
          Расскажите, что вы ищете
        </ButtonLink>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          eyebrow="Для вас"
          title={`Найдено ${total} вариантов по вашим потребностям`}
          description="Объяснимые рекомендации без Matching Engine."
        />
        <ButtonLink href="/dashboard/for-you" variant="secondary">
          Открыть ленту
        </ButtonLink>
      </div>
      <ul className="space-y-2">
        {top.map((r) => (
          <li key={r.recommendationId}>
            <Link
              href={r.candidate.href}
              className="block text-sm text-foreground hover:text-accent"
            >
              <span className="text-muted">{r.candidate.sourceLabel}</span>
              {" · "}
              {r.candidate.title}
              <span className="text-muted"> · score {r.score}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
