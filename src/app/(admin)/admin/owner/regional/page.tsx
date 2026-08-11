import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { ensureLiaOiSeed } from "@/lib/lia/oi/pipeline";
import { listCandidates } from "@/lib/lia/oi/store";
import {
  buildRegionalCoverageCard,
  dagestanCoverageFromCandidates,
} from "@/lib/lia/oi/regional/coverage";
import { listRegionalSources } from "@/lib/lia/oi/regional/source-registry";
import {
  evaluateSourcePerformance,
  formatSourcePerformanceRu,
} from "@/lib/lia/oi/regional/source-performance";
import { MARKETPLACE_MANUAL_CONTENT_TYPES } from "@/lib/lia/oi/regional/marketplace-content";
import { summarizeInventory } from "@/lib/lia/oi/regional/test-data-inventory";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Регионы · Owner" };
export const dynamic = "force-dynamic";

export default async function OwnerRegionalPage() {
  const current = await requireLiaOiOwner();
  await ensureLiaOiSeed(current.user.id);
  const candidates = await listCandidates();
  const dag = dagestanCoverageFromCandidates(candidates);
  const skfo = buildRegionalCoverageCard({ region: "СКФО", candidates });
  const sources = listRegionalSources({ enabledOnly: false });
  const perf = evaluateSourcePerformance(candidates);
  const inventory = summarizeInventory();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Владелец · Stage 4E"
        title="Региональное покрытие"
        description="Дагестан — первая карточка экосистемы. СКФО — шаблон. Без Matching / Scheduler / auto-publish."
      />

      <p className="text-sm space-x-4">
        <Link href="/admin/owner/content-gap" className="text-accent hover:underline">
          Content Gap
        </Link>
        <Link href="/admin/owner/publishing" className="text-accent hover:underline">
          Публикация
        </Link>
      </p>

      <section className="space-y-3">
        <h2 className="font-display text-lg">ДАГЕСТАН</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="accent">OI {dag.oiTotal}</Badge>
          <Badge>DETAIL {dag.detail}</Badge>
          <Badge>READY {dag.ready}</Badge>
          <Badge>GOOD {dag.good}</Badge>
          <Badge>ACCEPTABLE {dag.acceptable}</Badge>
          <Badge>WEAK {dag.weak}</Badge>
        </div>
        <ul className="grid gap-1 text-sm text-muted sm:grid-cols-2">
          <li>Contracts (PROCUREMENT): {dag.contracts}</li>
          <li>Support: {dag.support}</li>
          <li>Investment-like: {dag.investmentLike}</li>
          <li>Confirmed demand: {dag.confirmedDemand}</li>
          <li>Potential buyers: {dag.potentialBuyers}</li>
          <li>
            Marketplace (если передано): projects{" "}
            {dag.marketplace?.projects ?? "—"} · businesses{" "}
            {dag.marketplace?.opportunities ?? "—"} · properties — · experts{" "}
            {dag.marketplace?.expertProfiles ?? "—"}
          </li>
        </ul>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Content gaps (Дагестан/СКФО)</h3>
          {dag.gaps.map((g) => (
            <p key={g.scenarioId} className="text-xs text-muted">
              <Badge
                variant={g.gapSeverity === "CRITICAL" ? "accent" : undefined}
              >
                {g.gapSeverity}
              </Badge>{" "}
              {g.label}: GOOD {g.goodEnoughForFeed} / publishable {g.publishable}
            </p>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">СКФО (сводка)</h2>
        <p className="text-sm text-muted">
          OI {skfo.oiTotal} · GOOD {skfo.good} · READY {skfo.ready} · confirmed
          demand {skfo.confirmedDemand}. Полное наполнение всех 7 регионов не
          требуется на Stage 4E.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Source quality</h2>
        {perf.length === 0 ? (
          <p className="text-sm text-muted">Нет кандидатов в текущем store page.</p>
        ) : (
          <ul className="space-y-1 text-sm text-muted">
            {perf.slice(0, 12).map((row) => (
              <li key={row.sourceId}>{formatSourcePerformanceRu(row)}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Региональные источники</h2>
        <ul className="space-y-2 text-sm">
          {sources.map((s) => (
            <li key={s.id} className="border-b border-border py-2">
              <span className="font-medium">{s.sourceName}</span>{" "}
              <Badge>{s.region}</Badge>{" "}
              <Badge variant={s.enabled ? "accent" : undefined}>
                {s.enabled ? "enabled" : "off"}
              </Badge>{" "}
              <span className="text-muted">
                {s.domain} · {s.health} · {s.accessMethod}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Marketplace (ручное)</h2>
        <p className="text-sm text-muted">
          Безопасные типы контента для владельца — без fake listings.
        </p>
        <ul className="text-sm text-muted space-y-1">
          {MARKETPLACE_MANUAL_CONTENT_TYPES.map((t) => (
            <li key={t.type}>
              <Link href={t.createPath} className="text-accent hover:underline">
                {t.labelRu}
              </Link>
              — {t.notes}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Smoke / test inventory</h2>
        <p className="text-sm text-muted">
          Категорий: {inventory.total}. SAFE_TO_DELETE {inventory.safeToDelete} ·
          KEEP {inventory.keepForAudit} · UNCERTAIN {inventory.uncertain} · REAL{" "}
          {inventory.realData}. Labels: {inventory.labels.join(", ")}. Migration
          не нужна. Удаление — только dry-run + подтверждение владельца.
        </p>
      </section>
    </div>
  );
}
