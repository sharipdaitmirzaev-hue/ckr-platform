import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  ckrRequestStatusLabels,
  ckrRequestTypeLabels,
} from "@/config/ckr-inbox";
import { claimIdeaFromCookieAction } from "@/features/idea-first/actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
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

  const items = await listMyCkrRequests(current.user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          title="Мои обращения"
          description="Статус идей и обращений в ЦКР. Внутренние заметки команды скрыты."
        />
        <div className="flex gap-2">
          <Link
            href="/idea"
            className="rounded-sm bg-accent px-3 py-2 text-sm text-white"
          >
            Рассказать идею
          </Link>
          <Link
            href="/dashboard/ckr-requests/new"
            className="rounded-sm border border-border px-3 py-2 text-sm"
          >
            Из кабинета
          </Link>
        </div>
      </div>

      {searchParams?.claimed === "1" ? (
        <p className="rounded-sm border border-accent/40 bg-accent-muted px-3 py-2 text-sm">
          Идея привязана к вашему кабинету.
        </p>
      ) : null}
      {searchParams?.claimError ? (
        <p className="text-sm text-danger">{searchParams.claimError}</p>
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="border-b border-border pb-3">
            <Link
              href={`/dashboard/ckr-requests/${item.id}`}
              className="block space-y-1"
            >
              <div className="flex flex-wrap gap-2">
                <span className="font-medium">
                  {item.subject || "Обращение в ЦКР"}
                </span>
                <Badge variant="soft">
                  {ckrRequestStatusLabels[item.status]}
                </Badge>
                <Badge variant="accent">
                  {ckrRequestTypeLabels[item.requestType]}
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm text-muted">{item.body}</p>
            </Link>
          </li>
        ))}
        {!items.length ? (
          <p className="text-sm text-muted">
            Пока нет обращений.{" "}
            <Link href="/idea" className="text-accent hover:underline">
              Расскажите идею
            </Link>
            .
          </p>
        ) : null}
      </ul>
    </div>
  );
}
