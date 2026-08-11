import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { getControlledPublishService } from "@/lib/lia/oi/publish";
import { ensureLiaOiSeed } from "@/lib/lia/oi/pipeline";
import type { Metadata } from "next";
import Link from "next/link";
import { PublishingQueueActions } from "@/features/controlled-publish/publishing-queue-actions";
import { PublishingQueueClient } from "@/features/controlled-publish/publishing-queue-client";

export const metadata: Metadata = { title: "К публикации · Controlled Publish" };
export const dynamic = "force-dynamic";

export default async function OwnerPublishingPage() {
  const current = await requireLiaOiOwner();
  await ensureLiaOiSeed(current.user.id);
  const svc = getControlledPublishService();
  // Do NOT auto-queue all OI on page load (no mass publish / mass queue).
  const items = await svc.listQueue([
    "queued",
    "change_review",
    "published",
    "rejected",
    "archived",
  ]);

  const queued = items.filter((i) => i.publicationState === "queued");
  const review = items.filter((i) => i.publicationState === "change_review");
  const published = items.filter((i) => i.publicationState === "published");
  const ready = items.filter((i) => i.publishabilityTier === "READY_TO_REVIEW");

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Владелец · Stage 4D"
        title="К публикации"
        description="Лучшие находки Лии для проверки сейчас. Controlled publish без автопубликации и без Matching Engine."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/owner/content-gap" className="text-accent hover:underline">
          Content Gap →
        </Link>
        <Link href="/admin/owner/lia/sources" className="text-accent hover:underline">
          Source health →
        </Link>
      </div>

      <PublishingQueueActions />

      <div className="flex flex-wrap gap-3 text-sm">
        <Badge variant="accent">В очереди: {queued.length}</Badge>
        <Badge>READY: {ready.length}</Badge>
        <Badge>Изменения: {review.length}</Badge>
        <Badge>Опубликовано: {published.length}</Badge>
        <Badge>mode {svc.getMode()}</Badge>
      </div>

      <p className="text-xs text-muted">
        Верх очереди — READY_TO_REVIEW / высокое качество. LIST/NEWS/SOCIAL
        отсекаются quality gate. Пользовательский DQ score не показывается в Feed.
      </p>

      {!items.length ? (
        <p className="text-sm text-muted">
          Очередь пуста. Запустите quality-gate scan или targeted discovery по Content Gap.
        </p>
      ) : (
        <PublishingQueueClient items={items} />
      )}
    </div>
  );
}
