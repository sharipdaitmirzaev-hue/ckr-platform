"use client";

import { Badge } from "@/components/ui/badge";
import {
  findMoreDemandForRequestAction,
  shareDemandCandidateWithClientAction,
} from "@/features/ckr-inbox/demand-discovery-actions";
import type { DemandWorkbenchItem } from "@/lib/demand-intelligence/workbench";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

function CandidateCard(props: {
  requestId: string;
  c: DemandWorkbenchItem;
  idx: number;
}) {
  const { c, idx, requestId } = props;
  return (
    <li className="space-y-2 border-b border-border pb-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-foreground">
          {idx + 1}. {c.title}
        </p>
        <Badge variant="soft">{c.tierLabel}</Badge>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="accent">{c.signalTypeLabel}</Badge>
        <Badge variant="soft">{c.signalStatusLabel}</Badge>
        {c.region ? <Badge variant="soft">{c.region}</Badge> : null}
        {c.staffOnly ? <Badge variant="soft">Только ЦКР</Badge> : null}
      </div>
      <div className="space-y-1 text-sm text-muted">
        <p>Заказчик: {c.customer || "UNKNOWN"}</p>
        {c.subjectLabel || c.summary ? (
          <p>
            Что закупают:{" "}
            {(c.subjectLabel || c.summary || "").slice(0, 180) || "UNKNOWN"}
          </p>
        ) : (
          <p>Что закупают: UNKNOWN</p>
        )}
        <p>Регион: {c.region || "UNKNOWN"}</p>
        <p>НМЦК: {c.amountLabel || "UNKNOWN"}</p>
        <p>Приём заявок до: {c.deadlineLabel || "UNKNOWN"}</p>
        <p>
          Проверка: {c.verificationLabel || "требует проверки"}
        </p>
      </div>
      <p className="text-sm text-foreground">
        Почему подходит:{" "}
        {c.matched.length ? c.matched.join(" · ") : c.why.slice(0, 160)}
      </p>
      <p className="text-xs text-muted">
        Источник: {c.sourceLabel}
        {c.toVerify.length
          ? ` · Проверить: ${c.toVerify.slice(0, 2).join(", ")}`
          : ""}
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={c.href}
          className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-surface"
        >
          Открыть
        </Link>
        {c.canonicalUrl ? (
          <a
            href={c.canonicalUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-surface"
          >
            Источник
          </a>
        ) : null}
        <Link
          href={
            c.staffOnly
              ? `/admin/owner/lia/opportunities/${c.itemId}`
              : "/admin/owner/publishing"
          }
          className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-surface"
        >
          Проверить
        </Link>
        {c.shareable && !c.staffOnly ? (
          <form action={shareDemandCandidateWithClientAction}>
            <input type="hidden" name="requestId" value={requestId} />
            <input type="hidden" name="itemType" value={c.itemType} />
            <input type="hidden" name="itemId" value={c.itemId} />
            <input type="hidden" name="title" value={c.title} />
            <input type="hidden" name="region" value={c.region || ""} />
            <input type="hidden" name="tier" value={c.tier} />
            <input
              type="hidden"
              name="whyShort"
              value={
                c.matched.length
                  ? `Эта закупка может соответствовать ассортименту (${c.matched.join(", ")}). ЦКР рекомендует проверить условия участия.`
                  : "Мы рекомендуем проверить требования закупки."
              }
            />
            <input
              type="hidden"
              name="sourceUrl"
              value={c.canonicalUrl || ""}
            />
            <button
              type="submit"
              className="rounded-sm bg-accent px-3 py-1.5 text-sm text-white"
            >
              Показать клиенту
            </button>
          </form>
        ) : (
          <span className="self-center text-xs text-muted">
            {c.staffOnly
              ? "Сначала «К публикации» — клиенту нельзя показывать непроверенное"
              : "Не опубликовано"}
          </span>
        )}
      </div>
    </li>
  );
}

function Section(props: {
  title: string;
  items: DemandWorkbenchItem[];
  requestId: string;
  startIndex: number;
}) {
  if (!props.items.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">{props.title}</h3>
      <ul className="space-y-4">
        {props.items.map((c, i) => (
          <CandidateCard
            key={c.recommendationId}
            requestId={props.requestId}
            c={c}
            idx={props.startIndex + i}
          />
        ))}
      </ul>
    </div>
  );
}

function FindMoreSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-accent px-3 py-2 text-sm text-white disabled:opacity-60"
    >
      {pending ? "Ищем…" : "Найти ещё варианты"}
    </button>
  );
}

