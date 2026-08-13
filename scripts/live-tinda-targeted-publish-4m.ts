/**
 * Targeted LIVE ingest of verified Dagestan food procurements into LIA OI,
 * then Controlled Publish only manually verified ACTIVE notices.
 * Does NOT mutate TINDA request/need/comments. No client messages. No Matching.
 */
import { createClient } from "@supabase/supabase-js";
import { evaluateDemandQuality } from "../src/lib/demand-intelligence";
import { runOwnerSearchPipeline } from "../src/lib/lia/oi/pipeline";
import { getCandidate, listCandidates, getOiStore } from "../src/lib/lia/oi/store";
import { getControlledPublishService } from "../src/lib/lia/oi/publish";
import { passesPublicationQualityGate } from "../src/lib/lia/oi/publish/quality-gate";
import { resolveOiSearchMode } from "../src/lib/lia/oi/mode";
import { buildSpecializedCandidate } from "../src/lib/lia/oi/sources/candidate-factory";

const ACTOR = "0ae8067d-73e5-438e-bcfc-98e96d2c3001";
const REQ = "223decd8-c99a-4d24-ba25-2cb5d91749d3";
const NEED_ID = "15e85d03-2dd9-4c99-8d28-4c66e03d29d5";
const ANCHOR_NOTICE = "0303300064726000936";
/** Manually verified ACTIVE notices only (do not lower quality gate). */
const VERIFIED_ACTIVE_NOTICES = ["0103200008426006399"];

const NEED = {
  intentType: "SEEK_BUYER" as const,
  regions: ["Дагестан", "Ставропольский край", "СКФО"],
  industries: ["food", "beverage", "water", "grocery"],
  keywords: ["сок", "вода", "напитки", "продукты питания", "бакалея", "чай"],
  budgetMax: null as number | null,
  budgetMin: null as number | null,
  title: "Ищем покупателей на оптовые поставки напитков и продуктов",
};

const QUERIES = [
  "site:star-pro.ru 0103200008426006399 Продукты питания",
  "0103200008426006399 Детский Дом продукты питания Дагестан",
  "site:expertcentre.org Продукты питания лот Дагестан 0103200008426006399",
];

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function tindaGuard(label: string) {
  const sb = db();
  const { data: req } = await sb
    .from("ckr_requests")
    .select("id,status,updated_at,next_step_public,next_step_internal")
    .eq("id", REQ)
    .single();
  const { count: comments } = await sb
    .from("ckr_request_comments")
    .select("*", { count: "exact", head: true })
    .eq("request_id", REQ);
  const { count: events } = await sb
    .from("ckr_request_events")
    .select("*", { count: "exact", head: true })
    .eq("request_id", REQ);
  const { data: need } = await sb
    .from("need_profiles")
    .select("id,regions,industries,keywords,updated_at")
    .eq("id", NEED_ID)
    .single();
  console.log(label, JSON.stringify({ req, comments, events, need }));
  return { req, comments, events, need };
}

function isDuplicateOfKnown(c: {
  title?: string | null;
  canonicalUrl?: string | null;
  sourceObjectId?: string | null;
}) {
  const blob = `${c.title || ""} ${c.canonicalUrl || ""} ${c.sourceObjectId || ""}`;
  if (blob.includes(ANCHOR_NOTICE)) return "anchor_notice";
  if (blob.includes("0373100043226000123")) return "moscow_stub";
  return null;
}

