/**
 * Stage 4M — READ-ONLY TINDA demand evaluation.
 * Does NOT mutate TINDA. Does NOT run live Serper unless DEMAND_LIVE=1.
 */
import { createClient } from "@supabase/supabase-js";
import {
  buildDemandQueryPlan,
  evaluateDemandQuality,
  type DemandQualityResult,
} from "../src/lib/demand-intelligence";
import { classifyDemandSignal } from "../src/lib/lia/oi/regional/demand-classify";
import {
  classifyFixtureSignal,
  isFixtureNoise,
} from "../src/lib/personalized-feed/fixtures";
import { getIntentMapping } from "../src/lib/personalized-feed/mapping";
import { enrichCandidateIndustries } from "../src/lib/personalized-feed/demand-signals";
import { rankCandidate } from "../src/lib/personalized-feed/scoring";
import {
  labelForLiaOiSource,
  labelForMarketplaceSource,
} from "../src/lib/personalized-feed/source-labels";
import { createMemoryPersonalizedFeedService } from "../src/lib/personalized-feed/service";
import { rowToNeed, type NeedProfileRow } from "../src/lib/need-profile/mappers";
import type { FeedCandidate } from "../src/types/personalized-feed";

const NEED_ID = "15e85d03-2dd9-4c99-8d28-4c66e03d29d5";
const REQ_ID = "223decd8-c99a-4d24-ba25-2cb5d91749d3";

