import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  CKR_REQUEST_PRIORITIES,
  CKR_REQUEST_STATUSES,
  ckrRequestPriorityLabels,
  ckrRequestSourceLabels,
  ckrRequestStatusLabels,
  ckrRequestTypeLabels,
  intentDraftFromRequestType,
} from "@/config/ckr-inbox";
import { setUserCabinetAccessAction } from "@/features/idea-first/access-actions";
import {
  assignCkrRequestAction,
  createNeedFromCkrRequestAction,
  createTaskFromCkrRequestAction,
  createDealFromCkrRequestAction,
  generateLiaBriefAction,
  updateCkrRequestPriorityAction,
  updateCkrRequestStatusAction,
} from "@/features/ckr-inbox/actions";
import { OwnerClientCabinetPanel } from "@/features/ckr-inbox/components/owner-client-cabinet-panel";
import { OwnerOneDesk } from "@/features/ckr-action-loop/components/owner-one-desk";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  deriveActionsFromEvents,
} from "@/lib/ckr-action-loop";
import { getDemandWorkbench } from "@/lib/demand-intelligence/workbench";
import {
  getCkrRequestById,
  listCkrComments,
  listCkrEvents,
} from "@/lib/ckr-inbox/queries";
import { getOrganizationById } from "@/lib/partners/queries";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return { title: `Заявка ${params.id.slice(0, 8)} · Inbox` };
}

