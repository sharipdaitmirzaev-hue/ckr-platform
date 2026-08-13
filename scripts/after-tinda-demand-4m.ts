import { createClient } from "@supabase/supabase-js";
import { evaluateDemandQuality } from "../src/lib/demand-intelligence/quality";
import { buildDemandQueryPlan } from "../src/lib/demand-intelligence/query-planner";
import { listCandidates } from "../src/lib/lia/oi/store";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const REQ = "223decd8-c99a-4d24-ba25-2cb5d91749d3";
const NEED_ID = "15e85d03-2dd9-4c99-8d28-4c66e03d29d5";
const needRegions = ["Дагестан"];
const needIndustries = ["food", "beverage"];
const needKeywords: string[] = [];

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
  .select("id,regions,industries,keywords,updated_at,status")
  .eq("id", NEED_ID)
  .single();
console.log("TINDA", JSON.stringify({ req, comments, events, need }));

const { data: pubs } = await sb
  .from("opportunities")
  .select(
    "id,title,description,region,type,status,deadline_at,canonical_url,source_url,data_quality_score,published_from_lia_at",
  )
  .eq("status", "published")
  .in("type", ["procurement", "partner", "service"]);

let rg = 0,
  ra = 0,
  wk = 0,
  sm = 0,
  ex = 0;
const items = [];
for (const p of pubs || []) {
  const stub = /0373100043226000123|Московской области/.test(
    `${p.title}${p.region}`,
  );
  const q = evaluateDemandQuality({
    candidate: {
      id: p.id,
      title: p.title,
      summary: p.description,
      region: p.region,
      rawType: p.type,
      opportunityType: p.type === "procurement" ? "PROCUREMENT" : p.type,
      url: p.canonical_url || p.source_url,
      deadlineAt: p.deadline_at,
      isStub: stub,
    },
    needRegions,
    needIndustries,
    needKeywords,
    feedScore: p.data_quality_score,
    published: true,
  });
  if (q.bucket === "REAL_GOOD") rg++;
  else if (q.bucket === "REAL_ACCEPTABLE") ra++;
  else if (q.bucket === "WEAK") wk++;
  else if (q.bucket === "SMOKE") sm++;
  else if (q.bucket === "EXPIRED") ex++;
  items.push({
    id: p.id,
    title: p.title,
    region: p.region,
    bucket: q.bucket,
    tier: q.tier,
    productFit: q.productFit,
    regionFit: q.regionFit,
    score: p.data_quality_score,
    deadline: p.deadline_at,
    published_from_lia_at: p.published_from_lia_at,
  });
}
console.log(
  "FEED_BUCKETS",
  JSON.stringify({
    REAL_GOOD: rg,
    REAL_ACCEPTABLE: ra,
    WEAK: wk,
    SMOKE: sm,
    EXPIRED: ex,
    published_procurement_like: (pubs || []).length,
  }),
);
console.log("FEED_ITEMS", JSON.stringify(items, null, 2));

const cands = await listCandidates();
let oiRg = 0,
  oiRa = 0,
  oiWk = 0,
  oiSm = 0,
  oiEx = 0,
  detail = 0,
  dup = 0;
const fps = new Set<string>();
for (const c of cands) {
  if (c.pageType === "DETAIL") detail++;
  if (c.fingerprint) {
    if (fps.has(c.fingerprint)) dup++;
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
      amountKnown: c.nmck != null,
      customer: c.customer,
      officialId: c.sourceObjectId,
      isStub: c.isStub,
    },
    needRegions,
    needIndustries,
    needKeywords,
    published: c.publicationState === "published",
  });
  if (q.bucket === "REAL_GOOD") oiRg++;
  else if (q.bucket === "REAL_ACCEPTABLE") oiRa++;
  else if (q.bucket === "WEAK") oiWk++;
  else if (q.bucket === "SMOKE") oiSm++;
  else if (q.bucket === "EXPIRED") oiEx++;
}
console.log(
  "OI_LIST_BUCKETS",
  JSON.stringify({
    REAL_GOOD: oiRg,
    REAL_ACCEPTABLE: oiRa,
    WEAK: oiWk,
    SMOKE: oiSm,
    EXPIRED: oiEx,
    DETAIL: detail,
    duplicates_fp: dup,
    candidates: cands.length,
  }),
);

const { count: oiTotal } = await sb
  .from("lia_oi_opportunities")
  .select("*", { count: "exact", head: true });
const { count: runs } = await sb
  .from("lia_oi_search_runs")
  .select("*", { count: "exact", head: true });
const { data: latestRuns } = await sb
  .from("lia_oi_search_runs")
  .select("id,query,created_at,queries_run,signals_raw,top_count,stats_json")
  .order("created_at", { ascending: false })
  .limit(5);
console.log("OI_TOTAL", oiTotal, "RUNS", runs);
for (const r of latestRuns || []) {
  const s = (r.stats_json || {}) as Record<string, unknown>;
  console.log(
    "RUN",
    JSON.stringify({
      id: r.id,
      q: r.query,
      at: r.created_at,
      queries: r.queries_run,
      raw: r.signals_raw,
      top: r.top_count,
      detail: s.detailPages,
      fetched: s.pagesFetched,
      fail: s.pagesFetchFailed,
      dup: s.duplicatesRemoved,
      topOpp: s.topOpportunities,
    }),
  );
}

const plan = buildDemandQueryPlan({
  need: {
    intentType: "SEEK_BUYER",
    regions: needRegions,
    industries: needIndustries,
    keywords: needKeywords,
    title: "tinda",
    description: "",
  },
  maxQueries: 8,
});
console.log("QUERIES", plan.queries.map((q) => q.query));
