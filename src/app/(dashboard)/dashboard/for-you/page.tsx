import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { FeedRecommendationCard } from "@/features/personalized-feed/components/feed-recommendation-card";
import { intentLabel } from "@/config/need-intents";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPersonalizedFeedService } from "@/lib/personalized-feed/service";
import { needSummary } from "@/lib/personalized-feed/explain";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Для вас" };
export const dynamic = "force-dynamic";

export default async function ForYouPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/for-you");
  const sp = await searchParams;
  const selectedNeedId = sp.need?.trim() || null;

  let feed;
  try {
    const svc = getPersonalizedFeedService("supabase");
    feed = await svc.getFeedForOwner({
      ownerId: current.user.id,
      needProfileId: selectedNeedId,
      limit: 20,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "feed_error";
    return (
      <div className="space-y-4">
        <SectionHeading
          eyebrow="Лента"
          title="Для вас"
          description="Персональные варианты по вашим активным потребностям."
        />
        <p className="text-sm text-red-700">
          Не удалось построить ленту: {msg}. Если таблицы feedback ещё не
          применены — это ожидаемо до production apply.
        </p>
        <ButtonLink href="/dashboard/needs/new">
          Расскажите, что вы ищете
        </ButtonLink>
      </div>
    );
  }

  if (!feed.needs.length) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Лента"
          title="Для вас"
          description="ЦКР подбирает варианты под ваши активные потребности."
        />
        <EmptyState
          title="Пока нечего рекомендовать"
          description="Создайте потребность — и лента «Для вас» начнёт подбирать подходящие проекты, возможности и предложения."
        />
        <ButtonLink href="/dashboard/needs/new">
          Расскажите, что вы ищете
        </ButtonLink>
      </div>
    );
  }

  const selected =
    feed.needs.find((n) => n.id === feed.selectedNeedId) || null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Лента"
          title="Для вас"
          description="Не Matching Engine: простые объяснимые совпадения по вашим ACTIVE Need Profiles."
        />
        <ButtonLink href="/dashboard/needs/new" variant="secondary">
          Новая потребность
        </ButtonLink>
      </div>

      <section className="space-y-3">
        <p className="text-sm text-muted">Потребность</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/for-you"
            className={`rounded-sm border px-3 py-1.5 text-sm ${
              !selectedNeedId
                ? "border-accent text-accent"
                : "border-border text-foreground"
            }`}
          >
            Все
          </Link>
          {feed.needs.map((n) => (
            <Link
              key={n.id}
              href={`/dashboard/for-you?need=${n.id}`}
              className={`rounded-sm border px-3 py-1.5 text-sm ${
                selectedNeedId === n.id
                  ? "border-accent text-accent"
                  : "border-border text-foreground"
              }`}
            >
              {intentLabel(n.intentType)}
              {n.budgetMax != null
                ? ` · до ${(n.budgetMax / 1_000_000).toFixed(0)} млн`
                : ""}
            </Link>
          ))}
        </div>
        {selected ? (
          <p className="text-sm text-foreground">{needSummary(selected)}</p>
        ) : (
          <p className="text-sm text-muted">
            Показаны рекомендации по всем ACTIVE потребностям. У каждой карточки
            указано, под какую потребность она подобрана.
          </p>
        )}
        {selected ? (
          <Badge>
            coverage {feed.diagnostics.coverage}
          </Badge>
        ) : null}
      </section>

      {feed.diagnostics.coverage === "UNSUPPORTED" ? (
        <p className="text-sm text-muted">
          Для этого типа потребности пока нет безопасного публичного источника
          кандидатов.
        </p>
      ) : null}
      {feed.diagnostics.coverage === "PARTIAL" &&
      (feed.diagnostics.intentType === "SEEK_SUPPORT" ||
        feed.diagnostics.intentType === "SEEK_CONTRACT") &&
      !feed.recommendations.length ? (
        <p className="text-sm text-muted">
          Публичные возможности этого типа появятся после controlled publish
          владельцем (одобренные записи Лии → marketplace). Прямого доступа к
          внутреннему LIA OI нет.
        </p>
      ) : null}

      {!feed.recommendations.length ? (
        <EmptyState
          title="Подходящих вариантов не найдено"
          description="Попробуйте уточнить регион/бюджет в потребности или выбрать другую ACTIVE потребность."
        />
      ) : (
        <section>
          <p className="mb-2 text-sm text-muted">
            Найдено {feed.recommendations.length} вариантов
            {feed.diagnostics.filteredCount
              ? ` · отфильтровано ${feed.diagnostics.filteredCount}`
              : ""}
          </p>
          {feed.recommendations.map((item) => (
            <FeedRecommendationCard key={item.recommendationId} item={item} />
          ))}
        </section>
      )}
    </div>
  );
}
