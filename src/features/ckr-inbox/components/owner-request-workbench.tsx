import { Badge } from "@/components/ui/badge";
import { shareCandidateWithClientAction } from "@/features/ckr-inbox/request-workbench-actions";
import type { WorkbenchCandidateView } from "@/lib/ckr-inbox/request-workbench";
import Link from "next/link";

export function OwnerRequestWorkbench(props: {
  requestId: string;
  needProfileId: string | null;
  needTitle: string | null;
  total: number;
  candidates: WorkbenchCandidateView[];
  emptyReason: string | null;
}) {
  const { candidates, emptyReason, needProfileId, needTitle, requestId, total } =
    props;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg">Найденные возможности</h2>
        {total > 0 ? (
          <p className="text-sm text-muted">Найдено {total} вариант(а)</p>
        ) : null}
      </div>
      <p className="text-sm text-muted">
        Сигналы спроса по связанной потребности
        {needTitle ? (
          <>
            {" "}
            «{needTitle}»
          </>
        ) : null}
        . Это не подтверждённые покупатели — каждый вариант нужно проверить.
      </p>

      {!needProfileId ? (
        <p className="text-sm text-amber-800">
          {emptyReason ||
            "Сначала создайте или свяжите потребность — тогда здесь появятся варианты."}
        </p>
      ) : null}

      {needProfileId && !candidates.length ? (
        <div className="space-y-2 text-sm text-muted">
          <p>{emptyReason}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/admin/owner/publishing"
              className="text-accent hover:underline"
            >
              К публикации
            </Link>
            <Link
              href="/admin/opportunities"
              className="text-accent hover:underline"
            >
              Возможности
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
      ) : null}

      <ul className="space-y-4">
        {candidates.map((c, idx) => (
          <li
            key={c.recommendationId}
            className="space-y-2 border-b border-border pb-4 last:border-0"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium text-foreground">
                {idx + 1}. {c.title}
              </p>
              <Badge variant="soft">{c.qualityHint}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="accent">{c.signalTypeLabel}</Badge>
              <Badge variant="soft">{c.signalStatusLabel}</Badge>
              {c.region ? <Badge variant="soft">{c.region}</Badge> : null}
            </div>
            <p className="text-sm text-foreground">
              Почему подходит:{" "}
              {c.matched.length
                ? c.matched.join(" · ")
                : c.why.slice(0, 160)}
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
                href="/admin/owner/publishing"
                className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-surface"
              >
                Проверить
              </Link>
              {c.shareable ? (
                <form action={shareCandidateWithClientAction}>
                  <input type="hidden" name="requestId" value={requestId} />
                  <input type="hidden" name="itemType" value={c.itemType} />
                  <input type="hidden" name="itemId" value={c.itemId} />
                  <input type="hidden" name="title" value={c.title} />
                  <input
                    type="hidden"
                    name="signalTypeLabel"
                    value={c.signalTypeLabel}
                  />
                  <input type="hidden" name="region" value={c.region || ""} />
                  <input
                    type="hidden"
                    name="whyShort"
                    value={
                      c.matched.length
                        ? `Эта ${c.signalTypeLabel.toLowerCase()} может соответствовать ассортименту (${c.matched.join(", ")}). ЦКР рекомендует проверить условия участия.`
                        : "Эта закупка / сигнал спроса может соответствовать вашему запросу. ЦКР рекомендует проверить условия участия."
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
                  Не опубликовано — сначала «К публикации»
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {candidates.length > 0 ? (
        <div className="flex flex-wrap gap-3 text-sm">
          {needProfileId ? (
            <Link
              href={`/dashboard/for-you?need=${needProfileId}`}
              className="text-accent hover:underline"
            >
              Показать ещё варианты
            </Link>
          ) : null}
          <Link
            href="/admin/owner/publishing"
            className="text-accent hover:underline"
          >
            К публикации
          </Link>
          <Link
            href="/admin/opportunities"
            className="text-accent hover:underline"
          >
            Все возможности
          </Link>
        </div>
      ) : null}
    </section>
  );
}
