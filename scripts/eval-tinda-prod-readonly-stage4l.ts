/**
 * READ-ONLY production evaluation for TINDA SEEK_BUYER workbench.
 * Does not mutate any rows.
 */
import { createClient } from "@supabase/supabase-js";
import { rowToNeed, type NeedProfileRow } from "../src/lib/need-profile/mappers";
import { enrichCandidateIndustries } from "../src/lib/personalized-feed/demand-signals";
import {
  classifyFixtureSignal,
  isFixtureNoise,
} from "../src/lib/personalized-feed/fixtures";
import { getIntentMapping } from "../src/lib/personalized-feed/mapping";
import { rankCandidate } from "../src/lib/personalized-feed/scoring";
import {
  labelForLiaOiSource,
  labelForMarketplaceSource,
} from "../src/lib/personalized-feed/source-labels";
import { createMemoryPersonalizedFeedService } from "../src/lib/personalized-feed/service";
import { toWorkbenchView } from "../src/lib/ckr-inbox/request-workbench";
import type { FeedCandidate } from "../src/types/personalized-feed";

const NEED_ID = "15e85d03-2dd9-4c99-8d28-4c66e03d29d5";
const REQ_ID = "223decd8-c99a-4d24-ba25-2cb5d91749d3";
const ORG_ID = "fb5843fb-ab25-43bc-9af7-d74c6ef66176";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env");
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: req } = await db
    .from("ckr_requests")
    .select(
      "id,status,request_type,need_profile_id,organization_id,next_step_public,subject",
    )
    .eq("id", REQ_ID)
    .maybeSingle();
  const { data: needRow } = await db
    .from("need_profiles")
    .select("*")
    .eq("id", NEED_ID)
    .maybeSingle();
  const { data: org } = await db
    .from("organizations")
    .select("id,name,region,type")
    .eq("id", ORG_ID)
    .maybeSingle();

  if (!needRow) {
    console.error("TINDA need not found");
    process.exit(1);
  }

  const mapping = getIntentMapping("SEEK_BUYER");
  const { data: opps } = await db
    .from("opportunities")
    .select(
      "id,title,description,region,type,status,price,deadline_at,source_type,source_label,fingerprint,created_at,updated_at,data_quality_score,verification_status,canonical_url,source_url,amount_kind",
    )
    .eq("status", "published")
    .in("type", mapping.opportunityTypes || [])
    .limit(80);

  console.log("REQ", req);
  console.log("ORG", org);
  console.log(
    "NEED",
    needRow.intent_type,
    needRow.regions,
    needRow.industries,
    needRow.title,
  );
  console.log("Published mapped opps", (opps || []).length);
  console.log(
    "Procurement",
    (opps || []).filter((o) => o.type === "procurement").length,
  );

  const foodish = (opps || []).filter((o) =>
    /продукт|напит|пищев|еда|beverage|food/i.test(
      `${o.title} ${o.description || ""}`,
    ),
  );
  console.log("\nFood/beverage published:");
  for (const o of foodish.slice(0, 20)) {
    console.log(
      ` - [${o.type}] ${o.title} | ${o.region} | ${o.source_type} | ${classifyFixtureSignal(
        {
          id: o.id,
          title: o.title,
          summary: o.description,
          sourceType: o.source_type,
          fingerprint: o.fingerprint,
        },
      )}`,
    );
  }

  const need = rowToNeed(needRow as NeedProfileRow);
  const candidates: FeedCandidate[] = (opps || []).map((row) => {
    const industries = enrichCandidateIndustries(
      row.title || "",
      row.description || "",
      [],
    );
    const isLia = row.source_type === "lia_oi";
    const src = isLia
      ? labelForLiaOiSource(row.type)
      : row.type === "procurement"
        ? labelForMarketplaceSource("procurement")
        : labelForMarketplaceSource("opportunity");
    const price =
      row.price == null || row.price === "" ? null : Number(row.price);
    return {
      id: row.id,
      itemType: "opportunity",
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
      sourceConfidence: row.type === "procurement" ? 7 : 5,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      rawType: row.type,
      unknownFields: price == null ? ["price"] : [],
      confirmedFields: ["title"],
    };
  });

  // Also PUBLIC demand needs
  const { data: demands } = await db
    .from("need_profiles")
    .select(
      "id,title,description,intent_type,regions,industries,budget_min,budget_max,currency,status,visibility,created_at,updated_at",
    )
    .eq("status", "ACTIVE")
    .eq("visibility", "PUBLIC")
    .neq("id", NEED_ID)
    .limit(80);
  for (const row of demands || []) {
    candidates.push({
      id: row.id,
      itemType: "need_profile",
      title: row.title,
      summary: row.description || "",
      region: row.regions?.[0] || null,
      regions: row.regions || [],
      industry: row.industries?.[0] || null,
      industries: row.industries || [],
      price: row.budget_max ?? row.budget_min ?? null,
      priceKnown: row.budget_max != null || row.budget_min != null,
      currency: row.currency || "RUB",
      status: row.status,
      ...labelForMarketplaceSource("need_profile"),
      href: `/dashboard/needs/${row.id}`,
      dataQuality: 4,
      sourceConfidence: 3,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      rawType: row.intent_type,
      visibility: row.visibility,
      unknownFields: [],
      confirmedFields: ["title"],
    });
  }

  const feed = createMemoryPersonalizedFeedService();
  feed.resetForTests();
  feed.setTestNeeds([need]);
  feed.setTestCandidates(candidates);

  const withoutFilter = await feed.getFeedForNeedProfile({
    need,
    ownerId: need.ownerId,
    limit: 10,
    excludeFixtures: false,
    minScore: 25,
  });
  const workbench = await feed.getFeedForNeedProfile({
    need,
    ownerId: need.ownerId,
    limit: 8,
    excludeFixtures: true,
    minScore: 50,
    requireProductFit: true,
  });

  console.log("\n=== PROD workbench (excludeFixtures) ===");
  let good = 0;
  let acceptable = 0;
  let weak = 0;
  let smoke = 0;
  for (const r of workbench.recommendations) {
    const v = toWorkbenchView(r);
    const fx = isFixtureNoise(r.candidate);
    const bucket = fx
      ? "SMOKE"
      : r.score >= 60
        ? "REAL_GOOD"
        : r.score >= 45
          ? "REAL_ACCEPTABLE"
          : "WEAK";
    if (bucket === "REAL_GOOD") good += 1;
    else if (bucket === "REAL_ACCEPTABLE") acceptable += 1;
    else if (bucket === "WEAK") weak += 1;
    else smoke += 1;
    console.log(`\n[${bucket}] ${v.score} ${v.signalTypeLabel}: ${v.title}`);
    console.log(`  region=${v.region} source=${v.sourceLabel}`);
    console.log(`  matched=${v.matched.join(" · ") || "—"}`);
    console.log(`  id=${v.itemId}`);
  }

  const dagFood = candidates.find(
    (c) =>
      c.rawType === "procurement" &&
      /продукт/i.test(c.title) &&
      /дагестан/i.test(`${c.region || ""} ${c.title}`),
  );
  if (dagFood) {
    const ranked = rankCandidate(need, dagFood);
    console.log("\nA YES — Dagestan food procurement present");
    console.log("B score", ranked.breakdown.total, ranked.breakdown);
    console.log(
      "In workbench?",
      workbench.recommendations.some((r) => r.candidate.id === dagFood.id),
    );
  } else {
    console.log("\nA NO — Dagestan food procurement not in published mapped set");
  }

  console.log("\nBuckets", { good, acceptable, weak, smoke });
  console.log("without fixture filter top count", withoutFilter.recommendations.length);
  console.log("workbench count", workbench.recommendations.length);
  console.log(
    "PUBLIC needs total",
    (demands || []).length,
    "DEMAND/SEEK_SUPPLIER",
    (demands || []).filter((d) =>
      ["DEMAND", "SEEK_SUPPLIER"].includes(d.intent_type),
    ).length,
  );
  console.log("TINDA status still", req?.status, "need", req?.need_profile_id);
  console.log("READ-ONLY complete — no writes performed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
