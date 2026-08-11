/**
 * Stage 4C — Controlled Publish tests (in-memory).
 * Run: npx tsx scripts/test-lia-controlled-publish-stage4c.ts
 */
import assert from "node:assert/strict";
import { emptyScore } from "../src/lib/lia/oi/score";
import {
  resetLiaOiStoreForTests,
  upsertCandidates,
} from "../src/lib/lia/oi/store";
import {
  assertNoInternalLeak,
  enforceSafeProjection,
  getControlledPublishService,
  passesPublicationQualityGate,
  projectLiaOiToPublicDraft,
  resetControlledPublishForTests,
  userSourceLabelForCandidate,
} from "../src/lib/lia/oi/publish";
import { createMemoryPersonalizedFeedService } from "../src/lib/personalized-feed/service";
import { getIntentMapping } from "../src/lib/personalized-feed/mapping";
import type { LiaOiCandidate } from "../src/types/lia-oi";
import type { NeedProfile } from "../src/types/need-profile";
import type { FeedCandidate } from "../src/types/personalized-feed";

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

function baseCandidate(partial: Partial<LiaOiCandidate>): LiaOiCandidate {
  const now = new Date().toISOString();
  return {
    id: partial.id || "oi_test",
    type: "web_opportunity",
    title: partial.title || "Тестовая возможность",
    description: partial.description || "Описание тестовой возможности для публикации.",
    summary: partial.summary || "Краткое описание.",
    whyInteresting: [],
    recommendation: "internal only",
    nextStep: "owner only",
    status: "NEW",
    country: "RU",
    region: "Дагестан",
    industry: "manufacturing",
    sources: partial.sources || [
      {
        id: "s1",
        category: "SUPPORT_PROGRAMS",
        name: "MSP",
        url: "https://corpmsp.ru/programs/example",
        isStub: true,
      },
    ],
    claims: [],
    risks: ["internal risk"],
    unknowns: [],
    toVerify: [],
    score: {
      ...emptyScore(),
      overall: 72,
      quality: 7,
      confidence: 6,
      whyTop: ["Подходит для производства"],
    },
    matchHints: ["secret hint"],
    firstSeenAt: now,
    lastSeenAt: now,
    canonicalKey: partial.canonicalKey || `ck_${partial.id || "oi_test"}`,
    fingerprint: partial.fingerprint || `fp_${partial.id || "oi_test"}`,
    canonicalUrl:
      partial.canonicalUrl || "https://corpmsp.ru/programs/example",
    rawStubIds: ["stub"],
    isStub: true,
    pageType: "DETAIL",
    isCatalogSource: false,
    opportunityType: "SUPPORT_PROGRAM",
    sourceAdapterId: "support_programs",
    isOfficialSource: true,
    dataQualityScore: 7,
    matchingReadiness: "PARTIAL",
    confirmedFields: ["title", "region"],
    unknownFields: ["price"],
    whyRecommend: ["Субсидия релевантна производству"],
    contactPhone: "+7-900-000-00-00",
    contactEmail: "hidden@example.com",
    ...partial,
  };
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

async function seed(candidates: LiaOiCandidate[]) {
  resetLiaOiStoreForTests();
  resetControlledPublishForTests();
  await upsertCandidates(candidates);
}

async function main() {
  console.log("\nStage 4C — Controlled Publish\n");

  await test("safe projection allowlist / no internal leak", async () => {
    const c = baseCandidate({
      id: "oi_support_1",
      opportunityType: "SUPPORT_PROGRAM",
      supportAmount: 5_000_000,
      unknownFields: ["price"],
    });
    const draft = projectLiaOiToPublicDraft(c);
    assert.equal(draft.type, "support_program");
    assert.equal(draft.sourceType, "lia_oi");
    assert.equal(draft.sourceId, "oi_support_1");
    assert.equal(draft.price, 5_000_000);
    const safe = enforceSafeProjection(draft);
    const leaks = assertNoInternalLeak(safe as Record<string, unknown>);
    assert.equal(leaks.length, 0, leaks.join(","));
    assert.ok(!("contactPhone" in safe));
    assert.ok(!("recommendation" in safe));
    assert.ok(!("matchHints" in safe));
    assert.equal(userSourceLabelForCandidate(c), "Господдержка");
  });

  await test("quality gate allows UNKNOWN price", () => {
    const c = baseCandidate({
      id: "oi_q",
      priceStatus: "UNKNOWN",
      unknownFields: ["price"],
      dataQualityScore: 5,
    });
    const gate = passesPublicationQualityGate(c);
    assert.equal(gate.ok, true);
  });

  await test("quality gate rejects missing URL / REJECTED", () => {
    const bad = baseCandidate({
      id: "oi_bad",
      status: "REJECTED",
      canonicalUrl: "",
      sources: [],
    });
    assert.equal(passesPublicationQualityGate(bad).ok, false);
  });

  await test("approve / reject / edit before publish", async () => {
    await seed([
      baseCandidate({
        id: "oi_a",
        opportunityType: "SUPPORT_PROGRAM",
        supportAmount: 3_000_000,
      }),
      baseCandidate({
        id: "oi_b",
        opportunityType: "PROCUREMENT",
        nmck: 18_000_000,
        canonicalUrl:
          "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=1",
        sources: [
          {
            id: "p",
            category: "PROCUREMENT",
            name: "EIS",
            url: "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=1",
            isStub: true,
          },
        ],
        sourceAdapterId: "procurement",
        fingerprint: "fp_proc_1",
        canonicalKey: "ck_proc_1",
        industry: "food",
        deadlineAt: new Date(Date.now() + 86400000 * 20).toISOString(),
      }),
    ]);
    const svc = getControlledPublishService("memory");
    const q = await svc.queueEligible("owner1");
    assert.ok(q.queued >= 2);

    await svc.editDraft("oi_a", "owner1", {
      title: "Субсидия (owner edit)",
      region: "Республика Дагестан",
    });
    const approved = await svc.approve("oi_a", "owner1");
    assert.equal(approved.opportunity.status, "published");
    assert.equal(approved.opportunity.title, "Субсидия (owner edit)");
    assert.equal(approved.opportunity.sourceType, "lia_oi");
    assert.equal(approved.opportunity.type, "support_program");
    assert.ok(approved.opportunity.ownerEditedFields.includes("title"));

    await svc.reject("oi_b", "owner1", "low quality");
    const itemB = await svc.getQueueItem("oi_b");
    assert.equal(itemB?.publicationState, "rejected");

    const audit = svc.listAudit("oi_a");
    assert.ok(audit.some((e) => e.action === "approve_publish"));
    assert.ok(audit.some((e) => e.action === "edit_draft"));
  });

  await test("duplicate publish does not create second opportunity", async () => {
    await seed([
      baseCandidate({
        id: "oi_dup",
        fingerprint: "fp_dup",
        supportAmount: 1_000_000,
      }),
    ]);
    const svc = getControlledPublishService("memory");
    await svc.queueEligible("owner1");
    const first = await svc.approve("oi_dup", "owner1");
    const second = await svc.approve("oi_dup", "owner1");
    assert.equal(first.opportunity.id, second.opportunity.id);
    assert.equal(svc.listPublished().length, 1);
  });

  await test("owner lock survives rediscovery", async () => {
    await seed([
      baseCandidate({
        id: "oi_lock",
        title: "Original title",
        supportAmount: 2_000_000,
        fingerprint: "fp_lock",
      }),
    ]);
    const svc = getControlledPublishService("memory");
    await svc.queueEligible("owner1");
    await svc.editDraft("oi_lock", "owner1", { title: "Owner locked title" });
    await svc.approve("oi_lock", "owner1");

    const rediscovered = baseCandidate({
      id: "oi_lock",
      title: "Rediscovered NEW title",
      supportAmount: 2_000_000,
      fingerprint: "fp_lock",
      region: "Дагестан",
    });
    await upsertCandidates([rediscovered]);
    // critical title change → change_review; locked title must not auto-overwrite
    const result = await svc.onRediscovery(rediscovered);
    assert.equal(result.action, "change_review");
    const pub = svc.getPublishedBySource("oi_lock");
    assert.equal(pub?.title, "Owner locked title");
  });

  await test("change review apply/reject + expiry archive", async () => {
    await seed([
      baseCandidate({
        id: "oi_ch",
        opportunityType: "PROCUREMENT",
        nmck: 25_000_000,
        title: "Закупка молока",
        fingerprint: "fp_ch",
        canonicalUrl: "https://zakupki.gov.ru/epz/order/notice/x",
        sources: [
          {
            id: "p",
            category: "PROCUREMENT",
            name: "EIS",
            url: "https://zakupki.gov.ru/epz/order/notice/x",
            isStub: true,
          },
        ],
        sourceAdapterId: "procurement",
        deadlineAt: new Date(Date.now() + 86400000 * 10).toISOString(),
      }),
    ]);
    const svc = getControlledPublishService("memory");
    await svc.queueEligible("owner1");
    await svc.approve("oi_ch", "owner1");

    const changed = baseCandidate({
      id: "oi_ch",
      opportunityType: "PROCUREMENT",
      nmck: 18_000_000,
      title: "Закупка молока",
      fingerprint: "fp_ch",
      canonicalUrl: "https://zakupki.gov.ru/epz/order/notice/x",
      sources: [
        {
          id: "p",
          category: "PROCUREMENT",
          name: "EIS",
          url: "https://zakupki.gov.ru/epz/order/notice/x",
          isStub: true,
        },
      ],
      sourceAdapterId: "procurement",
      deadlineAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    });
    await upsertCandidates([changed]);
    const rev = await svc.onRediscovery(changed);
    assert.equal(rev.action, "change_review");
    assert.ok(rev.pending.some((p) => p.field === "price"));

    await svc.rejectPendingChanges("oi_ch", "owner1");
    assert.equal((await svc.getQueueItem("oi_ch"))?.publicationState, "published");
    assert.equal(svc.getPublishedBySource("oi_ch")?.price, 25_000_000);

    // re-open change and apply
    await svc.onRediscovery(changed);
    await svc.applyPendingChanges("oi_ch", "owner1");
    assert.equal(svc.getPublishedBySource("oi_ch")?.price, 18_000_000);

    const closed = {
      ...changed,
      procurementStage: "CANCELLED",
      nmck: 18_000_000,
    };
    await upsertCandidates([closed]);
    const arch = await svc.onRediscovery(closed);
    assert.equal(arch.action, "archived");
    assert.equal(svc.getPublishedBySource("oi_ch")?.status, "archived");
  });

  await test("no MATCHES edge created", async () => {
    await seed([
      baseCandidate({ id: "oi_nomatch", supportAmount: 1 }),
    ]);
    const svc = getControlledPublishService("memory");
    await svc.queueEligible("owner1");
    await svc.approve("oi_nomatch", "owner1");
    const events = svc.listAudit("oi_nomatch");
    assert.ok(!events.some((e) => JSON.stringify(e).includes("MATCHES")));
  });

  await test("SUPPORT + CONTRACT feed coverage PARTIAL", async () => {
    assert.equal(getIntentMapping("SEEK_SUPPORT").coverage, "PARTIAL");
    assert.equal(getIntentMapping("SEEK_CONTRACT").coverage, "PARTIAL");
    assert.deepEqual(getIntentMapping("SEEK_SUPPORT").opportunityTypes, [
      "support_program",
    ]);
    assert.deepEqual(getIntentMapping("SEEK_CONTRACT").opportunityTypes, [
      "procurement",
    ]);

    await seed([
      baseCandidate({
        id: "oi_sup_feed",
        opportunityType: "SUPPORT_PROGRAM",
        supportAmount: 4_000_000,
        region: "Дагестан",
        industry: "manufacturing",
        fingerprint: "fp_sup_feed",
      }),
      baseCandidate({
        id: "oi_proc_feed",
        opportunityType: "PROCUREMENT",
        nmck: 12_000_000,
        region: "Дагестан",
        industry: "beverage",
        fingerprint: "fp_proc_feed",
        canonicalUrl: "https://zakupki.gov.ru/epz/order/notice/feed",
        sources: [
          {
            id: "p",
            category: "PROCUREMENT",
            name: "EIS",
            url: "https://zakupki.gov.ru/epz/order/notice/feed",
            isStub: true,
          },
        ],
        sourceAdapterId: "procurement",
        deadlineAt: new Date(Date.now() + 86400000 * 14).toISOString(),
        customer: "Администрация",
      }),
    ]);
    const pub = getControlledPublishService("memory");
    await pub.queueEligible("owner1");
    const sup = await pub.approve("oi_sup_feed", "owner1");
    const proc = await pub.approve("oi_proc_feed", "owner1");

    const feedSvc = createMemoryPersonalizedFeedService();
    feedSvc.resetForTests();
    feedSvc.setTestNeeds([
      need({
        id: "need-sup",
        intentType: "SEEK_SUPPORT",
        ownerId: "u1",
        regions: ["Дагестан"],
        industries: ["manufacturing"],
      }),
      need({
        id: "need-ctr",
        intentType: "SEEK_CONTRACT",
        ownerId: "u1",
        regions: ["Дагестан"],
        industries: ["beverage", "food"],
      }),
    ]);

    const toFeed = (o: typeof sup.opportunity, rawType: string): FeedCandidate => ({
      id: o.id,
      itemType: "opportunity",
      title: o.title,
      summary: o.description,
      region: o.region,
      industry: rawType,
      industries: [rawType, o.region],
      price: o.price,
      priceKnown: o.price != null,
      currency: "RUB",
      status: o.status,
      sourceChannel: "external",
      sourceLabel: o.sourceLabel,
      sourceKey: "lia_published",
      href: `/opportunity/${o.id}`,
      fingerprint: o.fingerprint,
      canonicalUrl: o.canonicalUrl,
      deadlineAt: o.deadlineAt,
      dataQuality: 7,
      sourceConfidence: 6,
      updatedAt: o.updatedAt,
      createdAt: o.createdAt,
      rawType,
      unknownFields: o.price == null ? ["price"] : [],
      confirmedFields: ["title", "region", "source"],
    });

    feedSvc.setTestCandidates([
      toFeed(sup.opportunity, "support_program"),
      toFeed(proc.opportunity, "procurement"),
    ]);

    const supportFeed = await feedSvc.getFeedForNeedProfile({
      need: need({
        id: "need-sup",
        intentType: "SEEK_SUPPORT",
        ownerId: "u1",
        regions: ["Дагестан"],
        industries: ["manufacturing"],
      }),
      ownerId: "u1",
    });
    assert.equal(supportFeed.diagnostics.coverage, "PARTIAL");
    assert.ok(supportFeed.diagnostics.candidateCount >= 1);
    assert.ok(supportFeed.recommendations.length >= 1);
    assert.ok(supportFeed.recommendations[0]?.explanation.why.length);
    assert.equal(
      supportFeed.recommendations[0]?.candidate.sourceChannel,
      "external",
    );

    const contractFeed = await feedSvc.getFeedForNeedProfile({
      need: need({
        id: "need-ctr",
        intentType: "SEEK_CONTRACT",
        ownerId: "u1",
        regions: ["Дагестан"],
        industries: ["beverage"],
      }),
      ownerId: "u1",
    });
    assert.equal(contractFeed.diagnostics.coverage, "PARTIAL");
    assert.ok(contractFeed.recommendations.length >= 1);
    assert.equal(contractFeed.recommendations[0]?.candidate.rawType, "procurement");
  });

  await test("official source label not technical adapter id", () => {
    assert.equal(
      userSourceLabelForCandidate(
        baseCandidate({ sourceAdapterId: "serper_general", opportunityType: "OTHER" }),
      ),
      "Открытый источник",
    );
    const label = userSourceLabelForCandidate(
      baseCandidate({
        opportunityType: "PROCUREMENT",
        sourceAdapterId: "procurement",
      }),
    );
    assert.equal(label, "Официальные закупки");
    assert.ok(!String(label).includes("serper"));
    assert.ok(!String(label).includes("adapter"));
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
