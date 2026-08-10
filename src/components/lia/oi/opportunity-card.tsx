import {
  liaOiPriorityLabels,
  liaOiStatusLabels,
} from "@/config/lia-oi";
import type { LiaOiCandidate } from "@/types/lia-oi";
import Link from "next/link";

export function OpportunityCard({ item }: { item: LiaOiCandidate }) {
  return (
    <article className="rounded-sm border border-border bg-surface p-5 transition-colors hover:border-accent/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            {liaOiStatusLabels[item.status]} ·{" "}
            {liaOiPriorityLabels[item.score.priority]}
          </p>
          <h3 className="mt-2 font-display text-xl text-foreground">
            <Link
              href={`/admin/owner/lia/opportunities/${item.id}`}
              className="hover:text-accent"
            >
              {item.title}
            </Link>
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {item.summary || item.description}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="text-foreground">
            Потенциал{" "}
            <span className="font-semibold">{item.score.overall}</span>/100
          </p>
          <p className="text-muted">
            Уверенность {item.score.confidence}/100
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {item.region ? <span>{item.region}</span> : null}
        {item.industry ? <span>{item.industry}</span> : null}
        <span>
          Источников: {item.sources.length}
          {" · "}
          {item.isStub || item.sources.every((s) => s.isStub) ? "STUB" : "LIVE"}
        </span>
        {(item.investmentRequired ?? item.askingPrice) != null ? (
          <span>
            {(item.investmentRequired ?? item.askingPrice)!.toLocaleString(
              "ru-RU",
            )}{" "}
            ₽
          </span>
        ) : null}
      </div>
    </article>
  );
}
