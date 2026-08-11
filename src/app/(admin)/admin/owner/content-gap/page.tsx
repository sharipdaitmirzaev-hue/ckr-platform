import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import {
  DEFAULT_GAP_SCENARIOS,
  evaluateContentGaps,
} from "@/lib/lia/oi/content-gap";
import { getDiscoveryBudgetSnapshot, getSourceHealthRows } from "@/lib/lia/oi/source-health";
import { ensureLiaOiSeed } from "@/lib/lia/oi/pipeline";
import { listCandidates } from "@/lib/lia/oi/store";
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

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Владелец · Stage 4D"
        title="Чего не хватает ЦКР"
        description="Content Gap diagnostics. Manual targeted discovery — не Scheduler. Без автопубликации."
      />

      <p className="text-sm">
        <Link href="/admin/owner/publishing" className="text-accent hover:underline">
          ← К публикации
        </Link>
      </p>

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

      <section className="space-y-4">
        <h2 className="font-display text-lg">Gaps по сценариям</h2>
        {gaps.map((g) => (
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
            <ContentGapActions
              scenarioId={g.scenarioId}
              intentType={g.intentType}
              regions={g.regions}
              industries={g.industries}
            />
          </article>
        ))}
      </section>

      <p className="text-xs text-muted">
        OI всего в store: {candidates.length}. Matching Engine не запускается.
      </p>
    </div>
  );
}
