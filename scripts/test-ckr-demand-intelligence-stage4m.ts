/**
 * Stage 4M — Demand Intelligence tests (in-memory).
 * Run: npx tsx scripts/test-ckr-demand-intelligence-stage4m.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildDemandClientShareMessage,
  buildDemandQueryPlan,
  demandTierLabelRu,
  evaluateDemandQuality,
  productFitScore,
  detectProductTags,
} from "../src/lib/demand-intelligence";
import { classifyDemandSignal } from "../src/lib/lia/oi/regional/demand-classify";
import { classifyFixtureSignal } from "../src/lib/personalized-feed/fixtures";
import { getIntentMapping } from "../src/lib/personalized-feed/mapping";
import { hardFilterCandidate, rankCandidate } from "../src/lib/personalized-feed/scoring";
import type { FeedCandidate } from "../src/types/personalized-feed";
import type { NeedProfile } from "../src/types/need-profile";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(e instanceof Error ? e.stack : e);
  }
}

function read(path: string) {
  return readFileSync(resolve(path), "utf8");
}

function need(
  partial: Partial<NeedProfile> & Pick<NeedProfile, "id" | "intentType" | "ownerId">,
): NeedProfile {
  return {
    title: partial.title || "TINDA SEEK_BUYER",
    description: "",
    ownerType: "user",
    status: "ACTIVE",
    budgetMin: null,
    budgetMax: null,
    currency: "RUB",
    regions: ["Дагестан"],
    industries: ["food", "beverage"],
    keywords: ["напитки", "продукты"],
    criteria: {},
    visibility: "CKR_ONLY",
    priority: "NORMAL",
    timeHorizon: null,
    riskPreference: null,
    matchingEnabled: true,
    lastMatchedAt: null,
    contextGroupId: null,
    fingerprint: null,
    source: "manual",
    createdBy: partial.ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

function cand(
  partial: Partial<FeedCandidate> & Pick<FeedCandidate, "id" | "itemType" | "title">,
): FeedCandidate {
  return {
    summary: "",
    region: null,
    industry: null,
    price: null,
    priceKnown: false,
    currency: "RUB",
    status: "published",
    sourceChannel: "internal",
    sourceLabel: "ЦКР",
    sourceKey: "ckr",
    href: "/",
    dataQuality: 6,
    sourceConfidence: 4,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    unknownFields: ["price"],
    confirmedFields: ["title"],
    ...partial,
  };
}

async function main() {
  console.log("\nStage 4M — Demand Intelligence\n");
  const n = need({
    id: "n-tinda",
    intentType: "SEEK_BUYER",
    ownerId: "u1",
  });

  await test("1. procurement → confirmed demand", () => {
    const dem = classifyDemandSignal({
      title: "Закупка продуктов питания",
      url: "https://zakupki.gov.ru/epz/order/notice/view.html",
      opportunityType: "PROCUREMENT",
      pageType: "DETAIL",
    });
    assert.equal(dem.classification, "CONFIRMED_DEMAND");
    const q = evaluateDemandQuality({
      candidate: {
        title: "Закупка продуктов питания · Дагестан",
        summary: "Поставка продуктов питания",
        region: "Дагестан",
        opportunityType: "PROCUREMENT",
        pageType: "DETAIL",
        url: "https://zakupki.gov.ru/x",
      },
      needRegions: n.regions,
      needIndustries: n.industries,
      needKeywords: n.keywords,
      feedScore: 79,
      published: true,
    });
    assert.equal(q.classification, "CONFIRMED_DEMAND");
    assert.equal(q.bucket, "REAL_GOOD");
  });

  await test("2. potential buyer ≠ confirmed buyer", () => {
    const dem = classifyDemandSignal({
      title: "Гостиницы и санатории Дагестана — каталог",
      pageType: "LIST",
    });
    assert.equal(dem.classification, "POTENTIAL_BUYER");
    const msg = buildDemandClientShareMessage({
      title: "Сеть отелей",
      region: "Дагестан",
      tier: "POTENTIAL_BUYER",
      whyShort: "Возможный канал сбыта.",
    });
    assert.ok(/потенциальным покупателем/i.test(msg));
    assert.ok(/не подтверждённый покупатель/i.test(msg));
    assert.ok(!/мы нашли покупателя/i.test(msg));
  });

  await test("3. expired procurement reject", () => {
    const c = cand({
      id: "exp",
      itemType: "opportunity",
      title: "Закупка продуктов",
      region: "Дагестан",
      rawType: "procurement",
      industries: ["food"],
      deadlineAt: "2020-01-01T00:00:00.000Z",
    });
    assert.equal(hardFilterCandidate(n, c).reject, true);
    const q = evaluateDemandQuality({
      candidate: {
        title: c.title,
        region: c.region,
        opportunityType: "PROCUREMENT",
        deadlineAt: c.deadlineAt,
      },
      needRegions: n.regions,
      needIndustries: n.industries,
    });
    assert.equal(q.tier, "EXPIRED");
  });

  await test("4. region scoring soft for other region beverage", () => {
    const dag = evaluateDemandQuality({
      candidate: {
        title: "Поставка напитков",
        summary: "безалкогольные напитки",
        region: "Дагестан",
        opportunityType: "PROCUREMENT",
        pageType: "DETAIL",
      },
      needRegions: n.regions,
      needIndustries: n.industries,
      published: true,
      feedScore: 70,
    });
    const msk = evaluateDemandQuality({
      candidate: {
        title: "Поставка напитков",
        summary: "безалкогольные напитки",
        region: "Московская область",
        opportunityType: "PROCUREMENT",
        pageType: "DETAIL",
      },
      needRegions: n.regions,
      needIndustries: n.industries,
      published: true,
      feedScore: 66,
    });
    assert.equal(dag.regionFit, "strong");
    assert.ok(msk.regionFit === "none" || msk.regionFit === "soft");
  });

  await test("5. product fit water/beverage", () => {
    const tags = detectProductTags("закупка воды питьевой и безалкогольных напитков");
    assert.ok(tags.includes("water") || tags.includes("beverage") || tags.includes("soft_drinks"));
    const fit = productFitScore(["food", "beverage"], ["напитки"], "Закупка воды питьевой");
    assert.ok(fit.score >= 12);
  });

  await test("6. UNKNOWN amount remains UNKNOWN", () => {
    const q = evaluateDemandQuality({
      candidate: {
        title: "Закупка продуктов питания",
        region: "Дагестан",
        opportunityType: "PROCUREMENT",
        pageType: "DETAIL",
        amountKnown: false,
      },
      needRegions: n.regions,
      needIndustries: n.industries,
      published: true,
      feedScore: 79,
    });
    assert.ok(q.reasons.includes("amount_unknown"));
    const c = cand({
      id: "u",
      itemType: "opportunity",
      title: "Закупка продуктов",
      region: "Дагестан",
      rawType: "procurement",
      industries: ["food"],
      priceKnown: false,
      price: null,
    });
    const ranked = rankCandidate(
      { ...n, budgetMax: 1_000_000 },
      c,
    );
    assert.equal(ranked.breakdown.budgetFit, 0);
  });

  await test("7. UNKNOWN deadline remains UNKNOWN", () => {
    const q = evaluateDemandQuality({
      candidate: {
        title: "Закупка продуктов",
        region: "Дагестан",
        opportunityType: "PROCUREMENT",
        pageType: "DETAIL",
        deadlineAt: null,
      },
      needRegions: n.regions,
      needIndustries: n.industries,
    });
    assert.ok(q.reasons.includes("deadline_unknown"));
  });

  await test("8. publication date ≠ deadline (no invention)", () => {
    // Quality model only reads deadlineAt — never sourcePublishedAt as deadline
    const src = read("src/lib/demand-intelligence/quality.ts");
    assert.ok(!/sourcePublishedAt/.test(src));
    assert.ok(/deadlineAt/.test(src));
  });

  await test("9. dedup official ID concept preserved in OI dedup", () => {
    const dedup = read("src/lib/lia/oi/dedup.ts");
    assert.ok(/sourceObjectId|official/i.test(dedup));
  });

  await test("10. different procurement IDs do not merge (static)", () => {
    const dedup = read("src/lib/lia/oi/dedup.ts");
    assert.ok(/sourceObjectId/.test(dedup));
  });

  await test("11. smoke/stub/seed excluded", () => {
    assert.equal(classifyFixtureSignal({ title: "smoke-public-u1" }), "SMOKE");
    const q = evaluateDemandQuality({
      candidate: {
        title: "[STUB] Fake buyer",
        isStub: true,
      },
      needRegions: n.regions,
      needIndustries: n.industries,
    });
    assert.equal(q.bucket, "SMOKE");
  });

  await test("12. real candidate not false-positive smoke on Stage 4E text", () => {
    assert.equal(
      classifyFixtureSignal({
        title: "Закупка продуктов питания · Дагестан · 0936",
        summary: "Stage 4E controlled publish. CONFIRMED_DEMAND.",
      }),
      "UNKNOWN",
    );
  });

  await test("13. unpublished OI hidden from client share action", () => {
    const actions = read("src/features/ckr-inbox/demand-discovery-actions.ts");
    assert.ok(/lia_oi/.test(actions));
    assert.ok(/Controlled Publish/.test(actions));
    assert.ok(/нельзя показывать клиенту/i.test(actions));
  });

  await test("14. staff can review (workbench sections)", () => {
    const ui = read("src/features/ckr-inbox/components/owner-demand-workbench.tsx");
    assert.ok(ui.includes("Подтверждённый спрос"));
    assert.ok(ui.includes("Потенциальные покупатели"));
    assert.ok(ui.includes("Требует проверки"));
    assert.ok(ui.includes("Найти ещё варианты"));
  });

  await test("15. share only safe published candidate", () => {
    const actions = read("src/features/ckr-inbox/demand-discovery-actions.ts");
    assert.ok(/published/.test(actions));
  });

  await test("16. client wording cautious", () => {
    const msg = buildDemandClientShareMessage({
      title: "Закупка продуктов",
      region: "Дагестан",
      tier: "CONFIRMED_DEMAND",
      whyShort: "Может соответствовать ассортименту.",
    });
    assert.ok(/закупк|сигнал спроса/i.test(msg));
    assert.ok(!/мы нашли покупателя/i.test(msg));
    assert.ok(!/score/i.test(msg));
  });

  await test("17. no MATCHES", () => {
    for (const f of [
      "src/lib/demand-intelligence/discovery.ts",
      "src/lib/demand-intelligence/workbench.ts",
      "src/features/ckr-inbox/demand-discovery-actions.ts",
    ]) {
      assert.ok(!/createMatch\(|\.from\(\s*["']matches["']\)/.test(read(f)));
    }
  });

  await test("18. no auto-publish", () => {
    const d = read("src/lib/demand-intelligence/discovery.ts");
    assert.ok(/autoPublish: false/.test(d));
    assert.ok(!/approveAndPublish|autoPublish\s*:\s*true/.test(d));
  });

  await test("19. no auto-outreach", () => {
    const d = read("src/features/ckr-inbox/demand-discovery-actions.ts");
    assert.ok(!/sendOutreach|autoOutreach|telegram\.send/.test(d));
  });

  await test("20. owner-lock regression pointer", () => {
    assert.ok(read("src/lib/lia/oi/publish/service.ts").includes("owner"));
  });

  await test("21. Stage 4L TINDA procurement mapping remains", () => {
    assert.ok(getIntentMapping("SEEK_BUYER").opportunityTypes?.includes("procurement"));
  });

  await test("22. RLS / inbox page wires demand workbench", () => {
    const page = read("src/app/(admin)/admin/owner/inbox/[id]/page.tsx");
    assert.ok(page.includes("OwnerDemandWorkbench"));
    assert.ok(page.includes("getDemandWorkbench"));
  });

  await test("23. Stage 4A–4L regression guards", () => {
    assert.ok(read("package.json").includes("test-ckr-tinda-demand-pilot-stage4l"));
    assert.equal(demandTierLabelRu("CONFIRMED_DEMAND"), "Подтверждённый спрос");
  });

  await test("query planner builds product-specific queries", () => {
    const plan = buildDemandQueryPlan({ need: n, maxQueries: 10 });
    assert.ok(plan.queries.length >= 4);
    assert.ok(plan.queries.some((q) => /zakupki\.gov\.ru/i.test(q.query)));
    assert.ok(plan.queries.some((q) => /продукт|напит|вод/i.test(q.query)));
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed\n`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
