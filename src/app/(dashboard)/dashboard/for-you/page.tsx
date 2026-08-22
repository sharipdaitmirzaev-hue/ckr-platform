import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { UX_CTA } from "@/config/ux-simplification";
import { FeedRecommendationCard } from "@/features/personalized-feed/components/feed-recommendation-card";
import { intentLabel } from "@/config/need-intents";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPersonalizedFeedService } from "@/lib/personalized-feed/service";
import { needSummary } from "@/lib/personalized-feed/explain";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Возможности" };
export const dynamic = "force-dynamic";

/**
 * UX B — unified «Возможности» presentation.
 * Tabs: Для вас | Сохранённые | Все (catalog).
 * Backend feed unchanged. Raw OI never shown.
 */
export default async function ForYouPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string; tab?: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/for-you");
  const sp = await searchParams;
  const selectedNeedId = sp.need?.trim() || null;
  const tab =
    sp.tab === "all" ? "all" : sp.tab === "saved" ? "saved" : "for-you";

  let feed;
  try {
    const svc = getPersonalizedFeedService("supabase");
    feed = await svc.getFeedForOwner({
      ownerId: current.user.id,
      needProfileId: selectedNeedId,
      limit: 20,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return (
      <div className="space-y-4">
        <SectionHeading
          title="Возможности"
          description="Варианты, которые ЦКР подобрал под ваши обращения."
        />
        <p className="text-sm text-muted">
          Не удалось загрузить варианты. Попробуйте позже.
        </p>
        <p className="text-xs text-muted">{msg}</p>
        <ButtonLink href="/idea">{UX_CTA.newRequest}</ButtonLink>
      </div>
    );
  }

  const tabs = [
    { id: "for-you", label: "Для вас", href: "/dashboard/for-you" },
    {
      id: "saved",
      label: "Сохранённые",
      href: "/dashboard/for-you?tab=saved",
    },
    { id: "all", label: "Все", href: "/opportunities" },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          title="Возможности"
          description="То, что ЦКР подобрал под ваши задачи."
        />
        <ButtonLink href="/idea" size="sm" variant="outline">
          {UX_CTA.newRequest}
        </ButtonLink>
      </div>

      <nav className="flex flex-wrap gap-4 border-b border-border pb-2 text-sm">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={
              tab === t.id
                ? "border-b-2 border-accent pb-2 font-medium text-accent"
                : "pb-2 text-muted hover:text-foreground"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "saved" ? (
        <EmptyState
          title="Сохранённые появятся здесь"
          description="Отметьте вариант как интересный — он сохранится для вас."
        />
      ) : null}

      {tab === "for-you" && !feed.needs.length ? (
        <div className="space-y-4">
          <EmptyState
            title="Пока нет персональных вариантов"
            description="Отправьте обращение — ЦКР начнёт подбор. Каталог сайта — во вкладке «Все»."
          />
          <ButtonLink href="/idea">{UX_CTA.newRequest}</ButtonLink>
        </div>
      ) : null}

      {tab === "for-you" && feed.needs.length ? (
        <>
          {feed.needs.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {feed.needs.map((n) => (
                <Link
                  key={n.id}
                  href={`/dashboard/for-you?need=${n.id}`}
                  className="rounded-sm border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
                >
                  {intentLabel(n.intentType) || n.title}
                </Link>
              ))}
            </div>
          ) : null}

          {feed.selectedNeedId ? (
            <p className="text-sm text-muted">
              {needSummary(
                feed.needs.find((n) => n.id === feed.selectedNeedId) ||
                  feed.needs[0],
              )}
            </p>
          ) : null}

          {feed.recommendations.length === 0 ? (
            <EmptyState
              title="Вариантов пока нет"
              description="ЦКР продолжает поиск. Мы сообщим, когда появится результат."
            />
          ) : (
            <ul className="divide-y divide-border">
              {feed.recommendations.map((item) => (
                <li key={item.recommendationId}>
                  <FeedRecommendationCard item={item} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
