/**
 * Stage 4L — TINDA Real Demand Pilot tests (in-memory + static guards).
 * Run: npx tsx scripts/test-ckr-tinda-demand-pilot-stage4l.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildClientShareMessage,
  toWorkbenchView,
} from "../src/lib/ckr-inbox/request-workbench";
import { isSharedCandidateMessage } from "../src/lib/ckr-inbox/client-presentation";
import {
  demandSignalKind,
  demandSignalTypeLabel,
  productDemandFit,
} from "../src/lib/personalized-feed/demand-signals";
import { explainRecommendation } from "../src/lib/personalized-feed/explain";
import {
  classifyFixtureSignal,
  isFixtureNoise,
} from "../src/lib/personalized-feed/fixtures";
import { getIntentMapping } from "../src/lib/personalized-feed/mapping";
import {
  hardFilterCandidate,
  rankCandidate,
} from "../src/lib/personalized-feed/scoring";
import { createMemoryPersonalizedFeedService } from "../src/lib/personalized-feed/service";
import type { FeedCandidate, FeedRecommendation } from "../src/types/personalized-feed";
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
    title: partial.title || partial.intentType,
    description: "",
    ownerType: "user",
    status: "ACTIVE",
    budgetMin: null,
    budgetMax: null,
    currency: "RUB",
    regions: [],
    industries: [],
    keywords: [],
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
    unknownFields: [],
    confirmedFields: ["title"],
    ...partial,
  };
}

function tindaNeed(): NeedProfile {
  return need({
    id: "15e85d03-2dd9-4c99-8d28-4c66e03d29d5",
    intentType: "SEEK_BUYER",
    ownerId: "0839fe5c-d5a0-4acd-946d-1f0f88ccd72b",
    title: "ТИНДА — найти покупателей",
    regions: ["Дагестан", "Махачкала", "СКФО"],
    industries: ["food", "beverage"],
    keywords: ["опт", "напитки", "продукты"],
  });
}

async function main() {
  console.log("\nStage 4L — TINDA Real Demand Pilot\n");

  await test("1. SEEK_BUYER includes procurement", () => {
    const m = getIntentMapping("SEEK_BUYER");
    assert.ok(m.opportunityTypes?.includes("procurement"));
    assert.ok(m.opportunityTypes?.includes("partner"));
    assert.ok(m.itemTypes.includes("need_profile"));
  });

  await test("2. Procurement other industry does not get high score from region alone", () => {
    const n = tindaNeed();
    const c = cand({
      id: "proc-it",
      itemType: "opportunity",
      title: "Закупка IT-оборудования · Дагестан",
      summary: "Серверы и сетевое оборудование",
      region: "Республика Дагестан",
      regions: ["Республика Дагестан"],
      rawType: "procurement",
      industries: ["it"],
      industry: "it",
      sourceLabel: "Официальные закупки",
      sourceConfidence: 6,
    });
    const ranked = rankCandidate(n, c);
    assert.equal(ranked.hardReject, false);
    assert.ok(
      ranked.breakdown.regionFit <= 6,
      `regionFit should be capped, got ${ranked.breakdown.regionFit}`,
    );
    assert.ok(
      ranked.breakdown.industryFit < 12,
      `industryFit should be weak, got ${ranked.breakdown.industryFit}`,
    );
  });

  await test("3. Food procurement Dagestan fits food supplier Dagestan", () => {
    const n = tindaNeed();
    const c = cand({
      id: "proc-food-dag",
      itemType: "opportunity",
      title: "Закупка продуктов питания · Дагестан · 0936",
      summary: "Поставка продуктов питания для учреждений",
      region: "Республика Дагестан",
      regions: ["Республика Дагестан"],
      rawType: "procurement",
      industries: ["food"],
      industry: "food",
      sourceLabel: "Официальные закупки",
      sourceChannel: "external",
      sourceConfidence: 7,
      dataQuality: 7,
    });
    const ranked = rankCandidate(n, c);
    assert.equal(ranked.hardReject, false);
    assert.ok(ranked.breakdown.regionFit >= 12);
    assert.ok(ranked.breakdown.industryFit >= 15);
    assert.ok(ranked.breakdown.total >= 50);
    assert.equal(demandSignalKind(c), "procurement");
    assert.equal(demandSignalTypeLabel("procurement"), "Закупка");
  });

  await test("4. Beverage procurement other region gets lower region fit", () => {
    const n = tindaNeed();
    const dag = cand({
      id: "proc-bev-dag",
      itemType: "opportunity",
      title: "Поставка воды и напитков",
      summary: "Безалкогольные напитки",
      region: "Республика Дагестан",
      rawType: "procurement",
      industries: ["beverage"],
    });
    const msk = cand({
      id: "proc-bev-msk",
      itemType: "opportunity",
      title: "Поставка воды и напитков",
      summary: "Безалкогольные напитки",
      region: "Московская область",
      rawType: "procurement",
      industries: ["beverage"],
    });
    const rDag = rankCandidate(n, dag);
    const rMsk = rankCandidate(n, msk);
    assert.ok(rDag.breakdown.regionFit > rMsk.breakdown.regionFit);
    assert.ok(rMsk.breakdown.total < rDag.breakdown.total);
  });

  await test("5. UNKNOWN amount stays UNKNOWN (no invented price)", () => {
    const n = need({
      ...tindaNeed(),
      budgetMax: 5_000_000,
    });
    const c = cand({
      id: "proc-unk",
      itemType: "opportunity",
      title: "Закупка продуктов питания",
      region: "Дагестан",
      rawType: "procurement",
      price: null,
      priceKnown: false,
      unknownFields: ["price"],
      industries: ["food"],
    });
    // Candidate amount stays unknown — never invent price from title/region.
    assert.equal(c.price, null);
    assert.equal(c.priceKnown, false);
    const ranked = rankCandidate(n, c);
    assert.equal(ranked.breakdown.budgetFit, 0);
    const expl = explainRecommendation(n, c, ranked.breakdown, ranked.budgetNote);
    assert.ok(expl.notes.some((x) => /цена не подтверждена/i.test(x)));
    assert.ok(!expl.matched.some((m) => /бюджет/i.test(m)));
  });

  await test("6. expired procurement excluded", () => {
    const n = tindaNeed();
    const c = cand({
      id: "proc-exp",
      itemType: "opportunity",
      title: "Закупка продуктов питания",
      region: "Дагестан",
      rawType: "procurement",
      industries: ["food"],
      deadlineAt: "2020-01-01T00:00:00.000Z",
    });
    assert.equal(hardFilterCandidate(n, c).reject, true);
    assert.equal(rankCandidate(n, c).hardReject, true);
  });

  await test("7. smoke/stub excluded from real request workbench", async () => {
    assert.equal(
      classifyFixtureSignal({ title: "smoke-public-u1 partner offer" }),
      "SMOKE",
    );
    assert.ok(isFixtureNoise({ title: "smoke-public-u1" }));
    assert.ok(isFixtureNoise({ title: "[STUB] fake buyer" }));
    assert.ok(
      isFixtureNoise({
        title: "Закупка напитков",
        summary: "Предварительный анализ stub-сигнала «Закупка»",
      }),
    );
    assert.ok(isFixtureNoise({ id: "aaaaaaaa-1111-1111-1111-111111111111" }));
    // Real published row with Stage 4E provenance must NOT be smoke
    assert.equal(
      classifyFixtureSignal({
        title: "Закупка продуктов питания · Дагестан · 0936",
        summary: "Stage 4E controlled publish. CONFIRMED_DEMAND.",
      }),
      "UNKNOWN",
    );

    const feed = createMemoryPersonalizedFeedService();
    feed.resetForTests();
    const n = tindaNeed();
    feed.setTestNeeds([n]);
    feed.setTestCandidates([
      cand({
        id: "smoke-1",
        itemType: "opportunity",
        title: "smoke-public-u1 partner",
        region: "Дагестан",
        rawType: "partner",
        industries: ["food"],
      }),
      cand({
        id: "real-food",
        itemType: "opportunity",
        title: "Закупка продуктов питания · Дагестан",
        summary: "продукты питания. Stage 4E controlled publish.",
        region: "Республика Дагестан",
        rawType: "procurement",
        industries: ["food"],
        sourceLabel: "Официальные закупки",
        sourceConfidence: 7,
      }),
    ]);
    const { recommendations } = await feed.getFeedForNeedProfile({
      need: n,
      ownerId: n.ownerId,
      excludeFixtures: true,
      minScore: 50,
      requireProductFit: true,
    });
    assert.ok(recommendations.every((r) => !/smoke/i.test(r.candidate.title)));
    assert.ok(
      recommendations.some((r) => r.candidate.rawType === "procurement"),
    );
  });

  await test("8. published candidate visible to owner workbench view", () => {
    const n = tindaNeed();
    const c = cand({
      id: "pub-1",
      itemType: "opportunity",
      title: "Закупка продуктов питания",
      region: "Дагестан",
      rawType: "procurement",
      status: "published",
      industries: ["food"],
    });
    const ranked = rankCandidate(n, c);
    const rec: FeedRecommendation = {
      recommendationId: `${n.id}:opportunity:${c.id}`,
      recommendationForNeedProfileId: n.id,
      needIntentType: n.intentType,
      candidate: c,
      score: ranked.breakdown.total,
      breakdown: ranked.breakdown,
      explanation: explainRecommendation(n, c, ranked.breakdown, null),
    };
    const view = toWorkbenchView(rec);
    assert.equal(view.shareable, true);
    assert.equal(view.signalTypeLabel, "Закупка");
    assert.equal(view.signalStatusLabel, "Требует проверки");
  });

  await test("9. raw OI not shown to client (static + share message)", () => {
    const clientPage = read("src/app/(dashboard)/dashboard/ckr-requests/[id]/page.tsx");
    assert.ok(!/lia_oi|LIA OI|scoreDistribution|Need Profile ID/i.test(clientPage));
    const msg = buildClientShareMessage({
      title: "Закупка продуктов",
      signalTypeLabel: "Закупка",
      region: "Дагестан",
      whyShort: "Может соответствовать ассортименту.",
    });
    assert.ok(!/score|OI|Graph|provenance/i.test(msg));
    assert.ok(/не подтверждённый покупатель/i.test(msg));
  });

  await test("10. client sees only owner-approved/shared result", () => {
    const msg = buildClientShareMessage({
      title: "Закупка продуктов питания",
      signalTypeLabel: "Закупка",
      region: "Республика Дагестан",
      whyShort:
        "Эта закупка может соответствовать вашему ассортименту. ЦКР рекомендует проверить условия участия.",
    });
    assert.ok(isSharedCandidateMessage(msg));
    assert.ok(msg.includes("ЦКР нашёл вариант"));
    const actions = read("src/features/ckr-inbox/request-workbench-actions.ts");
    assert.ok(actions.includes('visibility: "CLIENT"'));
    assert.ok(actions.includes("CANDIDATE_SHARED"));
    assert.ok(actions.includes("published"));
  });

  await test("11. no MATCHES created", () => {
    const files = [
      "src/lib/ckr-inbox/request-workbench.ts",
      "src/features/ckr-inbox/request-workbench-actions.ts",
      "src/lib/personalized-feed/scoring.ts",
      "src/lib/personalized-feed/mapping.ts",
    ];
    for (const f of files) {
      const src = read(f);
      assert.ok(!/createMatch\(|\.from\(\s*["']matches["']\)|insertMatch/i.test(src));
    }
  });

  await test("12. no auto publish", () => {
    const actions = read("src/features/ckr-inbox/request-workbench-actions.ts");
    assert.ok(!/publishOpportunity|autoPublish|approveAndPublish/i.test(actions));
    assert.ok(actions.includes("Controlled Publish"));
  });

  await test("13. no auto outreach", () => {
    const actions = read("src/features/ckr-inbox/request-workbench-actions.ts");
    assert.ok(!/sendOutreach|autoOutreach|telegram\.send|sendEmail\(/i.test(actions));
    // Share creates CLIENT comment only — not external outreach channel
    assert.ok(actions.includes("ckr_request_comments"));
  });

  await test("14. TINDA data unchanged (no write to TINDA ids in stage4l)", () => {
    const actions = read("src/features/ckr-inbox/request-workbench-actions.ts");
    assert.ok(!/223decd8-c99a-4d24-ba25-2cb5d91749d3/.test(actions));
    assert.ok(!/fb5843fb-ab25-43bc-9af7-d74c6ef66176/.test(actions));
    // Share action updates comments/events only — never mutates need/org/request status fields
    assert.ok(!/\.update\(\s*\{[^}]*status/s.test(actions));
    assert.ok(!/need_profiles/.test(actions));
    assert.ok(!/organizations/.test(actions));
  });

  await test("15. regression Stage 4A–4K guards present", () => {
    assert.ok(read("src/lib/personalized-feed/mapping.ts").includes("SEEK_BUYER"));
    assert.ok(read("package.json").includes("test-ckr-owner-client-control-stage4k"));
    assert.ok(
      read("src/app/(admin)/admin/owner/inbox/[id]/page.tsx").includes(
        "OwnerDemandWorkbench",
      ) ||
        read("src/app/(admin)/admin/owner/inbox/[id]/page.tsx").includes(
          "OwnerRequestWorkbench",
        ),
    );
    assert.equal(getIntentMapping("SEEK_CONTRACT").opportunityTypes?.[0], "procurement");
    // Other intents unchanged: INVEST still no procurement
    assert.ok(!getIntentMapping("INVEST").opportunityTypes?.includes("procurement"));
  });

  await test("productDemandFit UNKNOWN when no industry signal", () => {
    const n = tindaNeed();
    const c = cand({
      id: "x",
      itemType: "opportunity",
      title: "Возможность без темы",
      summary: "без деталей",
      rawType: "partner",
      industries: [],
    });
    const fit = productDemandFit(n, c);
    assert.equal(fit.unknown, true);
  });

  await test("explain does not claim buyer for procurement", () => {
    const n = tindaNeed();
    const c = cand({
      id: "p",
      itemType: "opportunity",
      title: "Закупка продуктов",
      region: "Дагестан",
      rawType: "procurement",
      industries: ["food"],
    });
    const ranked = rankCandidate(n, c);
    const expl = explainRecommendation(n, c, ranked.breakdown, null);
    assert.ok(/сигнал спроса/i.test(expl.why + expl.notes.join(" ")));
    assert.ok(!/мы нашли покупателя/i.test(expl.why));
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed\n`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
