import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { PublishingDetailActions } from "@/features/controlled-publish/publishing-detail-actions";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { getControlledPublishService } from "@/lib/lia/oi/publish";
import { getCandidate } from "@/lib/lia/oi/store";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Публикация · review" };
export const dynamic = "force-dynamic";

export default async function PublishingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireLiaOiOwner();
  const { id } = await params;
  const svc = getControlledPublishService();
  const item = await svc.getQueueItem(id);
  const oi = await getCandidate(id);
  if (!item || !oi) notFound();
  const audit = await svc.listAuditAsync(id);
  const published = await svc.getPublishedBySourceAsync(id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/owner/publishing"
          className="text-sm text-accent hover:underline"
        >
          ← К публикации
        </Link>
        <SectionHeading
          eyebrow="Owner review"
          title={item.draft.title}
          description="Финальный контроль владельца перед user-safe marketplace publish."
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="accent">{item.publicationState}</Badge>
        <Badge>{item.opportunityType}</Badge>
        <Badge>{item.draft.sourceLabel}</Badge>
        <Badge>{item.draft.discoveryBadge}</Badge>
        <Badge>DQ {item.draft.dataQualityScore ?? "—"}</Badge>
        <Badge>{item.draft.matchingReadiness || "—"}</Badge>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 text-sm">
          <h3 className="font-display text-lg">Публичная проекция</h3>
          <p>
            <span className="text-muted">Тип:</span> {item.draft.type}
          </p>
          <p>
            <span className="text-muted">Регион / отрасль:</span>{" "}
            {item.draft.region} · {item.draft.industry || "UNKNOWN"}
          </p>
          <p>
            <span className="text-muted">Сумма:</span>{" "}
            {item.draft.price != null
              ? `${item.draft.price.toLocaleString("ru-RU")} ₽ (${item.draft.amountKind || "—"})`
              : "UNKNOWN"}
          </p>
          <p>
            <span className="text-muted">Дедлайн:</span>{" "}
            {item.draft.deadlineAt
              ? new Date(item.draft.deadlineAt).toLocaleString("ru-RU")
              : "UNKNOWN"}
          </p>
          <p>
            <span className="text-muted">URL:</span>{" "}
            {item.draft.officialUrl ? (
              <a
                href={item.draft.officialUrl}
                className="text-accent hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                открыть источник
              </a>
            ) : (
              "—"
            )}
          </p>
          <p className="text-muted">{item.draft.description.slice(0, 500)}</p>
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="font-display text-lg">Почему Лия</h3>
          <ul className="list-disc pl-5 text-muted">
            {item.draft.ownerWhyUseful.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <p>
            <span className="text-muted">Confirmed:</span>{" "}
            {item.draft.confirmedFields.join(", ") || "—"}
          </p>
          <p>
            <span className="text-muted">Unknown:</span>{" "}
            {item.draft.unknownFields.join(", ") || "—"}
          </p>
          <p>
            <span className="text-muted">Provenance:</span> source_type=lia_oi ·
            source_id скрыт от пользователя
          </p>
          <p>
            <span className="text-muted">First / last seen:</span>{" "}
            {new Date(item.firstSeenAt).toLocaleDateString("ru-RU")} /{" "}
            {new Date(item.lastSeenAt).toLocaleDateString("ru-RU")}
          </p>
          <p>
            <Link
              href={`/admin/owner/lia/opportunities/${id}`}
              className="text-accent hover:underline"
            >
              Открыть исходную LIA OI →
            </Link>
          </p>
          {published ? (
            <p>
              <Link
                href={`/opportunity/${published.id}`}
                className="text-accent hover:underline"
              >
                Публичная opportunity →
              </Link>
            </p>
          ) : null}
        </div>
      </section>

      {item.pendingChanges.length ? (
        <section className="space-y-2 rounded-sm border border-amber-700/40 p-4">
          <h3 className="font-display text-lg text-amber-900">
            Обнаружено изменение
          </h3>
          <ul className="space-y-1 text-sm">
            {item.pendingChanges.map((ch) => (
              <li key={`${ch.field}-${ch.detectedAt}`}>
                <strong>{ch.field}</strong>: {String(ch.oldValue)} →{" "}
                {String(ch.newValue)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <PublishingDetailActions
        id={id}
        publicationState={item.publicationState}
        initial={{
          title: item.draft.title,
          description: item.draft.description,
          type: item.draft.type,
          region: item.draft.region,
          city: item.draft.city,
          price: item.draft.price,
        }}
        lockedFields={item.lockedFields}
      />

      <section className="space-y-2">
        <h3 className="font-display text-lg">Audit trail</h3>
        {!audit.length ? (
          <p className="text-sm text-muted">Пока нет событий.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {audit.map((e) => (
              <li key={e.id} className="border-b border-border py-2">
                <Badge>{e.action}</Badge>{" "}
                <span className="text-muted">
                  {new Date(e.createdAt).toLocaleString("ru-RU")}
                </span>
                {e.reason ? <span> · {e.reason}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
