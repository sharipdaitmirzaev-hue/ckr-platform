import { SectionHeading } from "@/components/ui/section-heading";
import { requirePartnerMembership } from "@/lib/auth/require-partner";
import { getCompanyFeed } from "@/lib/company-intelligence/feed";
import { getNeedProfileService } from "@/lib/need-profile/service";
import { getPersonalizedFeedService } from "@/lib/personalized-feed/service";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Возможности для компании" };
export const dynamic = "force-dynamic";

export default async function PartnerCompanyFeedPage() {
  const session = await requirePartnerMembership();
  const org = session.primary.organization;
  const np = getNeedProfileService();
  const needs = await np.listByOwner({
    ownerType: "organization",
    ownerId: org.id,
  });
  const feed = getPersonalizedFeedService();
  const bundle = await getCompanyFeed({
    organizationId: org.id,
    ownerUserId: session.user.id,
    needs,
    feed,
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Моя компания"
        title="Возможности для компании"
        description={`${org.name}. Персональные варианты для компании — отдельно от общего каталога сайта.`}
      />

      <p className="text-sm space-x-3">
        <Link
          href={`/organizations/${org.id}`}
          className="text-accent hover:underline"
        >
          Карточка компании
        </Link>
        <Link href="/dashboard/needs/new" className="text-accent hover:underline">
          Что нужно компании
        </Link>
      </p>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Запросы компании</h2>
        {bundle.needsUsed.length ? (
          <ul className="text-sm text-muted">
            {bundle.needsUsed.map((n) => (
              <li key={n.id}>
                {n.title || n.intentType}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            Пока нет активных запросов компании. Добавьте, что ищете — например
            покупателей или контракт.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Рекомендации</h2>
        {bundle.recommendations.length ? (
          <ul className="space-y-3">
            {bundle.recommendations.map((r) => (
              <li
                key={`${r.needId}:${r.itemType}:${r.itemId}`}
                className="border-b border-border pb-3 text-sm"
              >
                <div className="font-medium">{r.title}</div>
                <div className="text-muted">
                  {r.intentType} · score {r.score} · {r.region || "регион?"} ·{" "}
                  {r.itemType}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Пока нет рекомендаций Feed v1.</p>
        )}
      </section>

      <section className="text-xs text-muted space-y-1">
        {bundle.coverageNotes.map((n) => (
          <p key={n}>{n}</p>
        ))}
      </section>
    </div>
  );
}