export default async function OwnerInboxDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const staff = await requireStaff(`/admin/owner/inbox/${params.id}`);
  const request = await getCkrRequestById(params.id, { includeInternal: true });
  if (!request) notFound();

  const [comments, events, org, workbench] = await Promise.all([
    listCkrComments(request.id),
    listCkrEvents(request.id),
    request.organizationId
      ? getOrganizationById(request.organizationId)
      : Promise.resolve(null),
    getDemandWorkbench({
      requestId: request.id,
      needProfileId: request.needProfileId,
      ownerUserId: request.fromUserId || staff.user.id,
      limit: 8,
    }),
  ]);

  const supabase = createClient();
  const { data: assigneeProfile } = request.assignedTo
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", request.assignedTo)
        .maybeSingle()
    : { data: null };
  const { data: fromProfile } = request.fromUserId
    ? await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("id", request.fromUserId)
        .maybeSingle()
    : { data: null };

  const draft = intentDraftFromRequestType(request.requestType);
  const contactBits = [
    request.contactPhone && `тел. ${request.contactPhone}`,
    request.contactTelegram && `Telegram ${request.contactTelegram}`,
    request.contactEmail && request.contactEmail,
  ].filter(Boolean);
  const isAnonymousIdea =
    !request.fromUserId && request.source === "public_idea_form";
  const lastClientMessage =
    [...comments]
      .reverse()
      .find((c) => c.visibility === "CLIENT")
      ?.body || "";

  const actions = deriveActionsFromEvents(
    events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      meta: e.meta,
      createdAt: e.createdAt,
      visibility: e.visibility,
    })),
    { requestId: request.id, includeInternalNotes: true },
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <Link
          href="/admin/owner/inbox"
          className="text-sm text-accent hover:underline"
        >
          ← Заявки
        </Link>
        <SectionHeading
          className="mt-3"
          eyebrow={isAnonymousIdea ? "Новая идея" : "Обращение"}
          title={request.subject || "Обращение в ЦКР"}
          description={`${ckrRequestTypeLabels[request.requestType]} · ${ckrRequestStatusLabels[request.status]}`}
        />
      </div>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Клиент</h2>
        <p className="text-sm">
          {request.contactName ||
            fromProfile?.full_name ||
            request.fromUserId ||
            "Без имени"}
          {isAnonymousIdea ? (
            <span className="text-muted"> · без регистрации</span>
          ) : null}
          {org ? (
            <>
              {" · "}
              <Link
                href={`/organizations/${org.id}`}
                className="text-accent hover:underline"
              >
                {org.name}
              </Link>{" "}
              ({org.type}) · {org.region || "регион?"}
            </>
          ) : null}
        </p>
        <p className="text-sm text-muted">
          Контакт:{" "}
          {contactBits.length
            ? contactBits.join(" · ")
            : "Не указан"}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Заявка</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">{ckrRequestStatusLabels[request.status]}</Badge>
          <Badge variant="accent">
            {ckrRequestPriorityLabels[request.priority]}
          </Badge>
          <Badge variant="soft">
            {ckrRequestSourceLabels[request.source] || request.source}
          </Badge>
        </div>
        <p className="whitespace-pre-wrap text-sm text-foreground">
          {request.body}
        </p>
        <p className="text-xs text-muted">
          {new Date(request.createdAt).toLocaleString("ru-RU")}
          {request.sourceId ? ` · source ${request.sourceTable}:${request.sourceId}` : ""}
        </p>
      </section>

      <OwnerClientCabinetPanel
        requestId={request.id}
        status={request.status}
        requestType={request.requestType}
        organizationName={org?.name || null}
        publicActivityText={request.publicActivityText}
        nextStepPublic={request.nextStepPublic}
        lastClientMessage={lastClientMessage}
      />

      <OwnerOneDesk
        requestId={request.id}
        needProfileId={request.needProfileId}
        needTitle={workbench.needTitle}
        total={workbench.total}
        confirmed={workbench.confirmed}
        potential={workbench.potential}
        review={workbench.review}
        emptyReason={workbench.emptyReason}
        oiReviewCount={workbench.oiReviewCount}
        queryPlanSamples={workbench.queryPlanSamples}
        actions={actions}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <form action={updateCkrRequestStatusAction} className="space-y-2">
          <input type="hidden" name="requestId" value={request.id} />
          <label className="block text-sm">
            Статус (вручную)
            <select
              name="status"
              defaultValue={request.status}
              className="mt-1 h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
            >
              {CKR_REQUEST_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ckrRequestStatusLabels[s]}
                </option>
              ))}
            </select>
          </label>
          {request.status === "WAITING_CLIENT" &&
          !request.nextStepPublic.trim() ? (
            <p className="text-xs text-amber-700">
              Статус «Ждём клиента», но next_step_public пуст — укажите, что
              нужно от клиента в блоке выше.
            </p>
          ) : null}
          <button
            type="submit"
            className="rounded-sm bg-accent px-3 py-2 text-sm text-white"
          >
            Обновить статус
          </button>
        </form>

        <form action={updateCkrRequestPriorityAction} className="space-y-2">
          <input type="hidden" name="requestId" value={request.id} />
          <label className="block text-sm">
            Приоритет
            <select
              name="priority"
              defaultValue={request.priority}
              className="mt-1 h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
            >
              {CKR_REQUEST_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {ckrRequestPriorityLabels[p]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-sm border border-border px-3 py-2 text-sm"
          >
            Обновить приоритет
          </button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Ответственный</h2>
        <p className="text-sm text-muted">
          Сейчас: {assigneeProfile?.full_name || request.assignedTo || "не назначен"}
        </p>
        <form action={assignCkrRequestAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="requestId" value={request.id} />
          <input
            name="assignedTo"
            defaultValue={request.assignedTo || staff.user.id}
            placeholder="user id"
            className="h-10 min-w-[16rem] flex-1 rounded-sm border border-border bg-surface px-3 text-sm"
          />
          <button
            type="submit"
            className="rounded-sm bg-accent px-3 py-2 text-sm text-white"
          >
            Назначить
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Потребность</h2>
        {request.needProfileId ? (
          <p className="text-sm">
            Связана:{" "}
            <code className="text-xs">{request.needProfileId}</code>
          </p>
        ) : (
          <p className="text-sm text-muted">
            Черновик: {draft.intentType} — {draft.hint}. Подтвердите создание.
          </p>
        )}
        <form action={createNeedFromCkrRequestAction} className="space-y-2">
          <input type="hidden" name="requestId" value={request.id} />
          <input
            name="intentType"
            defaultValue={draft.intentType}
            className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          />
          <input
            name="title"
            defaultValue={request.subject}
            className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          />
          <textarea
            name="description"
            defaultValue={request.body}
            rows={3}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          />
          <input
            name="regions"
            defaultValue={request.region || "Дагестан"}
            className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          />
          <input
            name="linkExistingId"
            placeholder="Или ID существующей потребности"
            className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirm" /> Подтверждаю создание
            потребности
          </label>
          <button
            type="submit"
            className="rounded-sm bg-accent px-3 py-2 text-sm text-white"
          >
            Создать / связать потребность
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Поручить Лие · Brief</h2>
        <form action={generateLiaBriefAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <button
            type="submit"
            className="rounded-sm border border-border px-3 py-2 text-sm"
          >
            Подготовить LIA brief (без MATCHES / outreach)
          </button>
        </form>
        <p className="text-xs text-muted">
          Если Лия недоступна — разбор выполняется вручную. Flow обращения не
          зависит от AI.
        </p>
        {request.liaBrief ? (
          <pre className="overflow-auto rounded-sm border border-border bg-surface p-3 text-xs">
            {JSON.stringify(request.liaBrief, null, 2)}
          </pre>
        ) : null}
      </section>

      {request.fromUserId ? (
        <section className="space-y-2">
          <h2 className="font-display text-lg">Доступ кабинета пользователя</h2>
          <p className="text-xs text-muted">
            Progressive disclosure: basic → standard → advanced. Не создаёт
            Project/Need автоматически.
          </p>
          <form
            action={setUserCabinetAccessAction}
            className="flex flex-wrap gap-2"
          >
            <input type="hidden" name="userId" value={request.fromUserId} />
            <select
              name="accessLevel"
              defaultValue="standard"
              className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
            >
              <option value="basic">basic</option>
              <option value="standard">standard</option>
              <option value="advanced">advanced</option>
            </select>
            <button
              type="submit"
              className="rounded-sm border border-border px-3 py-2 text-sm"
            >
              Открыть доступ
            </button>
          </form>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-lg">Задача</h2>
        <form action={createTaskFromCkrRequestAction} className="space-y-2">
          <input type="hidden" name="requestId" value={request.id} />
          <input
            name="title"
            defaultValue="Связаться с клиентом"
            className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          />
          <input
            name="description"
            defaultValue="Уточнить объём и ассортимент"
            className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
          />
          <button
            type="submit"
            className="rounded-sm border border-border px-3 py-2 text-sm"
          >
            Создать задачу
          </button>
        </form>
        {request.linkedTaskId ? (
          <p className="text-xs text-muted">Task: {request.linkedTaskId}</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Сделка</h2>
        {request.dealId ? (
          <p className="text-sm">
            Связана: <code className="text-xs">{request.dealId}</code>
          </p>
        ) : (
          <form action={createDealFromCkrRequestAction} className="space-y-2">
            <input type="hidden" name="requestId" value={request.id} />
            <input
              name="projectId"
              required
              placeholder="UUID проекта (обязательно)"
              className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
            />
            <input
              name="description"
              defaultValue={request.subject}
              className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm"
            />
            <button
              type="submit"
              className="rounded-sm border border-border px-3 py-2 text-sm"
            >
              Создать сделку (вручную)
            </button>
          </form>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Комментарии</h2>
        <p className="text-xs text-muted">
          Новые сообщения — в блоке «Что видит клиент» (CLIENT / INTERNAL
          разделены визуально).
        </p>
        <ul className="space-y-2 text-sm">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-border pb-2">
              <Badge variant={c.visibility === "CLIENT" ? "accent" : "soft"}>
                {c.visibility === "CLIENT" ? "Клиенту" : "ЦКР"}
              </Badge>{" "}
              <span className="text-muted">
                {c.authorName || c.authorId.slice(0, 8)} ·{" "}
                {new Date(c.createdAt).toLocaleString("ru-RU")}
              </span>
              <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">История</h2>
        <ul className="space-y-1 text-sm text-muted">
          {events.map((e) => (
            <li key={e.id}>
              <span className="text-foreground">{e.eventType}</span> — {e.title}
              {e.detail ? `: ${e.detail}` : ""} ·{" "}
              {new Date(e.createdAt).toLocaleString("ru-RU")}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
