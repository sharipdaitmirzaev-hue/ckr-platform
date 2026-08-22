import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import {
  DEFAULT_GAP_SCENARIOS,
  evaluateContentGaps,
  strategiesForGapScenario,
} from "@/lib/lia/oi/content-gap";
import { getDiscoveryBudgetSnapshot, getSourceHealthRows } from "@/lib/lia/oi/source-health";
import { ensureLiaOiSeed } from "@/lib/lia/oi/pipeline";
import { listCandidates } from "@/lib/lia/oi/store";
import { dagestanCoverageFromCandidates } from "@/lib/lia/oi/regional/coverage";
import {
  evaluateSourcePerformance,
  formatSourcePerformanceRu,
} from "@/lib/lia/oi/regional/source-performance";
import { listRegionalSources } from "@/lib/lia/oi/regional/source-registry";
import type { Metadata } from "next";
import Link from "next/link";
import { ContentGapActions } from "@/features/controlled-publish/content-gap-actions";

export const metadata: Metadata = { title: "Content Gap · Owner" };
export const dynamic = "force-dynamic";

export default async function OwnerContentGapPage() {
  const current = await requireLiaOiOwner();
  await ensureLiaOiSeed(current.user.id);
  const candidates = await listCandidates();
  const gaps = evaluateContentGaps(candidates, DEFAULT_GAP_SCENARIOS);
  const health = getSourceHealthRows();
  const budgets = getDiscoveryBudgetSnapshot();
  const dag = dagestanCoverageFromCandidates(candidates);
  const perf = evaluateSourcePerformance(candidates);
  const dagSources = listRegionalSources({ region: "Дагестан", enabledOnly: true });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Владелец · Stage 4E"
        title="Чего не хватает ЦКР"
        description="Content Gap + региональные source strategies. Manual targeted discovery — не Scheduler. Без автопубликации."
      />

      <p className="text-sm space-x-4">
        <Link href="/admin/owner/publishing" className="text-accent hover:underline">
          ← К публикации
        </Link>
        <Link href="/admin/owner/regional" className="text-accent hover:underline">
          Региональная сводка
        </Link>
      </p>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Дагестан · срез</h2>
        <p className="text-sm text-muted">
          OI {dag.oiTotal} · GOOD {dag.good} · READY {dag.ready} · contracts{" "}
          {dag.contracts} · support {dag.support} · confirmed demand{" "}
          {dag.confirmedDemand} · potential buyers {dag.potentialBuyers}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Source health</h2>
        <div className="flex flex-wrap gap-2">
          {health.map((h) => (
            <Badge key={h.id} variant={h.health === "OK" ? "accent" : undefined}>
              {h.label}: {h.health} ({h.statusRaw})
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted">
          Budgets/run: queries≤{budgets.maxQueriesPerRun}, results/query≤
          {budgets.maxResultsPerQuery}, safe-fetch≤{budgets.maxSafeFetchesPerRun}. API key
          не показывается.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Качество по источникам</h2>
        {perf.length === 0 ? (
          <p className="text-sm text-muted">Нет данных в текущей выборке store.</p>
        ) : (
          <ul className="space-y-1 text-sm text-muted">
            {perf.slice(0, 10).map((row) => (
              <li key={row.sourceId}>{formatSourcePerformanceRu(row)}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Источники Дагестана (enabled)</h2>
        <ul className="text-xs text-muted space-y-1">
          {dagSources.map((s) => (
            <li key={s.id}>
              {s.sourceName} · {s.domain} · {s.health} · intents{" "}
              {s.intents.join(", ")}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg">Gaps по сценариям</h2>
        {gaps.map((g) => {
          const scenario = DEFAULT_GAP_SCENARIOS.find((s) => s.id === g.scenarioId)!;
          const strategies = strategiesForGapScenario(scenario, 3);
          return (
            <article key={g.scenarioId} className="space-y-2 border-b border-border py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    g.gapSeverity === "CRITICAL"
                      ? "accent"
                      : undefined
                  }
                >
                  {g.gapSeverity}
                </Badge>
                <h3 className="font-display text-xl">{g.label}</h3>
              </div>
              <p className="text-sm text-muted">{g.messageRu}</p>
              <p className="text-xs text-muted">
                discovered {g.discovered} · DETAIL {g.detail} · publishable {g.publishable} ·
                READY {g.readyToReview} · enrich {g.needsEnrichment} · weak {g.weak} · good{" "}
                {g.goodEnoughForFeed}
              </p>
              <p className="text-xs text-muted">
                Strategies:{" "}
                {strategies.map((s) => s.domain || s.id).join(" · ") || "—"}
              </p>
              <ContentGapActions
                scenarioId={g.scenarioId}
                intentType={g.intentType}
                regions={g.regions}
                industries={g.industries}
              />
            </article>
          );
        })}
      </section>

      <p className="text-xs text-muted">
        OI в текущей выборке store: {candidates.length}. Matching Engine не запускается.
      </p>
    </div>
  );
}
