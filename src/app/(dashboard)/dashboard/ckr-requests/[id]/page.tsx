import { RequestProgress } from "@/components/client-cabinet/request-progress";
import {
  appendIdeaSupplementAction,
  replyToCkrRequestAction,
} from "@/features/client-cabinet/actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  describeCkrNow,
  describeHumanStatus,
  describeRequestTitle,
  describeWhatYouNeed,
  formatClientDate,
  humanizeClientEvent,
} from "@/lib/ckr-inbox/client-presentation";
import {
  getCkrRequestById,
  listCkrComments,
  listCkrEvents,
} from "@/lib/ckr-inbox/queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
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

  // Defense in depth beyond RLS
  const owns =
    request.fromUserId === current.user.id ||
    (request.organizationId
      ? await (async () => {
          const supabase = createClient();
          const { data } = await supabase
            .from("organization_members")
            .select("id")
            .eq("organization_id", request.organizationId!)
            .eq("user_id", current.user.id)
            .maybeSingle();
          return Boolean(data);
        })()
      : false);
  if (!owns && !current.roles.includes("admin")) {
    notFound();
  }

  const [comments, events] = await Promise.all([
    listCkrComments(request.id),
    listCkrEvents(request.id),
  ]);
  const clientComments = comments.filter((c) => c.visibility === "CLIENT");
  const history = events
    .filter((e) => e.visibility === "CLIENT")
    .map((e) => ({
      id: e.id,
      createdAt: e.createdAt,
      text: humanizeClientEvent(e),
    }))
    .filter((e): e is { id: string; createdAt: string; text: string } =>
      Boolean(e.text),
    );

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

  const title = describeRequestTitle({
    subject: request.subject,
    body: request.body,
    requestType: request.requestType,
    organizationName,
  });
  const nowText = describeCkrNow({
    requestType: request.requestType,
    status: request.status,
    organizationName,
  });
  const need = describeWhatYouNeed({
    status: request.status,
    nextStepPublic: request.nextStepPublic,
  });
  const statusText = describeHumanStatus({
    status: request.status,
    requestType: request.requestType,
  });

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/ckr-requests"
        className="text-sm text-accent hover:underline"
      >
        ← Мои обращения
      </Link>

      <header className="space-y-3">
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm text-muted">{statusText}</p>
        <RequestProgress status={request.status} />
      </header>

      <section className="space-y-2">
        <h2 className="font-display text-lg text-foreground">Ваша идея</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {request.body}
        </p>
        {(request.contactPhone ||
          request.contactEmail ||
          request.contactTelegram) && (
          <p className="text-xs text-muted">
            Контакт:{" "}
            {[request.contactPhone, request.contactEmail, request.contactTelegram]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-sm border border-border bg-surface/50 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Сейчас ЦКР
          </p>
          <p className="mt-1 font-display text-lg text-foreground">{nowText}</p>
        </div>
        <div
          className={
            need.needsAction
              ? "rounded-sm border border-accent/40 bg-accent-muted/40 p-3"
              : undefined
          }
        >
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Что нужно от вас
          </p>
          <p className="mt-1 text-sm text-foreground">{need.text}</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg text-foreground">
          Сообщения от ЦКР
        </h2>
        <ul className="space-y-3">
          {clientComments.map((c) => {
            const mine = c.authorId === current.user.id;
            return (
              <li
                key={c.id}
                className={cn(
                  "rounded-sm border px-3 py-3 text-sm",
                  mine
                    ? "border-border bg-background"
                    : "border-accent/30 bg-accent-muted/30",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-foreground">
                    {mine ? "Вы" : "ЦКР"}
                  </p>
                  <p className="text-xs text-muted">
                    {formatClientDate(c.createdAt)}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">
                  {c.body}
                </p>
              </li>
            );
          })}
          {!clientComments.length ? (
            <p className="text-sm text-muted">
              Пока нет сообщений. Когда ЦКР ответит — сообщение появится здесь.
            </p>
          ) : null}
        </ul>

        <form action={replyToCkrRequestAction} className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">
            Написать ЦКР
          </h3>
          <input type="hidden" name="requestId" value={request.id} />
          <textarea
            name="body"
            rows={3}
            required
            placeholder="Ваш ответ или вопрос…"
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-sm bg-accent px-3 py-2 text-sm text-white"
          >
            Отправить сообщение
          </button>
        </form>
      </section>

      <section className="space-y-2 border-t border-border pt-6">
        <h2 className="font-display text-lg text-foreground">Дополнить идею</h2>
        <p className="text-sm text-muted">
          Добавьте детали своими словами. Первоначальный текст идеи сохранится.
        </p>
        <form action={appendIdeaSupplementAction} className="space-y-2">
          <input type="hidden" name="requestId" value={request.id} />
          <textarea
            name="body"
            rows={4}
            required
            minLength={5}
            placeholder="Например: забыл указать, что можем поставлять до 20 тонн в месяц."
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-sm border border-border px-3 py-2 text-sm"
          >
            Сохранить дополнение
          </button>
        </form>
      </section>

      <section className="space-y-2 border-t border-border pt-6">
        <h2 className="font-display text-lg text-foreground">История</h2>
        {history.length ? (
          <ul className="space-y-2 text-sm">
            {history.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-3 gap-y-1">
                <span className="text-muted">{formatClientDate(e.createdAt)}</span>
                <span className="text-foreground">{e.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            История появится по мере работы ЦКР.
          </p>
        )}
      </section>
    </div>
  );
}
