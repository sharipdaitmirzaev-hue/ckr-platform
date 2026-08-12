import { RequestProgress } from "@/components/client-cabinet/request-progress";
import { ButtonLink } from "@/components/ui/button-link";
import { claimIdeaFromCookieAction } from "@/features/idea-first/actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { resolveCabinetContext } from "@/lib/cabinet/access";
import { orgNameMap } from "@/lib/client-cabinet/org-names";
import {
  describeCkrNow,
  describeHumanStatus,
  describeRequestTitle,
  describeWhatYouNeed,
  formatClientDate,
  sortRequestsForClient,
} from "@/lib/ckr-inbox/client-presentation";
import { listCkrComments, listMyCkrRequests } from "@/lib/ckr-inbox/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Личный кабинет",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { claim?: string };
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  if (searchParams?.claim === "1") {
    await claimIdeaFromCookieAction();
  }

  const cabinet = await resolveCabinetContext(current.user.id, current.roles);
  const requests = sortRequestsForClient(
    await listMyCkrRequests(current.user.id),
  );
  const orgs = await orgNameMap(
    requests.map((r) => r.organizationId || "").filter(Boolean),
  );
  const primary = requests[0];
  const name =
    current.user.fullName?.split(" ")[0] ||
    current.user.fullName ||
    "друг";
  const primaryOrg = primary?.organizationId
    ? orgs.get(primary.organizationId)
    : null;

  let latestCkrMessage: { body: string; createdAt: string } | null = null;
  if (primary) {
    const comments = await listCkrComments(primary.id);
    const fromCkr = comments
      .filter(
        (c) =>
          c.visibility === "CLIENT" && c.authorId !== current.user.id,
      )
      .at(-1);
    if (fromCkr) {
      latestCkrMessage = {
        body: fromCkr.body,
        createdAt: fromCkr.createdAt,
      };
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Здравствуйте, {name}.
        </h1>
        <p className="text-sm text-muted">
          {cabinet.accessLevel === "basic"
            ? "Здесь ваше обращение в ЦКР и то, что происходит сейчас."
            : "Ваш кабинет адаптирован под текущую работу с ЦКР."}
        </p>
      </header>

      {!primary ? (
        <section className="space-y-4 rounded-sm border border-border bg-surface/60 p-5">
          <h2 className="font-display text-xl text-foreground">
            У вас пока нет обращений.
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Опишите своими словами, что вы хотите сделать. Мы посмотрим, чем ЦКР
            может помочь.
          </p>
          <ButtonLink href="/idea" size="lg">
            Рассказать идею
          </ButtonLink>
        </section>
      ) : (
        <section className="space-y-5 rounded-sm border border-border bg-surface/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Ваше обращение
              </p>
              <h2 className="font-display text-xl text-foreground sm:text-2xl">
                {describeRequestTitle({
                  subject: primary.subject,
                  body: primary.body,
                  requestType: primary.requestType,
                  organizationName: primaryOrg,
                })}
              </h2>
              <p className="text-sm text-muted">
                {formatClientDate(primary.createdAt)}
              </p>
            </div>
            {requests.length === 1 ? (
              <ButtonLink href="/idea" size="sm" variant="outline">
                Ещё идея
              </ButtonLink>
            ) : null}
          </div>

          <RequestProgress status={primary.status} />

          <p className="text-sm font-medium text-foreground">
            {describeHumanStatus({
              status: primary.status,
              requestType: primary.requestType,
            })}
          </p>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Сейчас ЦКР
            </p>
            <p className="font-display text-lg text-foreground">
              {describeCkrNow({
                requestType: primary.requestType,
                status: primary.status,
                organizationName: primaryOrg,
                publicActivityText: primary.publicActivityText,
              })}
            </p>
          </div>

          {(() => {
            const need = describeWhatYouNeed({
              status: primary.status,
              nextStepPublic: primary.nextStepPublic,
            });
            return (
              <div
                className={
                  need.needsAction
                    ? "rounded-sm border border-accent/40 bg-accent-muted/40 p-3"
                    : "space-y-1"
                }
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  Что нужно от вас
                </p>
                <p className="text-sm text-foreground">{need.text}</p>
              </div>
            );
          })()}

          {latestCkrMessage ? (
            <div className="space-y-1 border-t border-border pt-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Сообщение от ЦКР
              </p>
              <p className="text-xs text-muted">
                {formatClientDate(latestCkrMessage.createdAt)}
              </p>
              <p className="line-clamp-3 text-sm text-foreground">
                {latestCkrMessage.body}
              </p>
            </div>
          ) : null}

          <p className="line-clamp-3 text-sm text-muted">{primary.body}</p>

          <Link
            href={`/dashboard/ckr-requests/${primary.id}`}
            className="inline-flex rounded-sm bg-accent px-4 py-2.5 text-sm font-medium text-white"
          >
            Открыть обращение
          </Link>
        </section>
      )}

      {requests.length > 1 ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg">Ваши обращения</h2>
          <ul className="space-y-2">
            {requests.map((r) => {
              const org = r.organizationId ? orgs.get(r.organizationId) : null;
              const need = describeWhatYouNeed({
                status: r.status,
                nextStepPublic: r.nextStepPublic,
              });
              return (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/ckr-requests/${r.id}`}
                    className="block space-y-1 rounded-sm border border-border px-3 py-3 hover:bg-foreground/5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {describeRequestTitle({
                          subject: r.subject,
                          body: r.body,
                          requestType: r.requestType,
                          organizationName: org,
                        })}
                      </span>
                      {need.needsAction ? (
                        <span className="text-xs text-accent">Нужен ответ</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted">
                      {describeCkrNow({
                        requestType: r.requestType,
                        status: r.status,
                        organizationName: org,
                        publicActivityText: r.publicActivityText,
                      })}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
          <ButtonLink href="/idea" variant="outline" size="sm">
            Рассказать ещё одну идею
          </ButtonLink>
        </section>
      ) : null}

      {cabinet.accessLevel !== "basic" ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {cabinet.hasOrganization ? (
            <ButtonLink href="/partner" variant="outline">
              Моя компания
            </ButtonLink>
          ) : null}
          {cabinet.hasNeeds ? (
            <ButtonLink href="/dashboard/for-you" variant="outline">
              Возможности для вас
            </ButtonLink>
          ) : null}
          {cabinet.accessLevel === "advanced" && cabinet.hasProjects ? (
            <ButtonLink href="/dashboard/projects" variant="outline">
              Мои проекты
            </ButtonLink>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