export function OwnerDemandWorkbench(props: {
  requestId: string;
  needProfileId: string | null;
  needTitle: string | null;
  total: number;
  confirmed: DemandWorkbenchItem[];
  potential: DemandWorkbenchItem[];
  review: DemandWorkbenchItem[];
  emptyReason: string | null;
  oiReviewCount: number;
  queryPlanSamples: string[];
  /** When true (One Desk), parent owns the section title. */
  embedded?: boolean;
}) {
  const {
    confirmed,
    potential,
    review,
    emptyReason,
    needProfileId,
    needTitle,
    requestId,
    total,
    oiReviewCount,
    queryPlanSamples,
    embedded,
  } = props;

  const [state, action] = useFormState(findMoreDemandForRequestAction, {});

  return (
    <div className="space-y-4">
      {!embedded ? (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg">
            Спрос и потенциальные покупатели
          </h2>
          {total > 0 ? (
            <p className="text-sm text-muted">Найдено {total} вариант(а)</p>
          ) : null}
        </div>
      ) : total > 0 ? (
        <p className="text-sm text-muted">Найдено {total} вариант(а)</p>
      ) : null}
      <p className="text-sm text-muted">
        Сигналы спроса по потребности
        {needTitle ? <> «{needTitle}»</> : null}. Закупка ≠ найденный покупатель.
        Непроверенные сигналы видит только сотрудник.
      </p>

      {needProfileId ? (
        <form action={action} className="space-y-2 rounded-sm border border-border p-3">
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="needProfileId" value={needProfileId} />
          <FindMoreSubmit />
          <p className="text-xs text-muted">
            Ручное расширение поиска. Без автопубликации и без сообщений
            клиенту.
          </p>
          {state.error ? (
            <p className="text-sm text-amber-800">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="text-sm text-foreground">{state.success}</p>
          ) : null}
          {state.summary ? (
            <pre className="overflow-auto whitespace-pre-wrap rounded-sm bg-surface p-2 text-xs text-muted">
              {state.summary}
            </pre>
          ) : null}
          {queryPlanSamples.length ? (
            <details className="text-xs text-muted">
              <summary>Пример запросов плана</summary>
              <ul className="mt-1 list-disc pl-4">
                {queryPlanSamples.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </form>
      ) : null}

      {!needProfileId ? (
        <p className="text-sm text-amber-800">
          {emptyReason || "Сначала свяжите потребность обращения."}
        </p>
      ) : null}

      {needProfileId && !total ? (
        <p className="text-sm text-muted">{emptyReason}</p>
      ) : null}

      <Section
        title="Подтверждённый спрос"
        items={confirmed}
        requestId={requestId}
        startIndex={1}
      />
      <Section
        title="Потенциальные покупатели"
        items={potential}
        requestId={requestId}
        startIndex={confirmed.length + 1}
      />
      <Section
        title="Требует проверки"
        items={review}
        requestId={requestId}
        startIndex={confirmed.length + potential.length + 1}
      />

      {oiReviewCount > 0 ? (
        <p className="text-xs text-muted">
          Внутренних вариантов на проверку: {oiReviewCount} (клиенту не
          видны).
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/owner/publishing"
          className="text-accent hover:underline"
        >
          К публикации
        </Link>
        <Link
          href="/admin/owner/lia/opportunities"
          className="text-accent hover:underline"
        >
          Попросить Лию проверить
        </Link>
        {needProfileId ? (
          <Link
            href={`/dashboard/for-you?need=${needProfileId}`}
            className="text-accent hover:underline"
          >
            Варианты клиента
          </Link>
        ) : null}
      </div>
    </div>
  );
}
