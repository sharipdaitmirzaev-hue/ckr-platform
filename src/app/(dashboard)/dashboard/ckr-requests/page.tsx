import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  ckrRequestStatusLabels,
  ckrRequestTypeLabels,
} from "@/config/ckr-inbox";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listMyCkrRequests } from "@/lib/ckr-inbox/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Мои обращения в ЦКР" };
export const dynamic = "force-dynamic";

export default async function ClientCkrRequestsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/ckr-requests");
  const items = await listMyCkrRequests(current.user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          title="Обращения в ЦКР"
          description="Статус ваших заявок и публичные ответы команды ЦКР."
        />
        <Link
          href="/dashboard/ckr-requests/new"
          className="rounded-sm bg-accent px-3 py-2 text-sm text-white"
        >
          Новое обращение
        </Link>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="border-b border-border pb-3">
            <Link
              href={`/dashboard/ckr-requests/${item.id}`}
              className="block space-y-1"
            >
              <div className="flex flex-wrap gap-2">
                <span className="font-medium">{item.subject}</span>
                <Badge variant="soft">
                  {ckrRequestStatusLabels[item.status]}
                </Badge>
                <Badge variant="accent">
                  {ckrRequestTypeLabels[item.requestType]}
                </Badge>
              </div>
              <p className="text-sm text-muted line-clamp-2">{item.body}</p>
            </Link>
          </li>
        ))}
        {!items.length ? (
          <p className="text-sm text-muted">Пока нет обращений в ЦКР.</p>
        ) : null}
      </ul>
    </div>
  );
}
