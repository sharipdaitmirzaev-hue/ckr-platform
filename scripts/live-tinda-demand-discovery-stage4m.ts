/**
 * Stage 4M — LIVE targeted demand discovery for TINDA.
 * Writes only to LIA OI (search runs / candidates). Does NOT mutate TINDA
 * request / need / comments / next_step. Does NOT auto-publish. Does NOT share.
 *
 * Usage (prod):
 *   DEMAND_LIVE=1 npx tsx --env-file=/etc/ckr/ckr.env scripts/live-tinda-demand-discovery-stage4m.ts
 */
import { createClient } from "@supabase/supabase-js";
import {
  buildDemandQueryPlan,
  evaluateDemandQuality,
  runDemandDiscoveryForNeed,
} from "../src/lib/demand-intelligence";
import { listCandidates } from "../src/lib/lia/oi/store";
import { resolveOiSearchMode } from "../src/lib/lia/oi/mode";
import { rowToNeed, type NeedProfileRow } from "../src/lib/need-profile/mappers";
import type { NeedProfile } from "../src/types/need-profile";

const NEED_ID = "15e85d03-2dd9-4c99-8d28-4c66e03d29d5";
const REQ_ID = "223decd8-c99a-4d24-ba25-2cb5d91749d3";
const ACTOR = "0ae8067d-73e5-438e-bcfc-98e96d2c3001";

/** Expand targeting for this run only — never persist to need_profiles. */
const SKFO_REGIONS = [
  "Дагестан",
  "Ставропольский край",
  "Чеченская Республика",
  "Республика Ингушетия",
  "Кабардино-Балкарская Республика",
  "Республика Северная Осетия — Алания",
];
const EXTRA_INDUSTRIES = ["food", "beverage", "water", "grocery"];
const EXTRA_KEYWORDS = [
  "сок",
  "вода питьевая",
  "безалкогольные напитки",
  "продукты питания",
  "соки",
  "газированная вода",
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
    .select(
      "id,status,next_step_public,next_step_internal,need_profile_id,updated_at,assigned_to,linked_task_id",
    )
    .eq("id", REQ_ID)
    .single();
  const { count: comments } = await sb
    .from("ckr_request_comments")
    .select("*", { count: "exact", head: true })
    .eq("request_id", REQ_ID);
  const { count: events } = await sb
    .from("ckr_request_events")
    .select("*", { count: "exact", head: true })
    .eq("request_id", REQ_ID);
  const { data: need } = await sb
    .from("need_profiles")
    .select("id,regions,industries,keywords,status,updated_at")
    .eq("id", NEED_ID)
    .single();
  console.log(`\n=== TINDA_GUARD ${label} ===`);
  console.log(JSON.stringify({ req, comments, events, need }, null, 2));
  return { req, comments, events, need };
}

function scoreAll(
  cands: Awaited<ReturnType<typeof listCandidates>>,
  need: NeedProfile,
) {
  const buckets = {
    REAL_GOOD: 0,
    REAL_ACCEPTABLE: 0,
    WEAK: 0,
    SMOKE: 0,
    EXPIRED: 0,
  };
  let detail = 0;
  let published = 0;
  const promising: Array<Record<string, unknown>> = [];
  const fps = new Set<string>();
  let duplicates = 0;

  for (const c of cands) {
    if (c.pageType === "DETAIL") detail += 1;
    if (c.publicationState === "published") published += 1;
    if (c.fingerprint) {
      if (fps.has(c.fingerprint)) duplicates += 1;
      fps.add(c.fingerprint);
    }
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
      needRegions: need.regions,
      needIndustries: need.industries,
      needKeywords: need.keywords,
      published: c.publicationState === "published",
    });
    buckets[q.bucket] += 1;
    if (q.bucket === "REAL_GOOD" || q.bucket === "REAL_ACCEPTABLE") {
      promising.push({
        id: c.id,
        title: c.title,
        region: c.region,
        bucket: q.bucket,
        tier: q.tier,
        classification: q.classification,
        pageType: c.pageType,
        url: c.canonicalUrl,
        customer: c.customer,
        nmck: c.nmck,
        deadlineAt: c.deadlineAt,
        publicationState: c.publicationState,
        marketplaceOpportunityId: c.marketplaceOpportunityId,
        productFit: q.productFit,
        productMatched: q.productMatched,
        regionFit: q.regionFit,
        reasons: q.reasons,
        isStub: c.isStub,
        sourceObjectId: c.sourceObjectId,
        detailConfidence: c.detailConfidence,
        resultBucket: c.resultBucket,
      });
    }
  }
  return { buckets, detail, published, duplicates, promising, total: cands.length };
}

