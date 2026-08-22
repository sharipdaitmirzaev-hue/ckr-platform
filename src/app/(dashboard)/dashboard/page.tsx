import { RequestProgress } from "@/components/client-cabinet/request-progress";
import { ButtonLink } from "@/components/ui/button-link";
import { UX_CTA } from "@/config/ux-simplification";
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
  let foundVariants = 0;
  if (primary) {
    const comments = await listCkrComments(primary.id);
    const clientVisible = comments.filter((c) => c.visibility === "CLIENT");
    const fromCkr = clientVisible
      .filter((c) => c.authorId !== current.user.id)
      .at(-1);
    if (fromCkr) {
      latestCkrMessage = {
        body: fromCkr.body,
        createdAt: fromCkr.createdAt,
      };
    }
    // Heuristic: shared variants appear as CLIENT messages from staff
    foundVariants = clientVisible.filter(
      (c) =>
        c.authorId !== current.user.id &&
        /вариант|закупк|возможност|ЦКР нашёл/i.test(c.body),
    ).length;
  }

  const need = primary
    ? describeWhatYouNeed({
        status: primary.status,
        nextStepPublic: primary.nextStepPublic,
      })
    : null;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Здравствуйте, {name}.
        </h1>
        <p className="text-sm text-muted">
          {requests.length === 0
            ? "Расскажите задачу — ЦКР поможет найти следующий шаг."
            : requests.length === 1
              ? "ЦКР работает над 1 обращением."
              : `ЦКР работает над ${requests.length} обращениями.`}
        </p>
      </header>

      {!primary ? (
        <section className="space-y-4 py-2">
          <h2 className="font-display text-xl text-foreground">
            У вас пока нет обращений
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted">
            Опишите своими словами, что хотите сделать. Не нужен готовый
            бизнес-план.
          </p>
          <ButtonLink href="/idea" size="lg">
            {UX_CTA.newRequest}
          </ButtonLink>
        </section>
      ) : (
        <section className="space-y-6 border-t border-border pt-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Обращение
            </p>
            <h2 className="font-display text-2xl text-foreground">
              {describeRequestTitle({
                subject: primary.subject,
                body: primary.body,
                requestType: primary.requestType,
                organizationName: primaryOrg,
              })}
            </h2>
            <p className="text-base font-medium text-foreground">
              {describeHumanStatus({
                status: primary.status,
                requestType: primary.requestType,
              })}
            </p>
            <RequestProgress status={primary.status} />
          </div>

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

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Найдено
            </p>
            <p className="text-sm text-foreground">
              {foundVariants > 0
                ? `${foundVariants} вариант${foundVariants === 1 ? "" : foundVariants < 5 ? "а" : "ов"}`
                : "Пока нет вариантов для вас — ЦКР продолжает работу"}
            </p>
          </div>

          {need ? (
            <div
              className={
                need.needsAction
                  ? "space-y-1 border-l-2 border-accent pl-4"
                  : "space-y-1"
              }
            >
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                От вас
              </p>
              <p className="text-sm text-foreground">{need.text}</p>
            </div>
          ) : null}

          {latestCkrMessage ? (
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Сообщение от ЦКР
              </p>
              <p className="line-clamp-3 text-sm text-foreground">
                {latestCkrMessage.body}
              </p>
              <p className="text-xs text-muted">
                {formatClientDate(latestCkrMessage.createdAt)}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/dashboard/ckr-requests/${primary.id}`}
              className="inline-flex rounded-sm bg-accent px-4 py-2.5 text-sm font-medium text-white"
            >
              {UX_CTA.open}
            </Link>
            <ButtonLink href="/idea" variant="outline">
              {UX_CTA.newRequest}
            </ButtonLink>
          </div>
        </section>
      )}

      {requests.length > 1 ? (
        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="font-display text-lg">Другие обращения</h2>
          <ul className="space-y-2">
            {requests.slice(1).map((r) => {
              const org = r.organizationId ? orgs.get(r.organizationId) : null;
              const n = describeWhatYouNeed({
                status: r.status,
                nextStepPublic: r.nextStepPublic,
              });
              return (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/ckr-requests/${r.id}`}
                    className="block space-y-1 border-b border-border py-3 hover:text-accent"
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
                      {n.needsAction ? (
                        <span className="text-xs text-accent">
                          Нужна информация
                        </span>
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
        </section>
      ) : null}

      {cabinet.hasOrganization ? (
        <p className="text-sm text-muted">
          <Link href="/partner" className="text-accent hover:underline">
            Моя компания →
          </Link>
        </p>
      ) : null}
    </div>
  );
}
