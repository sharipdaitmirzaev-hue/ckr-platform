import { SectionHeading } from "@/components/ui/section-heading";
import { claimIdeaFromCookieAction } from "@/features/idea-first/actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  describeCkrNow,
  describeNextStepPublic,
} from "@/lib/ckr-inbox/client-presentation";
import { listMyCkrRequests } from "@/lib/ckr-inbox/queries";
import { createClient } from "@/lib/supabase/server";
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
  const orgIds = [
    ...new Set(items.map((i) => i.organizationId).filter(Boolean) as string[]),
  ];
  const orgNames = new Map<string, string>();
  if (orgIds.length) {
    const supabase = createClient();
    const { data } = await supabase
      .from("organizations")
      .select("id, name")
      .in("id", orgIds);
    for (const row of data || []) {
      const id = (row as { id?: string }).id;
      const name = (row as { name?: string }).name;
      if (id && name) orgNames.set(id, name);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          title="Мои обращения"
          description="Одно место для идей и запросов в ЦКР. Внутренние заметки команды скрыты."
        />
        <Link
          href="/idea"
          className="rounded-sm bg-accent px-3 py-2 text-sm text-white"
        >
          Расскажите нам вашу идею
        </Link>
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
        {items.map((item) => {
          const org = item.organizationId
            ? orgNames.get(item.organizationId)
            : null;
          const nowText = describeCkrNow({
            requestType: item.requestType,
            status: item.status,
            organizationName: org,
          });
          return (
            <li key={item.id} className="border-b border-border pb-3">
              <Link
                href={`/dashboard/ckr-requests/${item.id}`}
                className="block space-y-1"
              >
                <p className="font-medium text-foreground">{nowText}</p>
                <p className="text-sm text-muted">
                  Следующий шаг:{" "}
                  {describeNextStepPublic({
                    status: item.status,
                    nextStepPublic: item.nextStepPublic,
                  })}
                </p>
                <p className="line-clamp-2 text-sm text-muted">{item.body}</p>
              </Link>
            </li>
          );
        })}
        {!items.length ? (
          <p className="text-sm text-muted">
            Пока нет обращений.{" "}
            <Link href="/idea" className="text-accent hover:underline">
              Расскажите нам вашу идею
            </Link>
            .
          </p>
        ) : null}
      </ul>
    </div>
  );
}