type Row = {
  id: string;
  title: string;
  source: string;
  region: string | null;
  type: string;
  quality: DemandQualityResult;
  score?: number;
  customer?: string | null;
  amount?: string;
  deadline?: string;
  why: string;
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: req } = await db
    .from("ckr_requests")
    .select("id,status,need_profile_id,next_step_public,updated_at")
    .eq("id", REQ_ID)
    .single();
  const { data: needRow } = await db
    .from("need_profiles")
    .select("*")
    .eq("id", NEED_ID)
    .single();
  if (!needRow) throw new Error("need missing");
  const need = rowToNeed(needRow as NeedProfileRow);

  console.log("=== Stage 4M TINDA READ-ONLY ===\n");
  console.log("REQ", req);
  console.log("NEED", need.intentType, need.regions, need.industries);

  const plan = buildDemandQueryPlan({ need, maxQueries: 10 });
  console.log("\n--- Query plan ---");
  console.log("queries", plan.queries.length);
  for (const q of plan.queries) console.log(`  [${q.id}] ${q.query}`);

  const mapping = getIntentMapping("SEEK_BUYER");
  const { data: opps } = await db
    .from("opportunities")
    .select(
      "id,title,description,region,type,status,price,deadline_at,source_type,source_label,fingerprint,created_at,updated_at,data_quality_score,canonical_url,source_url",
    )
    .eq("status", "published")
    .in("type", mapping.opportunityTypes || [])
    .limit(80);

  const candidates: FeedCandidate[] = (opps || []).map((row) => {
    const industries = enrichCandidateIndustries(row.title || "", row.description || "", []);
    const isLia = row.source_type === "lia_oi";
    const src = isLia
      ? labelForLiaOiSource(row.type)
      : row.type === "procurement"
        ? labelForMarketplaceSource("procurement")
        : labelForMarketplaceSource("opportunity");
    const price = row.price == null ? null : Number(row.price);
    return {
      id: row.id,
      itemType: "opportunity" as const,
      title: row.title,
      summary: row.description || "",
      region: row.region,
      industries,
      industry: industries[0] || null,
      price: Number.isFinite(price as number) ? price : null,
      priceKnown: price != null && Number.isFinite(price),
      currency: "RUB",
      status: row.status,
      ...src,
      href: `/opportunity/${row.id}`,
      fingerprint: row.fingerprint,
      canonicalUrl: row.canonical_url || row.source_url || null,
      deadlineAt: row.deadline_at,
      dataQuality:
        row.data_quality_score != null
          ? Math.min(10, Math.round(Number(row.data_quality_score) / 10))
          : 5,
      sourceConfidence: 7,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      rawType: row.type,
      unknownFields: price == null ? ["price"] : [],
      confirmedFields: ["title"],
    };
  });

  const feed = createMemoryPersonalizedFeedService();
  feed.resetForTests();
  feed.setTestNeeds([need]);
  feed.setTestCandidates(candidates);
  const wb = await feed.getFeedForNeedProfile({
    need,
    ownerId: need.ownerId,
    limit: 10,
    excludeFixtures: true,
    minScore: 50,
    requireProductFit: true,
  });

  console.log("\n--- BEFORE baseline (Stage 4L) ---");
  console.log("REAL GOOD = 1 (5cedf341 food Dagestan procurement)");

  console.log("\n--- AFTER published workbench ---");
  const rows: Row[] = [];
  for (const r of wb.recommendations) {
    const q = evaluateDemandQuality({
      candidate: {
        id: r.candidate.id,
        title: r.candidate.title,
        summary: r.candidate.summary,
        region: r.candidate.region,
        rawType: r.candidate.rawType,
        opportunityType:
          r.candidate.rawType === "procurement" ? "PROCUREMENT" : r.candidate.rawType,
        url: r.candidate.canonicalUrl || undefined,
        deadlineAt: r.candidate.deadlineAt,
        amountKnown: r.candidate.priceKnown,
        sourceLabel: r.candidate.sourceLabel,
      },
      needRegions: need.regions,
      needIndustries: need.industries,
      needKeywords: need.keywords,
      feedScore: r.score,
      published: true,
    });
    rows.push({
      id: r.candidate.id,
      title: r.candidate.title,
      source: r.candidate.sourceLabel,
      region: r.candidate.region,
      type: q.classification,
      quality: q,
      score: r.score,
      amount: r.candidate.priceKnown ? String(r.candidate.price) : "UNKNOWN",
      deadline: r.candidate.deadlineAt || "UNKNOWN",
      why: q.productMatched.join(", ") || r.explanation.matched.join(", "),
    });
  }

  // OI scan (staff-only potential)
  const { data: oi } = await db
    .from("lia_oi_opportunities")
    .select(
      "id,title,description,region,opportunity_type,page_type,canonical_url,is_stub,deadline_at,nmck,customer,source_object_id,fingerprint",
    )
    .or("region.ilike.%Дагестан%,title.ilike.%напит%,title.ilike.%продукт%,title.ilike.%вод%,title.ilike.%питан%")
    .limit(80);

  let oiGood = 0;
  let oiAcceptable = 0;
  let oiWeak = 0;
  let oiSmoke = 0;
  let oiExpired = 0;
  const oiTop: Row[] = [];

  for (const c of oi || []) {
    if (
      isFixtureNoise({
        id: c.id,
        title: c.title,
        summary: c.description,
        fingerprint: c.fingerprint,
      }) ||
      c.is_stub
    ) {
      oiSmoke += 1;
      continue;
    }
    const dem = classifyDemandSignal({
      title: c.title || "",
      description: c.description || "",
      url: c.canonical_url || undefined,
      pageType: c.page_type || undefined,
      opportunityType: c.opportunity_type,
    });
    const q = evaluateDemandQuality({
      candidate: {
        id: c.id,
        title: c.title || "",
        summary: c.description,
        region: c.region,
        opportunityType: c.opportunity_type,
        pageType: c.page_type,
        url: c.canonical_url,
        deadlineAt: c.deadline_at,
        amountKnown: c.nmck != null,
        customer: c.customer,
        officialId: c.source_object_id,
        isStub: c.is_stub,
      },
      needRegions: need.regions,
      needIndustries: need.industries,
      needKeywords: need.keywords,
      published: false,
    });
    if (q.bucket === "EXPIRED") oiExpired += 1;
    else if (q.bucket === "SMOKE") oiSmoke += 1;
    else if (q.bucket === "REAL_GOOD") oiGood += 1;
    else if (q.bucket === "REAL_ACCEPTABLE") oiAcceptable += 1;
    else oiWeak += 1;

    if (
      (q.bucket === "REAL_GOOD" || q.bucket === "REAL_ACCEPTABLE") &&
      dem.classification !== "UNKNOWN"
    ) {
      oiTop.push({
        id: c.id,
        title: c.title || "",
        source: "LIA OI (unpublished)",
        region: c.region,
        type: dem.classification,
        quality: q,
        customer: c.customer,
        amount: c.nmck != null ? String(c.nmck) : "UNKNOWN",
        deadline: c.deadline_at || "UNKNOWN",
        why: q.productMatched.join(", ") || dem.reasons.join(", "),
      });
    }
  }

  // Dedup OI by notice id / normalized title
  const seen = new Set<string>();
  const oiTopDedup: Row[] = [];
  for (const r of oiTop) {
    const notice = r.title.match(/\d{15,}/)?.[0] || "";
    const key = notice || r.title.toLowerCase().slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    oiTopDedup.push(r);
  }

  const pubGood = rows.filter((r) => r.quality.bucket === "REAL_GOOD").length;
  const pubAcc = rows.filter((r) => r.quality.bucket === "REAL_ACCEPTABLE").length;
  const pubWeak = rows.filter((r) => r.quality.bucket === "WEAK").length;

  console.log("\nPublished workbench:");
  for (const r of rows) {
    console.log(
      `\n[${r.quality.bucket}] score=${r.score} ${r.title}\n  type=${r.type} tier=${r.quality.tier}\n  region=${r.region} amount=${r.amount} deadline=${r.deadline}\n  why=${r.why}\n  id=${r.id} shareSafe=${r.quality.clientShareSafe}`,
    );
  }

  console.log("\nOI staff-only candidates (deduped, product/region relevant):");
  const oiGoodD = oiTopDedup.filter((r) => r.quality.bucket === "REAL_GOOD").length;
  const oiAccD = oiTopDedup.filter((r) => r.quality.bucket === "REAL_ACCEPTABLE").length;
  console.log({
    oiGoodRaw: oiGood,
    oiAcceptableRaw: oiAcceptable,
    oiGoodDedup: oiGoodD,
    oiAcceptableDedup: oiAccD,
    oiWeak,
    oiSmoke,
    oiExpired,
    listedDedup: oiTopDedup.length,
  });
  for (const r of oiTopDedup.slice(0, 10)) {
    console.log(
      `\n[${r.quality.bucket}] ${r.title}\n  type=${r.type} region=${r.region}\n  customer=${r.customer || "UNKNOWN"} amount=${r.amount} deadline=${r.deadline}\n  why=${r.why}\n  id=${r.id} CLIENT_SHARE=no (unpublished)`,
    );
  }

  const combinedGood = pubGood + oiGoodD;
  const combinedAcc = pubAcc + oiAccD;

  console.log("\n=== SUMMARY ===");
  console.log("BEFORE REAL GOOD:", 1);
  console.log("AFTER published REAL GOOD / ACCEPTABLE / WEAK:", pubGood, pubAcc, pubWeak);
  console.log("AFTER OI staff (dedup) REAL GOOD / ACCEPTABLE:", oiGoodD, oiAccD);
  console.log("COMBINED GOOD+ACCEPTABLE (published+OI staff dedup):", combinedGood + combinedAcc);
  console.log("Queries planned:", plan.queries.length);
  console.log("GOOD/query (published only):", (pubGood / Math.max(1, plan.queries.length)).toFixed(3));
  console.log("TINDA unchanged:", req?.status, req?.updated_at);
  console.log("NO deploy. NO migration. NO MATCHES. NO client share.");
  console.log(
    "Target ≥5 GOOD/ACCEPTABLE:",
    combinedGood + combinedAcc >= 5 ? "MET (incl. staff OI)" : "NOT MET — data scarcity / quality gate",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
