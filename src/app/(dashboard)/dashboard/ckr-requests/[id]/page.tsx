import { SectionHeading } from "@/components/ui/section-heading";
import { addCkrRequestCommentAction } from "@/features/ckr-inbox/actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  describeCkrNow,
  describeNextStepPublic,
} from "@/lib/ckr-inbox/client-presentation";
import {
  getCkrRequestById,
  listCkrComments,
  listCkrEvents,
} from "@/lib/ckr-inbox/queries";
import { createClient } from "@/lib/supabase/server";
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

  const [comments, events] = await Promise.all([
    listCkrComments(request.id),
    listCkrEvents(request.id),
  ]);
  const clientComments = comments.filter((c) => c.visibility === "CLIENT");
  const clientEvents = events.filter((e) => e.visibility === "CLIENT");

  let organizationName: string | null = null;
  if (request.organizationId) {
    const supabase = createClient();
    const { data } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", request.organizationId)
      .maybeSingle();
    organizationName = (data as { name?: string } | null)?.name || null;
  }

  const nowText = describeCkrNow({
    requestType: request.requestType,
    status: request.status,
    organizationName,
  });
  const nextText = describeNextStepPublic({
    status: request.status,
    nextStepPublic: request.nextStepPublic,
  });

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/ckr-requests"
        className="text-sm text-accent hover:underline"
      >
        ← Мои обращения
      </Link>
      <SectionHeading
        title={organizationName || request.subject || "Обращение в ЦКР"}
        description={nowText}
      />

      <section className="space-y-3 rounded-sm border border-border bg-surface/50 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Сейчас ЦКР
          </p>
          <p className="mt-1 font-display text-lg text-foreground">{nowText}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Следующий шаг
          </p>
          <p className="mt-1 text-sm text-foreground">{nextText}</p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Ваша идея / запрос</h2>
        <p className="whitespace-pre-wrap text-sm">{request.body}</p>
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
        {clientEvents.length ? (
          clientEvents.map((e) => (
            <p key={e.id}>
              {e.title} · {new Date(e.createdAt).toLocaleString("ru-RU")}
            </p>
          ))
        ) : (
          <p>История появится по мере работы ЦКР.</p>
        )}
      </section>
    </div>
  );
}
