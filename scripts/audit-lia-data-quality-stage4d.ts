/**
 * Stage 4D BEFORE/AFTER audit (local re-score).
 * Does NOT publish. Does NOT mutate production.
 *
 * Usage:
 *   npx tsx scripts/audit-lia-data-quality-stage4d.ts
 *   npx tsx scripts/audit-lia-data-quality-stage4d.ts --input=/tmp/oi-dump.json
 */
process.env.LIA_OI_STORE = process.env.LIA_OI_STORE || "memory";

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { classifyPageType } from "../src/lib/lia/oi/page-type";
import { computeDataQuality } from "../src/lib/lia/oi/enrichment/quality";
import { computeDataQualityV2 } from "../src/lib/lia/oi/quality-v2";
import { computePublishability } from "../src/lib/lia/oi/publishability";
import { passesPublicationQualityGate } from "../src/lib/lia/oi/publish/quality-gate";
import { normalizeRegionLabel } from "../src/lib/geo/region-normalize";
import {
  DEFAULT_GAP_SCENARIOS,
  evaluateContentGaps,
} from "../src/lib/lia/oi/content-gap";
import { emptyScore } from "../src/lib/lia/oi/score";
import type { LiaOiCandidate } from "../src/types/lia-oi";

/** Production baseline captured Stage 4D kickoff (n=126, read-only). */
const BEFORE_GLOBAL = {
  n: 126,
  detailPct: 30,
  regionPct: 21,
  moneyPct: 33,
  deadlinePct: 6,
  publishableOldGatePct: 95,
  good: 11,
  acceptable: 27,
  weak: 34,
  irrelevant: 54,
  avgDq: 27,
  ready: 0,
  partial: 13,
  notReady: 46,
};

function asCandidate(raw: Record<string, unknown>): LiaOiCandidate {
  const now = new Date().toISOString();
  const title = String(raw.title || "untitled");
  const url = String(
    raw.canonicalUrl ||
      raw.canonical_url ||
      (raw.sources as { url?: string }[])?.[0]?.url ||
      "https://example.com/x",
  );
  const pageType =
    (raw.pageType as LiaOiCandidate["pageType"]) ||
    (raw.page_type as LiaOiCandidate["pageType"]) ||
    classifyPageType({ url, title, snippet: String(raw.description || "") });
  return {
    id: String(raw.id || `oi_${Math.random().toString(36).slice(2, 8)}`),
    type: "web_opportunity",
    title,
    description: String(raw.description || ""),
    summary: String(raw.summary || ""),
    whyInteresting: [],
    recommendation: "",
    nextStep: "",
    status: (raw.status as LiaOiCandidate["status"]) || "NEW",
    country: "RU",
    region: (raw.region as string) || undefined,
    industry: (raw.industry as string) || undefined,
    sources: (raw.sources as LiaOiCandidate["sources"]) || [
      {
        id: "s",
        category: "OTHER",
        name: String(raw.sourceAdapterId || raw.source_adapter_id || "unknown"),
        url,
        isStub: true,
      },
    ],
    claims: [],
    risks: [],
    unknowns: [],
    toVerify: [],
    score: { ...emptyScore(), overall: 40, quality: Number(raw.dataQualityScore || raw.data_quality_score || 20) },
    matchHints: [],
    firstSeenAt: String(raw.firstSeenAt || raw.first_seen_at || now),
    lastSeenAt: String(raw.lastSeenAt || raw.last_seen_at || now),
    canonicalKey: String(raw.canonicalKey || raw.canonical_key || url),
    fingerprint: String(raw.fingerprint || url),
    canonicalUrl: url,
    rawStubIds: [],
    isStub: Boolean(raw.isStub ?? true),
    pageType,
    isCatalogSource: Boolean(raw.isCatalogSource ?? raw.is_catalog_source ?? false),
    contentIntent: raw.contentIntent as LiaOiCandidate["contentIntent"],
    opportunityType: raw.opportunityType as LiaOiCandidate["opportunityType"],
    sourceAdapterId: String(raw.sourceAdapterId || raw.source_adapter_id || "serper_general"),
    isOfficialSource: Boolean(raw.isOfficialSource ?? raw.is_official_source ?? false),
    sourceObjectId: (raw.sourceObjectId || raw.source_object_id || null) as string | null,
    nmck: (raw.nmck as number) ?? null,
    supportAmount: (raw.supportAmount || raw.support_amount) as number | null,
    askingPrice: (raw.askingPrice || raw.asking_price) as number | null,
    startingPrice: (raw.startingPrice || raw.starting_price) as number | null,
    currentPrice: (raw.currentPrice || raw.current_price) as number | null,
    deadlineAt: (raw.deadlineAt || raw.deadline_at || null) as string | null,
    priceStatus: raw.priceStatus as LiaOiCandidate["priceStatus"],
    dataQualityScore: Number(raw.dataQualityScore || raw.data_quality_score || 0),
    matchingReadiness: raw.matchingReadiness as LiaOiCandidate["matchingReadiness"],
    resultBucket: raw.resultBucket as LiaOiCandidate["resultBucket"],
    dataChannel: raw.dataChannel as LiaOiCandidate["dataChannel"],
  };
}