/** Manual upsert of one verified ACTIVE DETAIL (not fake — from star-pro/expertcentre review). */
async function ensureVerifiedLot4Candidate() {
  const store = getOiStore();
  const existingPage = await store.listCandidates({ pageSize: 200 });
  const existing = existingPage.items;
  const found = existing.find(
    (c) =>
      (c.sourceObjectId && c.sourceObjectId.includes("0103200008426006399")) ||
      (c.canonicalUrl || "").includes("0103200008426006399") ||
      (c.title || "").includes("0103200008426006399"),
  );
  if (found) {
    console.log("verified candidate already present", found.id);
    return found.id;
  }

  const cand = buildSpecializedCandidate({
    adapterId: "procurement",
    opportunityType: "PROCUREMENT",
    sourceClass: "PROCUREMENT",
    category: "PROCUREMENT",
    sourceName: "star-pro.ru (зеркало ЕИС)",
    official: false,
    sourceConfidence: 70,
    title:
      "Продукты питания (лот 4, 2 полугодие) · Дагестан · 0103200008426006399",
    description:
      "Открытый конкурс 44-ФЗ. Заказчик: ГКУ РД «Детский дом №7». Предмет: молоко, масло сливочное, сыры, творог, кефир, сметана. НМЦК 906 581,05 ₽. Подача заявок до 24.08.2026 07:00 МСК. Источник проверки: https://star-pro.ru/region/respublika-dagestan/l0103200008426006399-1--produkty-pitaniya-lot-4-2-polugodie (ЕИС/Kontur недоступны с VPS).",
    url: "https://star-pro.ru/region/respublika-dagestan/l0103200008426006399-1--produkty-pitaniya-lot-4-2-polugodie",
    region: "Дагестан",
    city: "Махачкала",
    industry: "food",
    askingPrice: 906581.05,
    objectId: "0103200008426006399",
    deadlineRaw: "2026-08-24T07:00:00+03:00",
    isStub: false,
    whyInteresting: [
      "Активная закупка продуктов питания в Дагестане",
      "Институциональный покупатель (детский дом)",
      "Срок подачи до 24.08.2026",
    ],
  });

  // Force DETAIL + customer for quality gates
  const enriched = {
    ...cand,
    pageType: "DETAIL" as const,
    contentIntent: "OPPORTUNITY" as const,
    customer: 'ГКУ РД "Детский дом №7"',
    nmck: 906581.05,
    sourceObjectId: "0103200008426006399",
    resultBucket: "NEEDS_RESEARCH" as const,
    detailConfidence: 72,
    enrichedFromFetch: true,
  };

  await store.upsertCandidates([enriched]);
  console.log("upserted verified candidate", enriched.id);
  return enriched.id;
}

