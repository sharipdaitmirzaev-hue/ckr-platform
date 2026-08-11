import {
  liaOiBudgetFitLabels,
  liaOiContentIntentLabels,
  liaOiMatchingReadinessLabels,
  liaOiPageTypeLabels,
  liaOiPriorityLabels,
  liaOiStatusLabels,
} from "@/config/lia-oi";
import { deadlineLabel } from "@/lib/lia/oi/sources/deadline";
import { LIA_OI_OPPORTUNITY_TYPE_LABELS } from "@/lib/lia/oi/sources/registry";
import type { LiaOiCandidate } from "@/types/lia-oi";
import Link from "next/link";

export function OpportunityCard({ item }: { item: LiaOiCandidate }) {
  const pageType = item.pageType ?? "UNKNOWN";
  const quality = item.score.quality ?? 0;
  const budgetFit = item.budgetFit ?? "UNKNOWN";
  const contentIntent = item.contentIntent ?? "UNKNOWN";
  const price = item.askingPrice ?? item.investmentRequired;
  const sourceUrl = item.sources[0]?.url;
  const typeLabel =
    LIA_OI_OPPORTUNITY_TYPE_LABELS[item.opportunityType || "WEB_LISTING"] ||
    item.opportunityType;
  const deadlineText = deadlineLabel(item.daysRemaining ?? null);

  return (
    <article className="rounded-sm border border-border bg-surface p-5 transition-colors hover:border-accent/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            {liaOiStatusLabels[item.status]} ·{" "}
            {liaOiPriorityLabels[item.score.priority]} ·{" "}
            {liaOiPageTypeLabels[pageType]} ·{" "}
            {liaOiContentIntentLabels[contentIntent]}
            {typeLabel ? ` · ${typeLabel}` : ""}
          </p>
          <h3 className="mt-2 font-display text-xl text-foreground">
            <Link
              href={`/admin/owner/lia/opportunities/${item.id}`}
              className="hover:text-accent"
            >
              {item.title}
            </Link>
          </h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {item.isOfficialSource ? (
              <span className="border border-accent/40 px-2 py-0.5 text-accent">
                Официальный источник
              </span>
            ) : null}
            {deadlineText ? (
              <span className="border border-border px-2 py-0.5 text-foreground">
                {deadlineText}
              </span>
            ) : null}
            {item.matchingReadiness ? (
              <span className="border border-border px-2 py-0.5 text-muted">
                Matching:{" "}
                {liaOiMatchingReadinessLabels[item.matchingReadiness]}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {item.summary || item.description}
          </p>
          {item.isCatalogSource || item.resultBucket === "SOURCE_CATALOGS" ? (
            <p className="mt-2 text-sm text-accent">
              Это источник для дальнейшего поиска, а не конкретная возможность.
            </p>
          ) : null}
          {item.priceStatus === "UNKNOWN" ? (
            <p className="mt-2 text-sm text-accent">
              Подтверждённая цена отсутствует (price_status=UNKNOWN).
            </p>
          ) : null}
          {item.budgetFit === "OVER_BUDGET" ? (
            <p className="mt-2 text-sm text-accent">
              Отсеяно по бюджету: цена выше hard max_budget.
            </p>
          ) : null}
          {(item.whyRecommend?.length || item.score.whyTop?.length) ? (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted">
              {(item.whyRecommend ?? item.score.whyTop)
                .slice(0, 4)
                .map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
            </ul>
          ) : null}
          {item.missingFields?.length ? (
            <p className="mt-2 text-xs text-muted">
              Не хватает: {item.missingFields.slice(0, 4).join(", ")}
            </p>
          ) : null}
        </div>
        <div className="text-right text-sm">
          <p className="text-foreground">
            Opportunity{" "}
            <span className="font-semibold">
              {item.score.opportunity ?? item.score.overall}
            </span>
            /100
          </p>
          <p className="text-muted">Качество данных {quality}%</p>
          <p className="text-muted">
            Уверенность {item.score.confidence}/100
          </p>
          <p className="mt-1 text-muted">
            Бюджет: {liaOiBudgetFitLabels[budgetFit]}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {item.region ? <span>{item.region}</span> : null}
        {item.industry ? <span>{item.industry}</span> : null}
        <span>
          {item.sources[0]?.name ?? "источник"}
          {" · "}
          {item.isStub || item.sources.every((s) => s.isStub) ? "STUB" : "LIVE"}
          {item.enrichedFromFetch ? " · fetch" : ""}
        </span>
        {price != null ? (
          <span>
            {price.toLocaleString("ru-RU")} ₽
            {item.priceKind ? ` · ${item.priceKind}` : ""}
          </span>
        ) : (
          <span>цена UNKNOWN</span>
        )}
        {item.firstSeenAt ? (
          <span>
            найдено{" "}
            {new Date(item.firstSeenAt).toLocaleDateString("ru-RU")}
          </span>
        ) : null}
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            источник
          </a>
        ) : null}
      </div>
    </article>
  );
}
