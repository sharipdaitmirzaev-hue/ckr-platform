import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { claimIdeaFromCookieAction } from "@/features/idea-first/actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { resolveCabinetContext } from "@/lib/cabinet/access";
import {
  describeCkrNow,
  describeNextStepPublic,
} from "@/lib/ckr-inbox/client-presentation";
import { listMyCkrRequests } from "@/lib/ckr-inbox/queries";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Личный кабинет",
};

export const dynamic = "force-dynamic";

async function orgNameMap(organizationIds: string[]) {
  const ids = [...new Set(organizationIds.filter(Boolean))];
  if (!ids.length) return new Map<string, string>();
  const supabase = createClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, name")
    .in("id", ids);
  const map = new Map<string, string>();
  for (const row of data || []) {
    const id = (row as { id?: string }).id;
    const name = (row as { name?: string }).name;
    if (id && name) map.set(id, name);
  }
  return map;
}

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
  const requests = await listMyCkrRequests(current.user.id);
  const orgs = await orgNameMap(
    requests.map((r) => r.organizationId || "").filter(Boolean),
  );
  const primary = requests[0];
  const name = current.user.fullName || current.user.email || "друг";
  const primaryOrg = primary?.organizationId
    ? orgs.get(primary.organizationId)
    : null;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Кабинет"
        title={`Здравствуйте, ${name}.`}
        description={
          cabinet.accessLevel === "basic"
            ? "Следите за обращениями в ЦКР. Дополнительные возможности откроются после рассмотрения идеи."
            : "Ваш кабинет адаптирован под текущую работу с ЦКР."
        }
      />

      <section className="space-y-4 rounded-sm border border-border bg-surface/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Ваше обращение</h2>
          <ButtonLink href="/idea" size="sm">
            Расскажите ещё одну идею
          </ButtonLink>
        </div>

        {primary ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Сейчас ЦКР</p>
            <p className="font-display text-lg text-foreground">
              {describeCkrNow({
                requestType: primary.requestType,
                status: primary.status,
                organizationName: primaryOrg,
              })}
            </p>
            <p className="text-sm text-muted">
              Следующий шаг:{" "}
              <span className="text-foreground">
                {describeNextStepPublic({
                  status: primary.status,
                  nextStepPublic: primary.nextStepPublic,
                })}
              </span>
            </p>
            {primaryOrg ? (
              <Badge variant="soft">{primaryOrg}</Badge>
            ) : null}
            <p className="line-clamp-3 text-sm text-muted">{primary.body}</p>
            <Link
              href={`/dashboard/ckr-requests/${primary.id}`}
              className="inline-flex text-sm text-accent hover:underline"
            >
              Открыть обращение →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Пока нет обращений. Расскажите идею — ЦКР рассмотрит её и подскажет
              следующие шаги.
            </p>
            <ButtonLink href="/idea">Расскажите нам вашу идею</ButtonLink>
          </div>
        )}
      </section>

      {requests.length > 1 ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg">Другие обращения</h2>
          <ul className="space-y-2">
            {requests.slice(1, 5).map((r) => {
              const org = r.organizationId ? orgs.get(r.organizationId) : null;
              return (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/ckr-requests/${r.id}`}
                    className="flex items-center justify-between gap-3 rounded-sm border border-border px-3 py-2 text-sm hover:bg-foreground/5"
                  >
                    <span className="truncate">
                      {describeCkrNow({
                        requestType: r.requestType,
                        status: r.status,
                        organizationName: org,
                      })}
                    </span>
                    <Badge variant="soft">Открыть</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {cabinet.accessLevel !== "basic" ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {cabinet.hasNeeds ? (
            <ButtonLink href="/dashboard/for-you" variant="outline">
              Возможности для вас
            </ButtonLink>
          ) : null}
          {cabinet.hasOrganization ? (
            <ButtonLink href="/partner" variant="outline">
              Моя компания
            </ButtonLink>
          ) : null}
          {cabinet.hasProjects ? (
            <ButtonLink href="/dashboard/projects" variant="outline">
              Мои проекты
            </ButtonLink>
          ) : null}
          <ButtonLink href="/dashboard/ckr-requests" variant="outline">
            Все обращения
          </ButtonLink>
        </section>
      ) : (
        <p className="text-xs text-muted">
          Основной путь: идея → ЦКР → следующие шаги. Инструменты платформы
          откроются, когда они понадобятся.
        </p>
      )}
    </div>
  );
}