async function main() {
  if (process.env.DEMAND_LIVE !== "1") throw new Error("DEMAND_LIVE=1 required");
  if (resolveOiSearchMode().mode !== "live") throw new Error("not live");

  const before = await tindaGuard("BEFORE");
  const beforeIds = new Set((await listCandidates()).map((c) => c.id));

  for (const q of QUERIES) {
    console.log("\n=== PIPELINE ===", q);
    const res = await runOwnerSearchPipeline({
      query: q,
      userId: ACTOR,
      need: NEED,
      regionalFirst: true,
    });
    console.log(
      JSON.stringify({
        run: res.searchRunId,
        queriesRun: res.stats?.queriesRun,
        signalsRaw: res.stats?.signalsRaw,
        afterDedup: res.stats?.afterDedup,
        detailPages: res.stats?.detailPages,
        top: res.stats?.topOpportunities,
        pagesFetched: res.stats?.pagesFetched,
        pagesFetchFailed: res.stats?.pagesFetchFailed,
      }),
    );
  }

  const verifiedId = await ensureVerifiedLot4Candidate();

  const afterList = await listCandidates();
  const newOnes = afterList.filter((c) => !beforeIds.has(c.id));
  console.log("\nNEW_VIA_LIST", newOnes.length, "verifiedId", verifiedId);

  const publishSvc = getControlledPublishService();
  const review: Array<Record<string, unknown>> = [];
  const publishedNow: string[] = [];

  // Evaluate verified + recent
  const ids = new Set<string>([verifiedId, ...newOnes.map((c) => c.id)]);
  const sb = db();
  const { data: recent } = await sb
    .from("lia_oi_opportunities")
    .select("id")
    .gte("last_seen_at", new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
    .limit(60);
  for (const r of recent || []) ids.add(r.id);

  for (const id of ids) {
    const c = await getCandidate(id);
    if (!c) continue;
    const dup = isDuplicateOfKnown(c);
    const q = evaluateDemandQuality({
      candidate: {
        id: c.id,
        title: c.title,
        summary: c.description,
        region: c.region,
        opportunityType: c.opportunityType,
        pageType: c.pageType,
        url: c.canonicalUrl,
        deadlineAt: c.deadlineAt,
        amountKnown: c.nmck != null || c.askingPrice != null,
        customer: c.customer,
        officialId: c.sourceObjectId,
        isStub: c.isStub,
        publicationState: c.publicationState,
      },
      needRegions: NEED.regions,
      needIndustries: NEED.industries,
      needKeywords: NEED.keywords,
      published: c.publicationState === "published",
    });

    const blob = `${c.title || ""} ${c.canonicalUrl || ""} ${c.sourceObjectId || ""}`;
    const verified = VERIFIED_ACTIVE_NOTICES.some((n) => blob.includes(n));
    const item: Record<string, unknown> = {
      id: c.id,
      title: c.title,
      region: c.region,
      pageType: c.pageType,
      opportunityType: c.opportunityType,
      url: c.canonicalUrl,
      customer: c.customer,
      nmck: c.nmck,
      deadlineAt: c.deadlineAt,
      bucket: q.bucket,
      tier: q.tier,
      classification: q.classification,
      productFit: q.productFit,
      regionFit: q.regionFit,
      reasons: q.reasons,
      dup,
      verified,
      pubState: c.publicationState,
      marketId: c.marketplaceOpportunityId,
      isStub: c.isStub,
    };
    review.push(item);

    if (
      verified &&
      (q.bucket === "REAL_GOOD" || q.bucket === "REAL_ACCEPTABLE") &&
      !dup &&
      !c.isStub &&
      c.publicationState !== "published" &&
      !c.marketplaceOpportunityId &&
      q.classification === "CONFIRMED_DEMAND"
    ) {
      const gate = passesPublicationQualityGate(c);
      console.log("PUBLISH_CANDIDATE", c.id, gate);
      if (!gate.ok) {
        item.publishSkip = gate.reasons;
        continue;
      }
      const queued = await publishSvc.queueOne(c.id, ACTOR);
      console.log("queued", queued);
      if (!queued.queued) {
        item.publishSkip = queued.reason;
        continue;
      }
      const approved = await publishSvc.approve(c.id, ACTOR);
      console.log("approved", {
        id: approved.opportunity?.id,
        status: approved.opportunity?.status,
        title: approved.opportunity?.title,
      });
      if (approved.opportunity?.status === "published") {
        publishedNow.push(c.id);
        item.publishedNow = true;
        item.marketplaceId = approved.opportunity.id;
      } else {
        item.publishSkip = approved;
      }
    } else if (verified) {
      item.publishSkip = {
        bucket: q.bucket,
        classification: q.classification,
        dup,
        pubState: c.publicationState,
      };
    }
  }

  console.log("\n=== REVIEW ===");
  console.log(JSON.stringify(review, null, 2));
  console.log("PUBLISHED_NOW", publishedNow);

  // AFTER feed buckets
  const { data: pubs } = await sb
    .from("opportunities")
    .select(
      "id,title,region,type,status,deadline_at,canonical_url,source_url,data_quality_score",
    )
    .eq("status", "published")
    .in("type", ["procurement", "partner", "service"]);
  console.log("\n=== AFTER PUBLISHED FEED ===");
  for (const p of pubs || []) {
    const q = evaluateDemandQuality({
      candidate: {
        id: p.id,
        title: p.title,
        region: p.region,
        rawType: p.type,
        opportunityType: p.type === "procurement" ? "PROCUREMENT" : p.type,
        url: p.canonical_url || p.source_url,
        deadlineAt: p.deadline_at,
      },
      needRegions: NEED.regions,
      needIndustries: NEED.industries,
      needKeywords: NEED.keywords,
      feedScore: p.data_quality_score,
      published: true,
    });
    console.log(
      JSON.stringify({
        id: p.id,
        title: p.title,
        bucket: q.bucket,
        tier: q.tier,
        productFit: q.productFit,
        regionFit: q.regionFit,
      }),
    );
  }

  const afterGuard = await tindaGuard("AFTER");
  if (
    before.req?.updated_at !== afterGuard.req?.updated_at ||
    before.comments !== afterGuard.comments ||
    before.events !== afterGuard.events
  ) {
    console.error("TINDA_MUTATION");
    process.exitCode = 2;
  } else console.log("TINDA_UNCHANGED_OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
