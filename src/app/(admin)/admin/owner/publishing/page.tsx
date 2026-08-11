import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { getControlledPublishService } from "@/lib/lia/oi/publish";
import { ensureLiaOiSeed } from "@/lib/lia/oi/pipeline";
import type { Metadata } from "next";
import Link from "next/link";
import { PublishingQueueActions } from "@/features/controlled-publish/publishing-queue-actions";

export const metadata: Metadata = { title: "К публикации · Controlled Publish" };
export const dynamic = "force-dynamic";

function money(n: number | null | undefined) {
  if (n == null) return "UNKNOWN";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)} млн ₽`;
  return `${Math.round(n).toLocaleString("ru-RU")} ₽`;
}

export default async function OwnerPublishingPage() {
  const current = await requireLiaOiOwner();
  await ensureLiaOiSeed(current.user.id);
  const svc = getControlledPublishService("memory");
  // Soft queue scan (idempotent for already queued/published)
  await svc.queueEligible(current.user.id);
  const items = await svc.listQueue([
    "queued",
    "change_review",
    "published",
    "rejected",
  ]);

  const queued = items.filter((i) => i.publicationState === "queued");
  const review = items.filter((i) => i.publicationState === "change_review");
  const published = items.filter((i) => i.publicationState === "published");

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Владелец · Stage 4C"
        title="К публикации"
        description="Controlled publish: LIA FOUND → OWNER REVIEW → APPROVE → user-safe marketplace opportunity → Feed. Без Matching Engine и без автопубликации."
      />

      <PublishingQueueActions />

      <div className="flex flex-wrap gap-3 text-sm">
        <Badge variant="accent">В очереди: {queued.length}</Badge>
        <Badge>Изменения: {review.length}</Badge>
        <Badge>Опубликовано (session): {published.length}</Badge>
      </div>

      <p className="text-xs text-muted">
        lia_oi_* остаются OWNER_ONLY. Пользователь видит только опубликованную
        проекцию в opportunities. Production migration пока не применяется
        автоматически.
      </p>

      {!items.length ? (
        <p className="text-sm text-muted">
          Очередь пуста. Запустите quality-gate scan или дождитесь подходящих
          LIA OI карточек (title + official URL + quality).
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.liaOiId}
              className="space-y-2 border-b border-border py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="accent">{item.publicationState}</Badge>
                    <Badge>{item.opportunityType || "OTHER"}</Badge>
                    <Badge>{item.draft.sourceLabel}</Badge>
                    <Badge>{item.draft.type}</Badge>
                  </div>
                  <h2 className="font-display text-xl text-foreground">
                    <Link
                      href={`/admin/owner/publishing/${item.liaOiId}`}
                      className="hover:text-accent"
                    >
                      {item.draft.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted">
                    {[item.draft.region, item.draft.industry]
                      .filter(Boolean)
                      .join(" · ")}
                    {" · "}
                    {money(item.draft.price)}
                    {item.draft.deadlineAt
                      ? ` · дедлайн ${new Date(item.draft.deadlineAt).toLocaleDateString("ru-RU")}`
                      : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-muted">
                  <p>DQ {item.draft.dataQualityScore ?? "—"}</p>
                  <p>{item.draft.matchingReadiness || "—"}</p>
                  <p>
                    seen{" "}
                    {new Date(item.lastSeenAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground/90">
                {item.draft.ownerWhyUseful[0]}
              </p>
              {item.officialUrl ? (
                <a
                  href={item.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Официальный источник →
                </a>
              ) : null}
              {item.pendingChanges.length ? (
                <p className="text-sm text-amber-800">
                  Обнаружено изменение:{" "}
                  {item.pendingChanges.map((c) => c.field).join(", ")}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