/** Synthetic mix mirroring production weakness profile when no dump. */
function syntheticMix(): LiaOiCandidate[] {
  const out: LiaOiCandidate[] = [];
  for (let i = 0; i < 38; i++) {
    out.push(
      asCandidate({
        id: `list_${i}`,
        title: "Каталог бизнес возможностей",
        canonicalUrl: `https://example.com/catalog/page/${i}`,
        pageType: "LIST",
        isCatalogSource: true,
        contentIntent: "CATALOG",
        sourceAdapterId: "serper_general",
      }),
    );
  }
  for (let i = 0; i < 20; i++) {
    out.push(
      asCandidate({
        id: `news_${i}`,
        title: "Новости рынка закупок",
        canonicalUrl: `https://example.com/news/${i}`,
        pageType: "NEWS",
        contentIntent: "NEWS",
        sourceAdapterId: "serper_general",
      }),
    );
  }
  for (let i = 0; i < 38; i++) {
    out.push(
      asCandidate({
        id: `detail_weak_${i}`,
        title: `Объект ${i}`,
        canonicalUrl: `https://example.com/offer/${i}`,
        pageType: "DETAIL",
        contentIntent: "OPPORTUNITY",
        region: i % 3 === 0 ? "Дагестан" : undefined,
        nmck: i % 4 === 0 ? 5_000_000 : null,
        deadlineAt: i % 5 === 0 ? "2026-12-01T00:00:00.000Z" : null,
        sourceAdapterId: i % 2 ? "procurement" : "serper_general",
        opportunityType: i % 2 ? "PROCUREMENT" : "WEB_LISTING",
        isOfficialSource: i % 2 === 1,
        sourceObjectId: i % 2 ? `reg${i}` : null,
      }),
    );
  }
  for (let i = 0; i < 30; i++) {
    out.push(
      asCandidate({
        id: `detail_good_${i}`,
        title: `Закупка напитков Дагестан ${i}`,
        description: "НМЦК подтверждена. Срок подачи до 01.11.2026",
        canonicalUrl: `https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=10000000000000000${i}`,
        pageType: "DETAIL",
        contentIntent: "OPPORTUNITY",
        region: i % 2 ? "Дагестан" : "Ставропольский край",
        industry: "beverage",
        nmck: 8_000_000 + i * 1000,
        deadlineAt: "2026-11-01T00:00:00.000Z",
        opportunityType: i % 3 === 0 ? "SUPPORT_PROGRAM" : "PROCUREMENT",
        supportAmount: i % 3 === 0 ? 4_000_000 : null,
        sourceAdapterId: i % 3 === 0 ? "support_programs" : "procurement",
        isOfficialSource: true,
        sourceObjectId: `oid_${i}`,
        priceStatus: "KNOWN",
      }),
    );
  }
  return out;
}

function pct(n: number, d: number) {
  return d ? Math.round((100 * n) / d) : 0;
}

