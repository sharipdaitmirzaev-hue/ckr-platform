import { OpportunityActions } from "@/components/lia/oi/opportunity-actions";
import {
  liaOiPriorityLabels,
  liaOiStatusLabels,
} from "@/config/lia-oi";
import { getCandidate } from "@/lib/lia/oi/store";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { id: string } };

export function generateMetadata({ params }: Props): Metadata {
  const item = getCandidate(params.id);
  return { title: item?.title ?? "Возможность Лии" };
}

export default function LiaOiOpportunityDetailPage({ params }: Props) {
  const item = getCandidate(params.id);
  if (!item) notFound();

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
          {liaOiPriorityLabels[item.score.priority]}
        </p>
        <h2 className="mt-2 font-display text-3xl text-foreground">
          {item.title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted">
          {item.summary}
        </p>
      </div>

      <OpportunityActions candidateId={item.id} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-display text-lg text-foreground">Почему интересно</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {item.whyInteresting.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="font-display text-lg text-foreground">Оценка Лии</h3>
          <p className="text-sm text-foreground">
            Потенциал <strong>{item.score.overall}</strong>/100 · Уверенность{" "}
            <strong>{item.score.confidence}</strong>/100
          </p>
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

      <section className="space-y-2">
        <h3 className="font-display text-lg text-foreground">Рекомендация</h3>
        <p className="text-sm text-muted">{item.recommendation}</p>
        <p className="text-sm text-foreground">Следующий шаг: {item.nextStep}</p>
      </section>
    </div>
  );
}
