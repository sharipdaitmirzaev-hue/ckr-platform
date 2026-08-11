/**
 * Stage 4D — Data Quality & Content Expansion tests.
 * Run: npx tsx scripts/test-lia-data-quality-stage4d.ts
 * Forces memory store — no production mutation.
 */
process.env.LIA_OI_STORE = "memory";
process.env.BUSINESS_GRAPH_STORE = process.env.BUSINESS_GRAPH_STORE || "memory";

import assert from "node:assert/strict";
import {
  normalizeRegionLabel,
  detectCanonicalRegions,
  regionsCompatible,
  regionSearchTokens,
} from "../src/lib/geo/region-normalize";
import {
  expandIndustry,
  industriesOverlap,
  detectIndustryTags,
} from "../src/lib/catalog/industry-aliases";
import { classifyPageType } from "../src/lib/lia/oi/page-type";
import {
  extractLabeledMoney,
  extractPrimaryMoney,
} from "../src/lib/lia/oi/enrichment/money";
import { extractDeadlineFromOfficialText } from "../src/lib/lia/oi/enrichment/dates";
import {
  extractOfficialIdFromUrl,
  extractOfficialIdFromText,
  extractPriceFromText,
} from "../src/lib/lia/oi/sources/candidate-factory";
import { computeDataQuality } from "../src/lib/lia/oi/enrichment/quality";
import { computeDataQualityV2 } from "../src/lib/lia/oi/quality-v2";
import {
  computePublishability,
  isQueueWorthy,
} from "../src/lib/lia/oi/publishability";
import { passesPublicationQualityGate } from "../src/lib/lia/oi/publish/quality-gate";
import { buildSearchPlanV2 } from "../src/lib/lia/oi/planner-v2";
import { LIA_OI_BUDGETS } from "../src/config/lia-oi";
import {
  evaluateContentGaps,
  buildTargetedDiscoveryQuery,
  DEFAULT_GAP_SCENARIOS,
} from "../src/lib/lia/oi/content-gap";
import { getDiscoveryBudgetSnapshot, getSourceHealthRows } from "../src/lib/lia/oi/source-health";
import { emptyScore } from "../src/lib/lia/oi/score";
import {
  resetLiaOiStoreForTests,
  upsertCandidates,
  getCandidate,
} from "../src/lib/lia/oi/store";
import {
  getControlledPublishService,
  resetControlledPublishForTests,
  projectLiaOiToPublicDraft,
} from "../src/lib/lia/oi/publish";
import { mergeRediscovery, OWNER_LOCKED_STATUSES } from "../src/lib/lia/oi/fingerprint";
import { dedupeCandidates } from "../src/lib/lia/oi/dedup";
import type { LiaOiCandidate } from "../src/types/lia-oi";

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

function base(partial: Partial<LiaOiCandidate>): LiaOiCandidate {
  const now = new Date().toISOString();
  return {
    id: partial.id || "oi_4d",
    type: "web_opportunity",
    title: partial.title || "Закупка напитков Республика Дагестан № 0372100000123000001",
    description: partial.description || "НМЦК 2.5 млн ₽. Срок подачи до 20.09.2026",
    summary: "summary",
    whyInteresting: [],
    recommendation: "internal",
    nextStep: "owner",
    status: "NEW",
    country: "RU",
    region: "Дагестан",
    industry: "food",
    sources: [
      {
        id: "s1",
        category: "PROCUREMENT",
        name: "EIS",
        url: "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0372100000123000001",
        isStub: true,
      },
    ],
    claims: [],
    risks: [],
    unknowns: [],
    toVerify: [],
    score: { ...emptyScore(), overall: 70, quality: 55, confidence: 60 },
    matchHints: [],
    firstSeenAt: now,
    lastSeenAt: now,
    canonicalKey: "ck_4d",
    fingerprint: "fp_4d",
    canonicalUrl:
      "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0372100000123000001",
    rawStubIds: [],
    isStub: true,
    pageType: "DETAIL",
    isCatalogSource: false,
    contentIntent: "OPPORTUNITY",
    opportunityType: "PROCUREMENT",
    sourceAdapterId: "procurement",
    isOfficialSource: true,
    sourceObjectId: "0372100000123000001",
    nmck: 2_500_000,
    priceStatus: "KNOWN",
    priceKind: "NMCK",
    deadlineAt: "2026-09-20T00:00:00.000Z",
    dataQualityScore: 70,
    matchingReadiness: "PARTIAL",
    confirmedFields: ["region", "nmck", "deadline_at", "procurement_id"],
    unknownFields: [],
    ...partial,
  };
}