function summarize(label: string, list: LiaOiCandidate[], mode: "v1" | "v2") {
  let detail = 0;
  let region = 0;
  let money = 0;
  let deadline = 0;
  let publishable = 0;
  let ready = 0;
  let enrich = 0;
  let weak = 0;
  let expired = 0;
  let good = 0;
  let acceptable = 0;
  let dqSum = 0;

  for (const c of list) {
    if (c.pageType === "DETAIL" && !c.isCatalogSource) detail += 1;
    if (normalizeRegionLabel(c.region) || (c.region && c.region.length >= 3)) region += 1;
    if (
      c.nmck != null ||
      c.supportAmount != null ||
      c.askingPrice != null ||
      c.startingPrice != null ||
      c.priceStatus === "KNOWN"
    ) {
      money += 1;
    }
    if (c.deadlineAt) deadline += 1;

    if (mode === "v1") {
      const q = computeDataQuality({ candidate: c, structuredFields: c.structuredFields || [] });
      dqSum += q.dataQualityScore;
      // old gate approximation: dq>=3 OR readiness
      const oldOk =
        c.status !== "REJECTED" &&
        Boolean(c.canonicalUrl) &&
        (q.dataQualityScore >= 3 ||
          q.matchingReadiness === "READY" ||
          q.matchingReadiness === "PARTIAL");
      if (oldOk) publishable += 1;
      if (q.dataQualityScore >= 55 && c.pageType === "DETAIL") good += 1;
      else if (q.dataQualityScore >= 35) acceptable += 1;
      else weak += 1;
    } else {
      const q = computeDataQualityV2({ candidate: c });
      dqSum += q.dataQualityScore;
      const scored = { ...c, dataQualityScore: q.dataQualityScore, matchingReadiness: q.matchingReadiness };
      const pub = computePublishability(scored);
      const gate = passesPublicationQualityGate(c);
      if (gate.ok) publishable += 1;
      if (pub.tier === "READY_TO_REVIEW") ready += 1;
      else if (pub.tier === "NEEDS_ENRICHMENT") enrich += 1;
      else if (pub.tier === "EXPIRED") expired += 1;
      else weak += 1;
      if (pub.tier === "READY_TO_REVIEW" && c.pageType === "DETAIL") good += 1;
      else if (pub.tier === "NEEDS_ENRICHMENT") acceptable += 1;
    }
  }

  const n = list.length;
  return {
    label,
    n,
    detailPct: pct(detail, n),
    regionPct: pct(region, n),
    moneyPct: pct(money, n),
    deadlinePct: pct(deadline, n),
    publishablePct: pct(publishable, n),
    publishable,
    ready,
    enrich,
    weak,
    expired,
    good,
    acceptable,
    avgDq: n ? Math.round(dqSum / n) : 0,
  };
}

function main() {
  const arg = process.argv.find((a) => a.startsWith("--input="));
  const inputPath = arg?.split("=")[1];
  let list: LiaOiCandidate[];
  let source = "synthetic_mix_mirroring_prod_weakness";
  if (inputPath && existsSync(inputPath)) {
    const raw = JSON.parse(readFileSync(inputPath, "utf8")) as unknown;
    const arr = Array.isArray(raw) ? raw : (raw as { items?: unknown[] }).items || [];
    list = arr.map((x) => asCandidate(x as Record<string, unknown>));
    source = inputPath;
  } else {
    list = syntheticMix();
  }

  const beforeLocal = summarize("BEFORE_local_v1_gate", list, "v1");
  const afterLocal = summarize("AFTER_local_v2_gate", list, "v2");
  const gaps = evaluateContentGaps(list, DEFAULT_GAP_SCENARIOS);

  const report = {
    generatedAt: new Date().toISOString(),
    source,
    productionBaselineBefore: BEFORE_GLOBAL,
    localRescoreBefore: beforeLocal,
    localRescoreAfter: afterLocal,
    deltas: {
      publishablePct: afterLocal.publishablePct - beforeLocal.publishablePct,
      good: afterLocal.good - beforeLocal.good,
      note: "Negative publishablePct vs old gate is expected — old gate was too loose (~95%).",
    },
    contentGaps: gaps,
    autoPublish: false,
    matchingEngine: false,
  };

  const outPath = "/tmp/cursor/stage4d-before-after.json";
  try {
    writeFileSync(outPath, JSON.stringify(report, null, 2));
  } catch {
    /* ignore */
  }
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nWrote ${outPath}`);
}

main();
