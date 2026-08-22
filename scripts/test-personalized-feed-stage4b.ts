/**
 * Stage 4B — Personalized Feed «Для вас» tests (in-memory).
 * Run: npx tsx scripts/test-personalized-feed-stage4b.ts
 */
import assert from "node:assert/strict";
import { createMemoryPersonalizedFeedService } from "../src/lib/personalized-feed/service";
import {
  getIntentMapping,
  coverageByIntent,
} from "../src/lib/personalized-feed/mapping";
import { rankCandidate, hardFilterCandidate } from "../src/lib/personalized-feed/scoring";
import { explainRecommendation } from "../src/lib/personalized-feed/explain";
import { dedupeCandidates } from "../src/lib/personalized-feed/dedup";
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

function need(partial: Partial<NeedProfile> & Pick<NeedProfile, "id" | "intentType" | "ownerId">): NeedProfile {
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

function cand(partial: Partial<FeedCandidate> & Pick<FeedCandidate, "id" | "itemType" | "title">): FeedCandidate {
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

async function main() {
  await test("intent mapping INVEST FULL", () => {
    assert.equal(getIntentMapping("INVEST").coverage, "FULL");
    assert.ok(getIntentMapping("INVEST").itemTypes.includes("project"));
  });

  await test("intent mapping SEEK_SUPPORT/CONTRACT PARTIAL via published marketplace", () => {
    assert.equal(getIntentMapping("SEEK_SUPPORT").coverage, "PARTIAL");
    assert.equal(getIntentMapping("SEEK_CONTRACT").coverage, "PARTIAL");
    assert.deepEqual(getIntentMapping("SEEK_SUPPORT").opportunityTypes, [
      "support_program",
    ]);
    assert.deepEqual(getIntentMapping("SEEK_CONTRACT").opportunityTypes, [
      "procurement",
    ]);
  });

  await test("coverage map includes PARTIAL intents", () => {
    const m = coverageByIntent();
    assert.equal(m.SEEK_BUYER, "PARTIAL");
    assert.equal(m.SEEK_EXPERT, "FULL");
  });

  await test("hard budget filter excludes confirmed over budget", () => {
    const n = need({
      id: "n1",
      intentType: "INVEST",
      ownerId: "u1",
      budgetMax: 20_000_000,
      regions: ["Дагестан"],
      industries: ["manufacturing"],
    });
    const c = cand({
      id: "p1",
      itemType: "project",
      title: "Дорогой завод",
      price: 35_000_000,
      priceKnown: true,
      region: "Ставропольский край",
      industry: "production",
      industries: ["production"],
    });
    assert.equal(hardFilterCandidate(n, c).reject, true);
  });

  await test("unknown budget does not get budget-fit claim", () => {
    const n = need({
      id: "n1",
      intentType: "INVEST",
      ownerId: "u1",
      budgetMax: 20_000_000,
      regions: ["Дагестан"],
      industries: ["manufacturing"],
    });
    const c = cand({
      id: "p2",
      itemType: "project",
      title: "Без цены",
      priceKnown: false,
      region: "Дагестан",
      industry: "production",
      industries: ["production"],
      unknownFields: ["price"],
    });
    const ranked = rankCandidate(n, c);
    assert.equal(ranked.hardReject, false);
    assert.equal(ranked.breakdown.budgetFit, 0);
    const expl = explainRecommendation(n, c, ranked.breakdown, ranked.budgetNote);
    assert.ok(expl.notes.some((x) => /не подтверждена/i.test(x)));
    assert.ok(!/подходит по бюджету/i.test(expl.why));
  });

  await test("region and industry scores", () => {
    const n = need({
      id: "n1",
      intentType: "INVEST",
      ownerId: "u1",
      budgetMax: 20_000_000,
      regions: ["Дагестан", "Ставропольский край"],
      industries: ["manufacturing"],
    });
    const c = cand({
      id: "o1",
      itemType: "opportunity",
      title: "Линия розлива",
      price: 9_500_000,
      priceKnown: true,
      region: "Ставропольский край",
      industry: "equipment",
      industries: ["equipment"],
      rawType: "equipment",
    });
    const r = rankCandidate(n, c);
    assert.ok(r.breakdown.regionFit >= 12);
    assert.ok(r.breakdown.industryFit >= 12);
    assert.ok(r.breakdown.total >= 50);
  });

  await test("freshness and data quality contribute", () => {
    const n = need({ id: "n1", intentType: "SEEK_PROJECT", ownerId: "u1" });
    const fresh = cand({
      id: "a",
      itemType: "project",
      title: "A",
      dataQuality: 10,
      sourceConfidence: 5,
      updatedAt: new Date().toISOString(),
    });
    const stale = cand({
      id: "b",
      itemType: "project",
      title: "B",
      dataQuality: 2,
      sourceConfidence: 1,
      updatedAt: "2020-01-01T00:00:00.000Z",
    });
    assert.ok(rankCandidate(n, fresh).breakdown.total > rankCandidate(n, stale).breakdown.total);
  });

  await test("expired deadline hard filter", () => {
    const n = need({ id: "n1", intentType: "SEEK_CONTRACT", ownerId: "u1" });
    const c = cand({
      id: "x",
      itemType: "opportunity",
      title: "Просрочено",
      deadlineAt: "2020-01-01T00:00:00.000Z",
      status: "published",
    });
    assert.equal(hardFilterCandidate(n, c).reject, true);
  });

  await test("dedup by fingerprint", () => {
    const a = cand({
      id: "1",
      itemType: "project",
      title: "Same",
      fingerprint: "abc",
      dataQuality: 3,
    });
    const b = cand({
      id: "2",
      itemType: "lia_oi",
      title: "Same external",
      fingerprint: "abc",
      dataQuality: 8,
      sourceChannel: "external",
    });
    const { unique, removed } = dedupeCandidates([a, b]);
    assert.equal(removed, 1);
    assert.equal(unique.length, 1);
    assert.equal(unique[0]?.id, "2");
  });

  await test("scenario A INVEST feed", async () => {
    const svc = createMemoryPersonalizedFeedService();
    svc.resetForTests();
    const invest = need({
      id: "need-a",
      intentType: "INVEST",
      ownerId: "u1",
      title: "Инвестиции",
      budgetMax: 20_000_000,
      regions: ["Дагестан", "Ставропольский край"],
      industries: ["manufacturing"],
    });
    svc.setTestNeeds([invest]);
    svc.setTestCandidates([
      cand({
        id: "eq",
        itemType: "opportunity",
        title: "Линия розлива",
        price: 9_500_000,
        priceKnown: true,
        region: "Ставропольский край",
        industries: ["equipment"],
        rawType: "equipment",
        dataQuality: 7,
      }),
      cand({
        id: "over",
        itemType: "project",
        title: "Вода 35м",
        price: 35_000_000,
        priceKnown: true,
        region: "Ставропольский край",
        industries: ["production"],
      }),
      cand({
        id: "unk",
        itemType: "project",
        title: "Без цены",
        priceKnown: false,
        region: "Дагестан",
        industries: ["production"],
        unknownFields: ["price"],
      }),
    ]);
    const feed = await svc.getFeedForNeedProfile({ need: invest, ownerId: "u1" });
    assert.ok(feed.recommendations.some((r) => r.candidate.id === "eq"));
    assert.ok(!feed.recommendations.some((r) => r.candidate.id === "over"));
    const unk = feed.recommendations.find((r) => r.candidate.id === "unk");
    if (unk) {
      assert.equal(unk.breakdown.budgetFit, 0);
      assert.ok(unk.explanation.notes.some((n) => /не подтверждена/i.test(n)));
    }
    assert.ok(feed.diagnostics.candidateCount >= 3);
  });

  await test("scenario B SEEK_BUYER", async () => {
    const svc = createMemoryPersonalizedFeedService();
    svc.resetForTests();
    const needB = need({
      id: "need-b",
      intentType: "SEEK_BUYER",
      ownerId: "u1",
      regions: ["Дагестан"],
      industries: ["beverage"],
    });
    svc.setTestNeeds([needB]);
    svc.setTestCandidates([
      cand({
        id: "demand1",
        itemType: "need_profile",
        title: "Ищем напитки для сети",
        region: "Дагестан",
        industries: ["beverage"],
        rawType: "DEMAND",
        priceKnown: false,
        unknownFields: ["price"],
      }),
      cand({
        id: "partner",
        itemType: "opportunity",
        title: "Партнёрство HoReCa",
        region: "Дагестан",
        rawType: "partner",
        industries: ["partner"],
      }),
    ]);
    const feed = await svc.getFeedForNeedProfile({ need: needB, ownerId: "u1" });
    assert.ok(feed.recommendations.length >= 1);
    assert.equal(feed.diagnostics.coverage, "PARTIAL");
    assert.ok(feed.recommendations[0]?.explanation.why.length);
  });

  await test("scenario C SEEK_SUPPORT uses published support_program not raw LIA OI", async () => {
    const svc = createMemoryPersonalizedFeedService();
    svc.resetForTests();
    const needC = need({
      id: "need-c",
      intentType: "SEEK_SUPPORT",
      ownerId: "u1",
      regions: ["Дагестан"],
      industries: ["manufacturing"],
    });
    svc.setTestNeeds([needC]);
    // Raw LIA OI must not appear in user feed mapping (itemTypes=opportunity only)
    svc.setTestCandidates([
      cand({
        id: "raw-oi",
        itemType: "lia_oi",
        title: "Скрытая субсидия OI",
        sourceChannel: "external",
        sourceLabel: "Лия · господдержка",
        region: "Дагестан",
        industries: ["manufacturing"],
      }),
      cand({
        id: "pub-sup",
        itemType: "opportunity",
        title: "Опубликованная господдержка",
        region: "Дагестан",
        industry: "support_program",
        industries: ["support_program", "manufacturing"],
        rawType: "support_program",
        price: 3_000_000,
        priceKnown: true,
        sourceChannel: "external",
        sourceLabel: "Господдержка",
      }),
    ]);
    const feed = await svc.getFeedForNeedProfile({ need: needC, ownerId: "u1" });
    assert.equal(feed.diagnostics.coverage, "PARTIAL");
    assert.ok(feed.recommendations.length >= 1);
    assert.equal(feed.recommendations[0]?.candidate.id, "pub-sup");
    assert.ok(
      !feed.recommendations.some((r) => r.candidate.itemType === "lia_oi"),
    );
  });

  await test("scenario D multiple intents separate", async () => {
    const svc = createMemoryPersonalizedFeedService();
    svc.resetForTests();
    const invest = need({
      id: "need-i",
      intentType: "INVEST",
      ownerId: "u1",
      budgetMax: 20_000_000,
      regions: ["Дагестан"],
      industries: ["manufacturing"],
    });
    const partner = need({
      id: "need-p",
      intentType: "SEEK_PARTNER",
      ownerId: "u1",
      regions: ["Краснодарский край"],
      industries: ["hospitality"],
    });
    svc.setTestNeeds([invest, partner]);
    svc.setTestCandidates([
      cand({
        id: "eq",
        itemType: "opportunity",
        title: "Оборудование",
        price: 8_000_000,
        priceKnown: true,
        region: "Дагестан",
        rawType: "equipment",
        industries: ["equipment"],
      }),
      cand({
        id: "hot",
        itemType: "project",
        title: "Отель партнёрство",
        region: "Краснодарский край",
        industries: ["tourism"],
        price: 10_000_000,
        priceKnown: true,
      }),
    ]);
    const all = await svc.getFeedForOwner({ ownerId: "u1", limit: 20 });
    assert.equal(all.needs.length, 2);
    assert.ok(
      all.recommendations.every((r) =>
        ["need-i", "need-p"].includes(r.recommendationForNeedProfileId),
      ),
    );
    const onlyInvest = await svc.getFeedForOwner({
      ownerId: "u1",
      needProfileId: "need-i",
    });
    assert.ok(
      onlyInvest.recommendations.every(
        (r) => r.recommendationForNeedProfileId === "need-i",
      ),
    );
  });

  await test("feedback not_interested hides item", async () => {
    const svc = createMemoryPersonalizedFeedService();
    svc.resetForTests();
    const invest = need({
      id: "need-a",
      intentType: "INVEST",
      ownerId: "u1",
      budgetMax: 20_000_000,
      regions: ["Дагестан"],
      industries: ["manufacturing"],
    });
    svc.setTestNeeds([invest]);
    svc.setTestCandidates([
      cand({
        id: "eq",
        itemType: "opportunity",
        title: "Линия",
        price: 9_000_000,
        priceKnown: true,
        region: "Дагестан",
        rawType: "equipment",
        industries: ["equipment"],
      }),
    ]);
    await svc.recordFeedback({
      userId: "u1",
      needProfileId: "need-a",
      itemType: "opportunity",
      itemId: "eq",
      action: "not_interested",
    });
    const feed = await svc.getFeedForNeedProfile({ need: invest, ownerId: "u1" });
    assert.ok(!feed.recommendations.some((r) => r.candidate.id === "eq"));
  });

  await test("assignment to lia records feedback", async () => {
    const svc = createMemoryPersonalizedFeedService();
    svc.resetForTests();
    const res = await svc.assignLiaReview({
      userId: "u1",
      needProfileId: "need-a",
      itemType: "project",
      itemId: "p1",
      title: "Проект",
    });
    assert.equal(res.feedback.action, "assigned_to_lia");
    assert.equal(res.taskCreated, true);
    assert.equal(res.feedback.metadata.autoOutreach, false);
  });

  await test("explanation and owner diagnostics", async () => {
    const svc = createMemoryPersonalizedFeedService();
    svc.resetForTests();
    const invest = need({
      id: "need-a",
      intentType: "INVEST",
      ownerId: "u1",
      budgetMax: 20_000_000,
      regions: ["Ставропольский край"],
      industries: ["manufacturing"],
    });
    svc.setTestNeeds([invest]);
    svc.setTestCandidates([
      cand({
        id: "eq",
        itemType: "opportunity",
        title: "Линия",
        price: 9_500_000,
        priceKnown: true,
        region: "Ставропольский край",
        rawType: "equipment",
        industries: ["equipment"],
      }),
    ]);
    const diag = await svc.getOwnerDiagnostics({ ownerId: "u1" });
    assert.ok(diag.recommendedCount >= 1);
    assert.ok(diag.top[0]?.explanation.why);
    assert.ok(diag.mappings.length >= 10);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main();
