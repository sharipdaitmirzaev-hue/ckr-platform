/**
 * Stage 4N — read-only TINDA / Feed / OI snapshot (BEFORE or AFTER).
 * Usage: LABEL=BEFORE npx tsx scripts/snapshot-tinda-stage4n.ts
 */
import { createClient } from "@supabase/supabase-js";
import { evaluateDemandQuality } from "../src/lib/demand-intelligence/quality";
import {
  assessAssortmentSufficiency,
  productFitScore,
} from "../src/lib/demand-intelligence";

const LABEL = process.env.LABEL || "SNAPSHOT";
const REQ = "223decd8-c99a-4d24-ba25-2cb5d91749d3";
const NEED = "15e85d03-2dd9-4c99-8d28-4c66e03d29d5";
const ORG = "fb5843fb-ab25-43bc-9af7-d74c6ef66176";
const TASK = "e2c50443-6cd4-48cc-a871-a4cfe8e09f9f";

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: req } = await sb
    .from("ckr_requests")
    .select(
      "id,status,type,updated_at,next_step_public,public_activity_text,need_profile_id,organization_id",
    )
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
    .select(
      "id,title,intent_type,status,regions,industries,keywords,updated_at",
    )
    .eq("id", NEED)
    .single();
  const { data: org } = await sb
    .from("organizations")
    .select("id,name,updated_at")
    .eq("id", ORG)
    .single();
  const { data: task } = await sb
    .from("operator_tasks")
    .select("id,status,updated_at,title")
    .eq("id", TASK)
    .maybeSingle();

  let oiTotal: number | null = null;
  let oiProcurement: number | null = null;
  try {
    const a = await sb
      .from("lia_oi_candidates")
      .select("*", { count: "exact", head: true });
    oiTotal = a.count;
    const b = await sb
      .from("lia_oi_candidates")
      .select("*", { count: "exact", head: true })
      .eq("opportunity_type", "PROCUREMENT");
    oiProcurement = b.count;
  } catch {
    oiTotal = null;
    oiProcurement = null;
  }

  const { data: pubs } = await sb
    .from("opportunities")
    .select(
      "id,title,description,region,type,status,deadline_at,canonical_url,source_label,source_url,fingerprint,data_quality_score,published_from_lia_at,price",
    )
    .eq("status", "published")
    .eq("type", "procurement");

  const needRegions = need?.regions || ["Дагестан"];
  const needIndustries = need?.industries || ["food", "beverage"];
  const needKeywords = need?.keywords || [];

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
        amountKnown: p.price != null,
      },
      needRegions,
      needIndustries,
      needKeywords,
      feedScore: p.data_quality_score,
      published: true,
    });
    if (q.bucket === "REAL_GOOD") rg += 1;
    else if (q.bucket === "REAL_ACCEPTABLE") ra += 1;
    else if (q.bucket === "WEAK") wk += 1;
    else if (q.bucket === "SMOKE") sm += 1;
    else if (q.bucket === "EXPIRED") ex += 1;
    items.push({
      id: p.id,
      title: (p.title || "").slice(0, 100),
      region: p.region,
      bucket: q.bucket,
      tier: q.tier,
      productFit: q.productFit,
      deadline: p.deadline_at,
      source: p.source_label,
      url: p.canonical_url || p.source_url,
      price: p.price,
    });
  }

  const assortment = assessAssortmentSufficiency({
    industries: needIndustries,
    keywords: needKeywords,
    offerSummary: org?.name || "",
  });

  console.log(
    JSON.stringify(
      {
        label: LABEL,
        tinda: {
          req,
          comments,
          events,
          need,
          org,
          task,
        },
        oiTotal,
        oiProcurement,
        publishedProcurement: (pubs || []).length,
        feedBuckets: {
          REAL_GOOD: rg,
          REAL_ACCEPTABLE: ra,
          WEAK: wk,
          SMOKE: sm,
          EXPIRED: ex,
        },
        usefulPublished: items.filter(
          (i) =>
            i.bucket === "REAL_GOOD" || i.bucket === "REAL_ACCEPTABLE",
        ).length,
        items,
        assortment,
        teaFitProbe: productFitScore(
          needIndustries,
          [...needKeywords, "чай"],
          "Закупка чая черного ферментированного",
        ),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
