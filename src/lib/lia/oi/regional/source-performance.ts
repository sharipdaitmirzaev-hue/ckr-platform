/**
 * Stage 4E — source performance: quality over volume.
 */

import type { LiaOiCandidate } from "@/types/lia-oi";
import { computePublishability } from "@/lib/lia/oi/publishability";
import { computeDataQualityV2 } from "@/lib/lia/oi/quality-v2";
import { normalizeRegionLabel } from "@/lib/geo/region-normalize";
import { classifyDemandSignal } from "@/lib/lia/oi/regional/demand-classify";

export type SourcePerformanceRow = {
  sourceId: string;
  discovered: number;
  detail: number;
  detailPct: number;
  regionPct: number;
  officialUrlPct: number;
  moneyPct: number;
  deadlinePct: number;
  publishablePct: number;
  readyPct: number;
  goodPct: number;
  confirmedDemand: number;
  potentialBuyer: number;
};

function pct(n: number, d: number) {
  return d ? Math.round((100 * n) / d) : 0;
}

export function evaluateSourcePerformance(
  candidates: LiaOiCandidate[],
): SourcePerformanceRow[] {
  const by = new Map<string, LiaOiCandidate[]>();
  for (const c of candidates) {
    const id = c.sourceAdapterId || "unknown";
    const list = by.get(id) || [];
    list.push(c);
    by.set(id, list);
  }

  const rows: SourcePerformanceRow[] = [];
  for (const [sourceId, list] of by) {
    let detail = 0;
    let region = 0;
    let officialUrl = 0;
    let money = 0;
    let deadline = 0;
    let publishable = 0;
    let ready = 0;
    let good = 0;
    let confirmedDemand = 0;
    let potentialBuyer = 0;

    for (const c of list) {
      if (c.pageType === "DETAIL" && !c.isCatalogSource) detail += 1;
      if (normalizeRegionLabel(c.region) || (c.region && c.region.length >= 3)) {
        region += 1;
      }
      const url = c.canonicalUrl || c.sources?.[0]?.url || "";
      if (/^https?:\/\//i.test(url)) officialUrl += 1;
      const m =
        c.nmck ?? c.supportAmount ?? c.askingPrice ?? c.startingPrice ?? null;
      if (m != null && m >= 10_000 && m <= 50_000_000_000) money += 1;
      if (c.deadlineAt) deadline += 1;

      const q = computeDataQualityV2({ candidate: c });
      const pub = computePublishability({
        ...c,
        dataQualityScore: q.dataQualityScore,
      });
      if (pub.tier === "READY_TO_REVIEW" || pub.tier === "NEEDS_ENRICHMENT") {
        publishable += 1;
      }
      if (pub.tier === "READY_TO_REVIEW") {
        ready += 1;
        if (c.pageType === "DETAIL") good += 1;
      }

      const dem = classifyDemandSignal({
        title: c.title,
        description: c.description,
        url,
        pageType: c.pageType,
        opportunityType: c.opportunityType,
      });
      if (dem.classification === "CONFIRMED_DEMAND") confirmedDemand += 1;
      if (dem.classification === "POTENTIAL_BUYER") potentialBuyer += 1;
    }

    const n = list.length;
    rows.push({
      sourceId,
      discovered: n,
      detail,
      detailPct: pct(detail, n),
      regionPct: pct(region, n),
      officialUrlPct: pct(officialUrl, n),
      moneyPct: pct(money, n),
      deadlinePct: pct(deadline, n),
      publishablePct: pct(publishable, n),
      readyPct: pct(ready, n),
      goodPct: pct(good, n),
      confirmedDemand,
      potentialBuyer,
    });
  }

  return rows.sort((a, b) => b.goodPct - a.goodPct || b.detailPct - a.detailPct);
}

/** Owner-facing: «Источник X: 37 результатов, 2 качественных». */
export function formatSourcePerformanceRu(row: SourcePerformanceRow): string {
  const quality = Math.round((row.goodPct / 100) * row.discovered) || row.detail;
  return `Источник ${row.sourceId}: ${row.discovered} результатов, ${quality} качественных`;
}

export function sourcePerformanceSummaryRu(
  candidates: LiaOiCandidate[],
): string[] {
  return evaluateSourcePerformance(candidates).map(formatSourcePerformanceRu);
}
