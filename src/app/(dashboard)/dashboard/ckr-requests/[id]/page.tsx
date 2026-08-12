import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  ckrRequestStatusLabels,
  ckrRequestTypeLabels,
} from "@/config/ckr-inbox";
import { addCkrRequestCommentAction } from "@/features/ckr-inbox/actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getCkrRequestById,
  listCkrComments,
  listCkrEvents,
} from "@/lib/ckr-inbox/queries";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientCkrRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const current = await getCurrentUser();
  if (!current) redirect(`/login?next=/dashboard/ckr-requests/${params.id}`);

  const request = await getCkrRequestById(params.id);
  if (!request) notFound();

  // Defense in depth — RLS already filters; hide internal if somehow leaked
  const [comments, events] = await Promise.all([
    listCkrComments(request.id),
    listCkrEvents(request.id),
  ]);
  const clientComments = comments.filter((c) => c.visibility === "CLIENT");
  const clientEvents = events.filter((e) => e.visibility === "CLIENT");

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/ckr-requests"
        className="text-sm text-accent hover:underline"
      >
        ← Мои обращения
      </Link>
      <SectionHeading
        title={request.subject}
        description={`${ckrRequestTypeLabels[request.requestType]} · ${ckrRequestStatusLabels[request.status]}`}
      />

      <section className="space-y-2">
        <Badge variant="soft">{ckrRequestStatusLabels[request.status]}</Badge>
        <p className="whitespace-pre-wrap text-sm">{request.body}</p>
        {request.nextStepPublic ? (
          <p className="text-sm text-muted">
            Следующий шаг: {request.nextStepPublic}
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Ответы ЦКР</h2>
        <ul className="space-y-2 text-sm">
          {clientComments.map((c) => (
            <li key={c.id} className="border-b border-border pb-2">
              <span className="text-muted">
                {new Date(c.createdAt).toLocaleString("ru-RU")}
              </span>
              <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
          {!clientComments.length ? (
            <p className="text-muted">Пока нет публичных ответов.</p>
          ) : null}
        </ul>
      </section>

      <form action={addCkrRequestCommentAction} className="space-y-2">
        <h2 className="font-display text-lg">Сообщение в ЦКР</h2>
        <input type="hidden" name="requestId" value={request.id} />
        <input type="hidden" name="visibility" value="CLIENT" />
        <textarea
          name="body"
          rows={3}
          required
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-sm bg-accent px-3 py-2 text-sm text-white"
        >
          Отправить
        </button>
      </form>

      <section className="space-y-1 text-sm text-muted">
        <h2 className="font-display text-lg text-foreground">История</h2>
        {clientEvents.map((e) => (
          <p key={e.id}>
            {e.title} · {new Date(e.createdAt).toLocaleString("ru-RU")}
          </p>
        ))}
      </section>
    </div>
  );
}
