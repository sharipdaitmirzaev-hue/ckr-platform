import { OpportunityActions } from "@/components/lia/oi/opportunity-actions";
import {
  liaOiBudgetFitLabels,
  liaOiContentIntentLabels,
  liaOiPageTypeLabels,
  liaOiPriorityLabels,
  liaOiStatusLabels,
} from "@/config/lia-oi";
import {
  getCandidate,
  listOpportunityChanges,
  listOpportunityEvents,
} from "@/lib/lia/oi/store";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getCandidate(params.id);
  return { title: item?.title ?? "Возможность Лии" };
}

export default async function LiaOiOpportunityDetailPage({ params }: Props) {
  const item = await getCandidate(params.id);
  if (!item) notFound();
  const pageType = item.pageType ?? "UNKNOWN";
  const contentIntent = item.contentIntent ?? "UNKNOWN";
  const budgetFit = item.budgetFit ?? "UNKNOWN";
  const events = await listOpportunityEvents(item.id);
  const changes = await listOpportunityChanges(item.id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/owner/lia/opportunities"
          className="text-sm text-accent hover:underline"
        >
          ← К ленте
        </Link>
        <p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">
          {liaOiStatusLabels[item.status]} ·{" "}
          {liaOiPriorityLabels[item.score.priority]} ·{" "}
          {liaOiPageTypeLabels[pageType]} ·{" "}
          {liaOiContentIntentLabels[contentIntent]}
        </p>
        <h2 className="mt-2 font-display text-3xl text-foreground">
          {item.title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted">
          {item.summary}
        </p>
        {item.isCatalogSource ? (
          <p className="mt-3 text-sm text-accent">
            Это источник для дальнейшего поиска, а не конкретная возможность.
          </p>
        ) : null}
        {item.priceStatus === "UNKNOWN" ? (
          <p className="mt-3 text-sm text-accent">
            Подтверждённая цена отсутствует (price_status=UNKNOWN).
          </p>
        ) : null}
      </div>

      <OpportunityActions candidateId={item.id} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-display text-lg text-foreground">
            Почему в TOP
          </h3>
          {item.score.whyTop?.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              {item.score.whyTop.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              {item.whyInteresting.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          <h3 className="pt-4 font-display text-lg text-foreground">
            Почему интересно
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {item.whyInteresting.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="font-display text-lg text-foreground">Оценка Лии</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Тип страницы</dt>
              <dd className="text-foreground">{liaOiPageTypeLabels[pageType]}</dd>
            </div>
            <div>
              <dt className="text-muted">Budget fit</dt>
              <dd className="text-foreground">{liaOiBudgetFitLabels[budgetFit]}</dd>
            </div>
            <div>
              <dt className="text-muted">detail_confidence</dt>
              <dd className="text-foreground">{item.detailConfidence ?? 0}/100</dd>
            </div>
            <div>
              <dt className="text-muted">Качество данных</dt>
              <dd className="text-foreground">{item.score.quality ?? 0}%</dd>
            </div>
            <div>
              <dt className="text-muted">Relevance</dt>
              <dd className="text-foreground">{item.score.relevance ?? 0}/100</dd>
            </div>
            <div>
              <dt className="text-muted">Opportunity</dt>
              <dd className="text-foreground">
                {item.score.opportunity ?? item.score.overall}/100
              </dd>
            </div>
            <div>
              <dt className="text-muted">Confidence</dt>
              <dd className="text-foreground">{item.score.confidence}/100</dd>
            </div>
            <div>
              <dt className="text-muted">Overall</dt>
              <dd className="text-foreground">{item.score.overall}/100</dd>
            </div>
          </dl>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {item.score.explanation.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lg text-foreground">Что найдено</h3>
        <p className="text-sm text-muted">{item.description}</p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Регион</dt>
            <dd className="text-foreground">{item.region ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Отрасль</dt>
            <dd className="text-foreground">{item.industry ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Цена / инвестиции</dt>
            <dd className="text-foreground">
              {(item.investmentRequired ?? item.askingPrice)?.toLocaleString(
                "ru-RU",
              ) ?? "UNKNOWN"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Найдено</dt>
            <dd className="text-foreground">
              {new Date(item.firstSeenAt).toLocaleString("ru-RU")}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lg text-foreground">
          Источники ({item.sources.length})
        </h3>
        <ul className="space-y-2 text-sm">
          {item.sources.map((s) => (
            <li key={s.id} className="rounded-sm border border-border px-3 py-2">
              <p className="text-foreground">
                {s.name} {s.isStub ? "· STUB" : "· LIVE"}
              </p>
              <a
                href={s.url}
                className="break-all text-accent hover:underline"
                target="_blank"
                rel="noreferrer noopener"
              >
                {s.url}
              </a>
              <p className="mt-1 text-xs text-muted">
                Обнаружено:{" "}
                {s.discoveredAt
                  ? new Date(s.discoveredAt).toLocaleString("ru-RU")
                  : new Date(item.firstSeenAt).toLocaleString("ru-RU")}
                {s.publishedAt ? ` · публикация: ${s.publishedAt}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lg text-foreground">
          Provenance (FACT / INFERENCE / ESTIMATE / UNKNOWN)
        </h3>
        <ul className="space-y-2 text-sm">
          {item.claims.map((c) => (
            <li key={`${c.field}-${c.value}`} className="border-l border-accent/40 pl-3">
              <span className="text-accent">{c.kind}</span> · {c.field}: {c.value}
              {c.note ? <span className="block text-muted">{c.note}</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div>
          <h3 className="font-display text-lg text-foreground">Риски</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {item.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg text-foreground">Неизвестно</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {item.unknowns.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg text-foreground">Проверить</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {item.toVerify.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lg text-foreground">История</h3>
        {events.length === 0 && changes.length === 0 ? (
          <p className="text-sm text-muted">Событий пока нет.</p>
        ) : (
          <ul className="space-y-2 text-sm text-muted">
            {events.map((e) => (
              <li key={e.id} className="border-l border-accent/40 pl-3">
                <span className="text-foreground">
                  {new Date(e.createdAt).toLocaleString("ru-RU")}
                </span>
                {" — "}
                {e.title}
                {e.detail ? (
                  <span className="block text-xs">{e.detail}</span>
                ) : null}
              </li>
            ))}
            {changes.slice(0, 10).map((c) => (
              <li key={c.id} className="border-l border-border pl-3">
                <span className="text-foreground">
                  {new Date(c.createdAt).toLocaleString("ru-RU")}
                </span>
                {" — "}
                поле {c.fieldName}: {c.oldValue ?? "—"} → {c.newValue ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-display text-lg text-foreground">Рекомендация</h3>
        <p className="text-sm text-muted">{item.recommendation}</p>
        <p className="text-sm text-foreground">Следующий шаг: {item.nextStep}</p>
      </section>
    </div>
  );
}
