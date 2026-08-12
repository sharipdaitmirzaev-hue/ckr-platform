import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  ckrRequestStatusLabels,
  ckrRequestTypeLabels,
} from "@/config/ckr-inbox";
import { claimIdeaFromCookieAction } from "@/features/idea-first/actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  resolveCabinetContext,
} from "@/lib/cabinet/access";
import { listMyCkrRequests } from "@/lib/ckr-inbox/queries";
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
  const requests = await listMyCkrRequests(current.user.id);
  const primary = requests[0];
  const name = current.user.fullName || current.user.email || "друг";

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Кабинет"
        title={`Здравствуйте, ${name}.`}
        description={
          cabinet.accessLevel === "basic"
            ? "Расскажите идею или следите за обращениями в ЦКР. Расширенные инструменты откроются после разбора."
            : "Ваш кабинет адаптирован под текущую работу с ЦКР."
        }
      />

      <section className="space-y-4 rounded-sm border border-border bg-surface/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Ваше обращение</h2>
          <ButtonLink href="/idea" size="sm">
            Рассказать ещё одну идею
          </ButtonLink>
        </div>

        {primary ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft">
                {ckrRequestTypeLabels[primary.requestType]}
              </Badge>
              <Badge variant="accent">
                {ckrRequestStatusLabels[primary.status]}
              </Badge>
            </div>
            <p className="font-medium text-foreground">
              {primary.subject || "Обращение в ЦКР"}
            </p>
            <p className="line-clamp-3 text-sm text-muted">{primary.body}</p>
            {primary.nextStepPublic ? (
              <p className="text-sm">
                Следующий шаг:{" "}
                <span className="text-foreground">{primary.nextStepPublic}</span>
              </p>
            ) : (
              <p className="text-sm text-muted">ЦКР рассматривает обращение.</p>
            )}
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
              Пока нет обращений. Начните с простой формы — регистрация для
              отправки идеи не нужна, но в кабинете удобнее следить за ответом.
            </p>
            <ButtonLink href="/idea">Рассказать идею</ButtonLink>
          </div>
        )}
      </section>

      {requests.length > 1 ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg">Другие обращения</h2>
          <ul className="space-y-2">
            {requests.slice(1, 5).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/ckr-requests/${r.id}`}
                  className="flex items-center justify-between gap-3 rounded-sm border border-border px-3 py-2 text-sm hover:bg-foreground/5"
                >
                  <span className="truncate">{r.subject || r.body.slice(0, 60)}</span>
                  <Badge variant="soft">
                    {ckrRequestStatusLabels[r.status]}
                  </Badge>
                </Link>
              </li>
            ))}
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
          Лия и каталоги доступны, но не обязательны. Основной путь — идея → ЦКР.
        </p>
      )}
    </div>
  );
}
