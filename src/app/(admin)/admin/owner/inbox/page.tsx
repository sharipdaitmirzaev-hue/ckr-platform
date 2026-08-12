import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  ckrRequestPriorityLabels,
  ckrRequestStatusLabels,
  ckrRequestTypeLabels,
} from "@/config/ckr-inbox";
import { requireStaff } from "@/lib/auth/require-staff";
import { getInboxStats, listCkrRequests } from "@/lib/ckr-inbox/queries";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Заявки · Inbox ЦКР" };
export const dynamic = "force-dynamic";

export default async function OwnerInboxPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  await requireStaff("/admin/owner/inbox");
  const bucket = String(searchParams?.bucket || "all") as
    | "all"
    | "new"
    | "active"
    | "waiting"
    | "done";
  const status = String(searchParams?.status || "");
  const type = String(searchParams?.type || "");
  const q = String(searchParams?.q || "");
  const region = String(searchParams?.region || "");

  const [items, stats] = await Promise.all([
    listCkrRequests({
      bucket,
      status: status || undefined,
      type: type || undefined,
      q: q || undefined,
      region: region || undefined,
    }),
    getInboxStats(),
  ]);

  const buckets = [
    { id: "all", label: "Все", count: stats.newCount + stats.inProgress + stats.waiting + stats.done },
    { id: "new", label: "Новые", count: stats.newCount },
    { id: "active", label: "В работе", count: stats.inProgress },
    { id: "waiting", label: "Ждём клиента", count: stats.waiting },
    { id: "done", label: "Завершённые", count: stats.done },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <SectionHeading
        eyebrow="ЦКР"
        title="Заявки"
        description="Единый inbox обращений в ЦКР. Matching / auto-outreach не используются."
      />

      <div className="flex flex-wrap gap-2">
        {buckets.map((b) => (
          <Link
            key={b.id}
            href={`/admin/owner/inbox?bucket=${b.id}`}
            className={`rounded-sm border px-3 py-1.5 text-sm ${
              bucket === b.id
                ? "border-accent text-accent"
                : "border-border text-muted"
            }`}
          >
            {b.label} · {b.count}
          </Link>
        ))}
      </div>

      <form className="grid gap-2 sm:grid-cols-4" method="get">
        <input type="hidden" name="bucket" value={bucket} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск"
          className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
        />
        <input
          name="region"
          defaultValue={region}
          placeholder="Регион"
          className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
        />
        <input
          name="type"
          defaultValue={type}
          placeholder="Тип (FIND_BUYER…)"
          className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-sm bg-accent px-3 text-sm text-white"
        >
          Фильтр
        </button>
      </form>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="border-b border-border pb-3">
            <Link
              href={`/admin/owner/inbox/${item.id}`}
              className="block space-y-1 hover:opacity-90"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">
                  {item.subject || "Без темы"}
                </span>
                <Badge variant="soft">
                  {ckrRequestStatusLabels[item.status]}
                </Badge>
                <Badge variant="accent">
                  {ckrRequestTypeLabels[item.requestType]}
                </Badge>
                <Badge variant="soft">
                  {ckrRequestPriorityLabels[item.priority]}
                </Badge>
              </div>
              <p className="text-sm text-muted line-clamp-2">{item.body}</p>
              <p className="text-xs text-muted">
                {item.region || "регион?"} · {item.source} ·{" "}
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </p>
            </Link>
          </li>
        ))}
        {!items.length ? (
          <p className="text-sm text-muted">
            Очередь пуста. Импортируйте партнёрства или дождитесь прямых заявок.
          </p>
        ) : null}
      </ul>
    </div>
  );
}