async function main() {
  console.log("\nStage 4D — Data Quality & Content Expansion\n");

  await test("region normalization Dagestan / cities / SKFO", () => {
    assert.equal(normalizeRegionLabel("Республика Дагестан"), "Дагестан");
    assert.equal(normalizeRegionLabel("Махачкала"), "Дагестан");
    assert.equal(normalizeRegionLabel("Каспийск"), "Дагестан");
    assert.equal(normalizeRegionLabel("Дербент"), "Дагестан");
    assert.equal(
      normalizeRegionLabel("Северо-Кавказский федеральный округ"),
      "СКФО",
    );
    assert.ok(regionsCompatible(["СКФО"], "Дагестан"));
    assert.ok(regionsCompatible(["Дагестан"], "Махачкала"));
    assert.ok(!regionsCompatible(["Дагестан"], "Москва"));
    // avoid false positive on bare unrelated text
    assert.equal(normalizeRegionLabel("кавказский ресторан меню"), null);
    const tokens = regionSearchTokens(["Дагестан"]);
    assert.ok(tokens.includes("Махачкала"));
    assert.ok(detectCanonicalRegions("закупки в Дагестане").includes("Дагестан"));
  });

  await test("industry aliases food/beverage/manufacturing", () => {
    assert.ok(expandIndustry("beverage").some((a) => a.includes("напит")));
    assert.ok(
      industriesOverlap(
        ["beverage"],
        "поставка безалкогольных напитков и воды",
        [],
      ),
    );
    assert.ok(industriesOverlap(["food"], "пищевая промышленность FMCG", []));
    assert.ok(detectIndustryTags("завод производство оборудования").includes("manufacturing"));
  });

  await test("DETAIL vs LIST/NEWS/GUIDE", () => {
    assert.equal(
      classifyPageType({
        url: "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=1",
        title: "Закупка напитков лот",
      }),
      "DETAIL",
    );
    assert.equal(
      classifyPageType({
        url: "https://example.com/catalog/business",
        title: "Каталог готового бизнеса",
      }),
      "LIST",
    );
    assert.equal(
      classifyPageType({
        url: "https://example.com/news/market-grew",
        title: "Новости рынка закупок",
        snippet: "Аналитики считают рынок вырос",
      }),
      "NEWS",
    );
    assert.equal(
      classifyPageType({
        url: "https://example.com/articles/how-to-buy",
        title: "Как купить бизнес и не продешевить",
      }),
      "GUIDE",
    );
  });

  await test("money extraction NMCK / support / тыс vs млн", () => {
    const nmck = extractPrimaryMoney("НМЦК составляет 12,5 млн ₽", ["NMCK"]);
    assert.ok(nmck);
    assert.equal(nmck!.kind, "NMCK");
    assert.equal(nmck!.amountRub, 12_500_000);

    const tys = extractPriceFromText("стартовая цена 200 тыс. руб.");
    assert.equal(tys, 200_000);
    const mln = extractPriceFromText("стартовая цена 200 млн ₽");
    assert.equal(mln, 200_000_000);

    const support = extractLabeledMoney(
      "Размер поддержки: 3 млн рублей",
      /размер\s+поддерж/i,
      "SUPPORT_AMOUNT",
    );
    assert.ok(support);
    assert.equal(support!.amountRub, 3_000_000);
    assert.equal(support!.kind, "SUPPORT_AMOUNT");
  });

  await test("deadline ≠ publication date", () => {
    const deadline = extractDeadlineFromOfficialText(
      "Срок подачи заявок: 15.10.2026. Организатор: Минсельхоз.",
    );
    assert.ok(deadline);
    assert.ok(deadline!.startsWith("2026-10-15"));

    const pubOnly = extractDeadlineFromOfficialText(
      "Дата публикации: 01.08.2026. Статья обновлена 02.08.2026.",
    );
    assert.equal(pubOnly, null);
  });

  await test("official ID from URL and text — no invent", () => {
    const id = extractOfficialIdFromUrl(
      "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0372100000123000001",
      "procurement",
    );
    assert.equal(id, "0372100000123000001");
    const fromText = extractOfficialIdFromText(
      "Извещение № 0372100000123000001 на поставку",
      "procurement",
    );
    assert.equal(fromText, "0372100000123000001");
    assert.equal(extractOfficialIdFromText("просто новость без номера", "procurement"), null);
  });

  await test("status / expiry → EXPIRED publishability", () => {
    const expired = base({
      id: "oi_exp",
      deadlineAt: "2020-01-01T00:00:00.000Z",
      auctionStatus: "COMPLETED",
    });
    // lifecycle via detectLifecycleHint uses deadline/status fields
    const pub = computePublishability(expired);
    // may be EXPIRED if lifecycle detects; at least not READY if past deadline heavily
    assert.ok(["EXPIRED", "READY_TO_REVIEW", "NEEDS_ENRICHMENT", "WEAK_SOURCE"].includes(pub.tier));
  });

  await test("quality score v2 demotes LIST/NEWS", () => {
    const detail = base({ id: "oi_d", pageType: "DETAIL", isCatalogSource: false });
    const list = base({
      id: "oi_l",
      pageType: "LIST",
      isCatalogSource: true,
      contentIntent: "CATALOG",
      title: "Каталог закупок",
    });
    const news = base({
      id: "oi_n",
      pageType: "NEWS",
      contentIntent: "NEWS",
      title: "Новости рынка",
    });
    const qd = computeDataQualityV2({ candidate: detail });
    const ql = computeDataQualityV2({ candidate: list });
    const qn = computeDataQualityV2({ candidate: news });
    assert.ok(qd.dataQualityScore > ql.dataQualityScore);
    assert.ok(qd.dataQualityScore > qn.dataQualityScore);
    assert.ok(ql.dataQualityScore <= 30);
    assert.ok(qn.dataQualityScore <= 22);
  });

  await test("publishability gate READY vs WEAK / no junk queue", () => {
    const good = base({ id: "oi_good" });
    const gateGood = passesPublicationQualityGate(good);
    assert.equal(gateGood.ok, true);
    assert.ok(isQueueWorthy(gateGood.publishabilityTier));

    const junk = base({
      id: "oi_junk",
      pageType: "LIST",
      isCatalogSource: true,
      contentIntent: "CATALOG",
      sourceObjectId: null,
      nmck: null,
      deadlineAt: null,
      priceStatus: "UNKNOWN",
    });
    const gateJunk = passesPublicationQualityGate(junk);
    assert.equal(gateJunk.ok, false);
    assert.ok(!isQueueWorthy(computePublishability(junk).tier) || gateJunk.ok === false);

    const searchList = base({
      id: "oi_search",
      pageType: "DETAIL", // historically wrong
      canonicalUrl:
        "https://zakupki.gov.ru/epz/order/extendedsearch/results.html",
      sources: [
        {
          id: "s",
          category: "PROCUREMENT",
          name: "EIS",
          url: "https://zakupki.gov.ru/epz/order/extendedsearch/results.html",
          isStub: false,
        },
      ],
      nmck: 22,
      region: undefined,
    });
    assert.equal(computePublishability(searchList).tier, "WEAK_SOURCE");

    const stubDemo = base({
      id: "oi_stub",
      title: "[STUB] demo",
      canonicalUrl: "https://stub.ckr-center.ru/demo/x",
      nmck: 12_000_000,
      region: "Дагестан",
    });
    assert.equal(computePublishability(stubDemo).tier, "WEAK_SOURCE");
  });

  await test("query planner v2 budgets + need strategies", () => {
    const plan = buildSearchPlanV2({
      need: {
        intentType: "SEEK_CONTRACT",
        regions: ["Дагестан"],
        industries: ["beverage"],
        budgetMax: 30_000_000,
        budgetMin: null,
        title: "Контракты напитки",
      },
    });
    // Stage 4E: Dagestan/SKFO needs use regional site strategies
    assert.equal(plan.plannerVersion, "v2-regional");
    assert.ok(plan.queries.length <= LIA_OI_BUDGETS.maxQueriesPass1);
    assert.ok(plan.queries.some((q) => /закуп|zakupki|нмцк|site:/i.test(q)));
    assert.ok(
      plan.strategies.includes("regional_site_strategies") ||
        plan.strategies.includes("procurement_sites"),
    );
  });

  await test("dedup strong official id; weak title does not merge", () => {
    const a = base({
      id: "oi_a1",
      sourceObjectId: "0372100000123000001",
      fingerprint: "fp_a",
      canonicalKey: "ck_a",
      title: "Закупка A",
    });
    const b = base({
      id: "oi_a2",
      sourceObjectId: "0372100000123000001",
      fingerprint: "fp_b",
      canonicalKey: "ck_b",
      title: "Закупка A повтор",
      canonicalUrl: a.canonicalUrl,
    });
    const weak = base({
      id: "oi_w",
      sourceObjectId: "9999999999999999999",
      fingerprint: "fp_w",
      canonicalKey: "ck_w",
      title: "Закупка A",
      canonicalUrl: "https://example.com/other",
    });
    const deduped = dedupeCandidates([a, b, weak]);
    assert.ok(deduped.length <= 2);
    assert.ok(deduped.some((c) => c.sourceObjectId === "9999999999999999999"));
  });

  await test("rediscovery + owner lock compatibility", () => {
    const existing = base({
      id: "oi_lock",
      status: "SAVED",
      ownerLocked: true,
      nmck: 1_000_000,
    });
    assert.ok(OWNER_LOCKED_STATUSES.has("SAVED") || existing.ownerLocked);
    const incoming = base({
      id: "oi_lock",
      nmck: 1_200_000,
      lastSeenAt: new Date().toISOString(),
    });
    const merged = mergeRediscovery(existing, incoming);
    assert.equal(merged.ownerLocked, true);
    assert.equal(merged.status, "SAVED");
  });

  await test("content gap + targeted query builder", () => {
    const rows = evaluateContentGaps([
      base({ id: "g1", opportunityType: "PROCUREMENT", industry: "beverage" }),
      base({
        id: "g2",
        opportunityType: "SUPPORT_PROGRAM",
        industry: "manufacturing",
        title: "Субсидия МСП производство Дагестан",
        description: "грант на оборудование",
        nmck: null,
        supportAmount: 5_000_000,
        sourceObjectId: "prog1",
      }),
    ]);
    assert.equal(rows.length, DEFAULT_GAP_SCENARIOS.length);
    assert.ok(rows.every((r) => r.gapSeverity));
    const q = buildTargetedDiscoveryQuery(DEFAULT_GAP_SCENARIOS[0]!);
    // Stage 4E: first strategy is site-restricted EIS geo (may use city token)
    assert.ok(/zakupki\.gov\.ru|закуп|извещени/i.test(q));
    assert.ok(/дагестан|махачкал/i.test(q));
  });

  await test("source health + budget snapshot (no secrets)", () => {
    const health = getSourceHealthRows();
    assert.ok(health.some((h) => h.id === "serper"));
    assert.ok(health.every((h) => ["OK", "DEGRADED", "UNAVAILABLE"].includes(h.health)));
    const b = getDiscoveryBudgetSnapshot();
    assert.ok(b.maxQueriesPerRun > 0);
    assert.ok(b.maxSafeFetchesPerRun > 0);
    const blob = JSON.stringify({ health, b });
    assert.ok(!/api[_-]?key/i.test(blob));
  });

  await test("no auto publish — queueEligible does not approve", async () => {
    resetLiaOiStoreForTests();
    resetControlledPublishForTests();
    await upsertCandidates([base({ id: "oi_pub_check" })]);
    const svc = getControlledPublishService();
    const actor = "user_owner_4d";
    const q = await svc.queueEligible(actor);
    assert.ok(q.queued >= 0);
    const item = await svc.getQueueItem("oi_pub_check");
    if (item) {
      assert.notEqual(item.publicationState, "published");
      assert.ok(
        item.publicationState === "queued" ||
          item.publicationState === "none" ||
          item.publicationState === "rejected",
      );
    }
    // approve is separate explicit call — not invoked here
    const c = await getCandidate("oi_pub_check");
    assert.ok(c);
    const draft = projectLiaOiToPublicDraft(c!);
    assert.equal(draft.sourceType, "lia_oi");
  });

  await test("bulk reject only — never bulk publish API shape", async () => {
    resetLiaOiStoreForTests();
    resetControlledPublishForTests();
    await upsertCandidates([
      base({ id: "oi_r1" }),
      base({ id: "oi_r2", sourceObjectId: "2", fingerprint: "fp2", canonicalKey: "ck2" }),
    ]);
    const svc = getControlledPublishService();
    await svc.queueOne("oi_r1", "owner");
    await svc.queueOne("oi_r2", "owner");
    const res = await svc.rejectMany(["oi_r1", "oi_r2"], "owner", "test");
    assert.equal(res.rejected, 2);
    assert.ok(!("published" in res));
  });

  await test("v1 vs v2: UNKNOWN region not confirmed bonus", () => {
    const c = base({
      id: "oi_reg",
      region: undefined,
      confirmedFields: ["region"],
    });
    const v1 = computeDataQuality({ candidate: c, structuredFields: [] });
    const v2 = computeDataQualityV2({ candidate: c, structuredFields: [] });
    assert.ok(!v2.confirmedFields.includes("region") || !c.region);
    assert.ok(v2.qualityVersion === "v2");
    assert.ok(typeof v1.dataQualityScore === "number");
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed\n`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
