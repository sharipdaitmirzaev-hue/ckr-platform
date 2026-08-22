import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { claimIdeaFromCookieAction } from "@/features/idea-first/actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { orgNameMap } from "@/lib/client-cabinet/org-names";
import {
  describeCkrNow,
  describeHumanStatus,
  describeRequestTitle,
  describeWhatYouNeed,
  formatClientDate,
  sortRequestsForClient,
} from "@/lib/ckr-inbox/client-presentation";
import { listMyCkrRequests } from "@/lib/ckr-inbox/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Мои обращения в ЦКР" };
export const dynamic = "force-dynamic";

export default async function ClientCkrRequestsPage({
  searchParams,
}: {
  searchParams?: { claim?: string; claimError?: string; claimed?: string };
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/ckr-requests");

  if (searchParams?.claim === "1") {
    await claimIdeaFromCookieAction();
  }

  const items = sortRequestsForClient(
    await listMyCkrRequests(current.user.id),
  );
  const orgNames = await orgNameMap(
    items.map((i) => i.organizationId || "").filter(Boolean),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          title="Обращения"
          description="Идеи и запросы, которые вы отправили в ЦКР."
        />
        <ButtonLink href="/idea" size="sm">
          + Новое обращение
        </ButtonLink>
      </div>

      {searchParams?.claimed === "1" ? (
        <p className="rounded-sm border border-accent/40 bg-accent-muted px-3 py-2 text-sm">
          Идея привязана к вашему кабинету.
        </p>
      ) : null}
      {searchParams?.claimError ? (
        <p className="text-sm text-danger">{searchParams.claimError}</p>
      ) : null}

      {!items.length ? (
        <section className="space-y-4 rounded-sm border border-border bg-surface/60 p-5">
          <p className="font-display text-lg text-foreground">
            У вас пока нет обращений.
          </p>
          <p className="text-sm text-muted">
            Опишите своими словами, что вы хотите сделать. Мы посмотрим, чем ЦКР
            может помочь.
          </p>
          <ButtonLink href="/idea">Рассказать идею</ButtonLink>
        </section>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const org = item.organizationId
              ? orgNames.get(item.organizationId)
              : null;
            const need = describeWhatYouNeed({
              status: item.status,
              nextStepPublic: item.nextStepPublic,
            });
            return (
              <li
                key={item.id}
                className="rounded-sm border border-border bg-surface/40 p-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {describeRequestTitle({
                          subject: item.subject,
                          body: item.body,
                          requestType: item.requestType,
                          organizationName: org,
                        })}
                      </p>
                      <p className="text-xs text-muted">
                        {formatClientDate(item.createdAt)}
                      </p>
                    </div>
                    {need.needsAction ? (
                      <span className="rounded-sm bg-accent-muted px-2 py-1 text-xs text-accent">
                        Нужен ответ
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-foreground">
                    {describeHumanStatus({
                      status: item.status,
                      requestType: item.requestType,
                    })}
                  </p>
                  <p className="text-sm text-muted">
                    Сейчас ЦКР:{" "}
                    {describeCkrNow({
                      requestType: item.requestType,
                      status: item.status,
                      organizationName: org,
                      publicActivityText: item.publicActivityText,
                    })}
                  </p>
                  <Link
                    href={`/dashboard/ckr-requests/${item.id}`}
                    className="inline-flex text-sm text-accent hover:underline"
                  >
                    Открыть →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