async function main() {
  if (process.env.DEMAND_LIVE !== "1") {
    throw new Error("Refusing to run without DEMAND_LIVE=1");
  }

  const mode = resolveOiSearchMode();
  console.log("SEARCH_MODE", mode);
  if (mode.mode !== "live") {
    throw new Error(`Expected live search mode, got ${mode.mode}`);
  }

  const beforeGuard = await tindaGuard("BEFORE");
  const sb = db();
  const { data: needRow } = await sb
    .from("need_profiles")
    .select("*")
    .eq("id", NEED_ID)
    .single();
  if (!needRow) throw new Error("need missing");

  const baseNeed = rowToNeed(needRow as NeedProfileRow);
  // Targeting expansion for this run only (Дагестан → СКФО + product keywords).
  const discoveryNeed: NeedProfile = {
    ...baseNeed,
    regions: SKFO_REGIONS,
    industries: Array.from(
      new Set([...baseNeed.industries, ...EXTRA_INDUSTRIES]),
    ),
    keywords: Array.from(
      new Set([...(baseNeed.keywords || []), ...EXTRA_KEYWORDS]),
    ),
  };

  const plan = buildDemandQueryPlan({ need: discoveryNeed, maxQueries: 8 });
  console.log("\n=== QUERY PLAN ===");
  console.log("planned", plan.queries.length);
  for (const q of plan.queries) console.log(`  [${q.id}] ${q.query}`);

  const beforeCands = await listCandidates();
  const beforeIds = new Set(beforeCands.map((c) => c.id));
  const beforeScore = scoreAll(beforeCands, discoveryNeed);
  console.log("\n=== BEFORE SCORE ===");
  console.log(
    JSON.stringify(
      {
        buckets: beforeScore.buckets,
        detail: beforeScore.detail,
        published: beforeScore.published,
        duplicates: beforeScore.duplicates,
        total: beforeScore.total,
        promisingCount: beforeScore.promising.length,
        promising: beforeScore.promising,
      },
      null,
      2,
    ),
  );

  // Published marketplace feed for SEEK_BUYER (workbench published side)
  const { data: pubs } = await sb
    .from("opportunities")
    .select(
      "id,title,description,region,type,status,deadline_at,canonical_url,source_url,data_quality_score,fingerprint",
    )
    .eq("status", "published")
    .in("type", ["procurement", "partner", "service"]);
  console.log("\n=== BEFORE PUBLISHED FEED (procurement/partner/service) ===");
  for (const p of pubs || []) {
    const q = evaluateDemandQuality({
      candidate: {
        id: p.id,
        title: p.title,
        summary: p.description,
        region: p.region,
        rawType: p.type,
        opportunityType:
          p.type === "procurement" ? "PROCUREMENT" : p.type,
        url: p.canonical_url || p.source_url,
        deadlineAt: p.deadline_at,
      },
      needRegions: discoveryNeed.regions,
      needIndustries: discoveryNeed.industries,
      needKeywords: discoveryNeed.keywords,
      feedScore: p.data_quality_score,
      published: true,
    });
    console.log(
      JSON.stringify({
        id: p.id,
        title: p.title,
        region: p.region,
        type: p.type,
        bucket: q.bucket,
        tier: q.tier,
        productFit: q.productFit,
        regionFit: q.regionFit,
      }),
    );
  }

  console.log("\n=== RUNNING LIVE DISCOVERY (no auto-publish) ===");
  const summary = await runDemandDiscoveryForNeed({
    need: discoveryNeed,
    userId: ACTOR,
    maxQueries: 8,
  });
  console.log("SUMMARY", summary);

  const afterCands = await listCandidates();
  const newOnes = afterCands.filter((c) => !beforeIds.has(c.id));
  const afterScore = scoreAll(afterCands, discoveryNeed);
  console.log("\n=== AFTER SCORE ===");
  console.log(
    JSON.stringify(
      {
        buckets: afterScore.buckets,
        detail: afterScore.detail,
        published: afterScore.published,
        duplicates: afterScore.duplicates,
        total: afterScore.total,
        newCount: newOnes.length,
      },
      null,
      2,
    ),
  );

  console.log("\n=== NEW CANDIDATES ===");
  for (const c of newOnes) {
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
      },
      needRegions: discoveryNeed.regions,
      needIndustries: discoveryNeed.industries,
      needKeywords: discoveryNeed.keywords,
      published: false,
    });
    console.log(
      JSON.stringify(
        {
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
          isStub: c.isStub,
          resultBucket: c.resultBucket,
          detailConfidence: c.detailConfidence,
        },
        null,
        2,
      ),
    );
  }

  console.log("\n=== ALL PROMISING (GOOD/ACCEPTABLE) ===");
  console.log(JSON.stringify(afterScore.promising, null, 2));

  const afterGuard = await tindaGuard("AFTER_DISCOVERY");
  if (
    beforeGuard.req?.status !== afterGuard.req?.status ||
    beforeGuard.req?.updated_at !== afterGuard.req?.updated_at ||
    beforeGuard.comments !== afterGuard.comments ||
    beforeGuard.events !== afterGuard.events ||
    JSON.stringify(beforeGuard.need) !== JSON.stringify(afterGuard.need)
  ) {
    console.error("TINDA_MUTATION_DETECTED");
    process.exitCode = 2;
  } else {
    console.log("TINDA_UNCHANGED_OK");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
