import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildCompanyIntelligenceCard } from "@/lib/company-intelligence/card";
import { resolveViewerRole } from "@/lib/company-intelligence/privacy";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getMembership,
  getOrganizationById,
  listOrganizationInvestments,
  listOrganizationMembers,
  listOrganizationOpportunities,
  listOrganizationProjects,
} from "@/lib/partners/queries";
import { getNeedProfileService } from "@/lib/need-profile/service";
import { listOrgCkrRequests } from "@/lib/ckr-inbox/queries";
import {
  ckrRequestStatusLabels,
  ckrRequestTypeLabels,
} from "@/config/ckr-inbox";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const org = await getOrganizationById(params.id);
  return { title: org ? `${org.name} · Компания` : "Компания" };
}

export default async function OrganizationIntelligencePage({
  params,
}: {
  params: { id: string };
}) {
  const org = await getOrganizationById(params.id);
  if (!org) notFound();

  const user = await getCurrentUser();
  const membership = user
    ? await getMembership(org.id, user.user.id)
    : null;
  const isAdmin = Boolean(user?.roles?.includes("admin"));
  const viewerRole = resolveViewerRole({
    isAdmin,
    isMember: Boolean(membership),
    canManage:
      membership?.role === "owner" || membership?.role === "manager",
  });

  const orgRequests =
    membership || isAdmin
      ? await listOrgCkrRequests(org.id).catch(() => [])
      : [];

  // Public page: only verified orgs for anon (RLS already enforces)
  if (
    viewerRole === "anon" &&
    org.verificationStatus !== "verified"
  ) {
    notFound();
  }

  const [projects, opportunities, investments, members] = await Promise.all([
    listOrganizationProjects(org.id),
    listOrganizationOpportunities(org.id),
    listOrganizationInvestments(org.id),
    listOrganizationMembers(org.id),
  ]);

  let needs = [] as Awaited<
    ReturnType<ReturnType<typeof getNeedProfileService>["listByOwner"]>
  >;
  try {
    const np = getNeedProfileService();
    needs = await np.listByOwner({
      ownerType: "organization",
      ownerId: org.id,
    });
  } catch {
    needs = [];
  }

  const card = buildCompanyIntelligenceCard({
    organization: org,
    viewerRole,
    linked: {
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        region: p.region,
      })),
      opportunities: opportunities.map((o) => ({
        id: o.id,
        title: o.title,
        type: o.type,
      })),
      investments: investments.map((i) => ({ id: i.id, title: i.title })),
      needs,
      members: members.map((m) => ({
        userId: m.userId,
        role: m.role,
        fullName: m.fullName,
      })),
      graphEdges: [],
    },
  });

  const v = card.publicView;

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <SectionHeading
        eyebrow="Company Intelligence"
        title={v.name}
        description={
          v.offersSummary ||
          v.description ||
          "Бизнес-контекст компании в экосистеме ЦКР."
        }
      />

      <p className="text-sm">
        <Link href="/organizations" className="text-accent hover:underline">
          ← Каталог
        </Link>
        {membership ? (
          <>
            {" · "}
            <Link
              href="/partner/feed"
              className="text-accent hover:underline"
            >
              Возможности для компании
            </Link>
          </>
        ) : null}
      </p>

      <section className="space-y-2">
        <h2 className="font-display text-lg">О компании</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {v.region ? <Badge variant="accent">{v.region}</Badge> : null}
          {v.city ? <Badge>{v.city}</Badge> : null}
          {v.industry ? <Badge>{v.industry}</Badge> : null}
          <Badge>{v.verificationStatus}</Badge>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Юр. название</dt>
            <dd>{v.legalName || "UNKNOWN"}</dd>
          </div>
          <div>
            <dt className="text-muted">ОПФ</dt>
            <dd>{v.legalForm || "UNKNOWN"}</dd>
          </div>
          <div>
            <dt className="text-muted">ИНН</dt>
            <dd>{v.inn || "UNKNOWN"}</dd>
          </div>
          <div>
            <dt className="text-muted">ОГРН</dt>
            <dd>{v.ogrn || "UNKNOWN"}</dd>
          </div>
          <div>
            <dt className="text-muted">Сайт</dt>
            <dd>
              {v.website ? (
                <a
                  href={v.website}
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {v.website}
                </a>
              ) : (
                "UNKNOWN"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Источник</dt>
            <dd>
              {v.sourceLabel || "—"}
              {v.sourceUrl ? (
                <>
                  {" "}
                  <a
                    href={v.sourceUrl}
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    URL
                  </a>
                </>
              ) : null}
            </dd>
          </div>
        </dl>
        {v.description ? (
          <p className="text-sm text-muted">{v.description}</p>
        ) : null}
        {v.productsServices ? (
          <p className="text-sm">Продукты/услуги: {v.productsServices}</p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Что предлагает</h2>
        <p className="text-sm">{v.offersSummary || "UNKNOWN"}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Что ищет</h2>
        <p className="text-sm">{v.seeksSummary || "UNKNOWN"}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Проекты</h2>
        {card.linked.projects.length ? (
          <ul className="space-y-1 text-sm">
            {card.linked.projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/project/${p.id}`}
                  className="text-accent hover:underline"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Пока нет связанных проектов.</p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Возможности</h2>
        {card.linked.opportunities.length ? (
          <ul className="space-y-1 text-sm">
            {card.linked.opportunities.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/opportunity/${o.id}`}
                  className="text-accent hover:underline"
                >
                  {o.title}
                </Link>
                {o.type ? (
                  <span className="text-muted"> · {o.type}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Нет публичных opportunities.</p>
        )}
      </section>

      {card.internal ? (
        <section className="space-y-2 border-t border-border pt-6">
          <h2 className="font-display text-lg">Лия / качество (CKR)</h2>
          <p className="text-sm text-muted">
            Quality {card.internal.quality.score}/100 ·{" "}
            {card.internal.quality.labelsRu.join(", ") || "—"}
          </p>
          <p className="text-sm text-muted">
            {card.internal.demandSignals.noteRu}
          </p>
          {card.internal.liaDraft ? (
            <p className="text-xs text-muted">
              LIA draft: {card.internal.liaDraft.queries.length} queries ·
              status {card.internal.liaDraft.status} · autoPublish=
              {String(card.internal.liaDraft.autoPublish)}
            </p>
          ) : null}
          {card.internal.ownerNotes ? (
            <p className="text-sm">Owner notes: {card.internal.ownerNotes}</p>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="font-display text-lg">Команда</h2>
        {card.linked.members.length ? (
          <ul className="text-sm text-muted">
            {card.linked.members.map((m) => (
              <li key={m.userId}>
                {m.fullName || m.userId.slice(0, 8)} · {m.role}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Состав скрыт или пуст.</p>
        )}
      </section>

      {orgRequests.length || membership || isAdmin ? (
        <section className="space-y-2">
          <h2 className="font-display text-lg">Заявки в ЦКР</h2>
          {orgRequests.length ? (
            <ul className="space-y-2 text-sm">
              {orgRequests.map((r) => (
                <li key={r.id}>
                  {isAdmin ? (
                    <Link
                      href={`/admin/owner/inbox/${r.id}`}
                      className="text-accent hover:underline"
                    >
                      {r.subject || "Обращение"}
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/ckr-requests/${r.id}`}
                      className="text-accent hover:underline"
                    >
                      {r.subject || "Обращение"}
                    </Link>
                  )}{" "}
                  <Badge variant="soft">
                    {ckrRequestStatusLabels[r.status]}
                  </Badge>{" "}
                  <span className="text-muted">
                    {ckrRequestTypeLabels[r.requestType]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              Пока нет обращений.{" "}
              <Link
                href="/dashboard/ckr-requests/new"
                className="text-accent hover:underline"
              >
                Отправить в ЦКР
              </Link>
            </p>
          )}
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="font-display text-lg">История</h2>
        <ul className="space-y-2 text-sm">
          {card.timeline.map((t) => (
            <li key={t.id}>
              <span className="text-muted">
                {new Date(t.at).toLocaleDateString("ru-RU")}
              </span>{" "}
              — {t.title}
              {t.detail ? (
                <span className="text-muted"> · {t.detail}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
