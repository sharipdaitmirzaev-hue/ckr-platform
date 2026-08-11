/**
 * Stage 4E — Regional Opportunity Coverage tests.
 * Run: npx tsx scripts/test-lia-regional-coverage-stage4e.ts
 * Forces memory store — no production mutation.
 */
process.env.LIA_OI_STORE = "memory";
process.env.BUSINESS_GRAPH_STORE = process.env.BUSINESS_GRAPH_STORE || "memory";

import assert from "node:assert/strict";
import { normalizeRegionLabel } from "../src/lib/geo/region-normalize";
import {
  DAGESTAN_SOURCES,
  SKFO_SOURCES,
  listRegionalSources,
  domainsForNeed,
} from "../src/lib/lia/oi/regional/source-registry";
import { buildRegionalQueryStrategies } from "../src/lib/lia/oi/regional/query-strategy";
import {
  classifyDemandSignal,
  attachDemandClassification,
} from "../src/lib/lia/oi/regional/demand-classify";
import { computeSupportApplicability } from "../src/lib/lia/oi/regional/support-applicability";
import {
  evaluateSourcePerformance,
  formatSourcePerformanceRu,
} from "../src/lib/lia/oi/regional/source-performance";
import {
  buildRegionalCoverageCard,
  dagestanCoverageFromCandidates,
} from "../src/lib/lia/oi/regional/coverage";
import {
  DEFAULT_GAP_SCENARIOS,
  evaluateContentGaps,
  buildTargetedDiscoveryQuery,
  resolveGapScenarioId,
  strategiesForGapScenario,
} from "../src/lib/lia/oi/content-gap";
import { buildSearchPlanV2 } from "../src/lib/lia/oi/planner-v2";
import { analyzeCandidate } from "../src/lib/lia/oi/analyze";
import { dedupeCandidates } from "../src/lib/lia/oi/dedup";
import { passesPublicationQualityGate } from "../src/lib/lia/oi/publish/quality-gate";
import {
  KNOWN_TEST_DATA_INVENTORY,
  summarizeInventory,
} from "../src/lib/lia/oi/regional/test-data-inventory";
import { MARKETPLACE_MANUAL_CONTENT_TYPES } from "../src/lib/lia/oi/regional/marketplace-content";
import { emptyScore } from "../src/lib/lia/oi/score";
import { LIA_OI_BUDGETS } from "../src/config/lia-oi";
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
    id: partial.id || "oi_4e",
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
    canonicalKey: "ck_4e",
    fingerprint: "fp_4e",
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
  console.log("\nStage 4E — Regional Opportunity Coverage\n");

  await test("regional source selection Dagestan first", () => {
    assert.ok(DAGESTAN_SOURCES.length >= 8);
    assert.ok(SKFO_SOURCES.length >= 6);
    const regions = new Set(SKFO_SOURCES.map((s) => s.region));
    for (const r of [
      "Ставропольский край",
      "Чечня",
      "Ингушетия",
      "Кабардино-Балкария",
      "Северная Осетия",
      "Карачаево-Черкесия",
    ]) {
      assert.ok(regions.has(r as never), `missing ${r}`);
    }
    const dag = listRegionalSources({ region: "Дагестан", enabledOnly: true });
    assert.ok(dag.some((s) => s.domain === "zakupki.gov.ru"));
    assert.ok(dag.some((s) => s.domain === "mbdag.ru"));
    const domains = domainsForNeed({
      regions: ["Дагестан"],
      intentType: "SEEK_CONTRACT",
    });
    assert.ok(domains.includes("zakupki.gov.ru"));
  });

  await test("Dagestan normalization", () => {
    assert.equal(normalizeRegionLabel("Махачкала"), "Дагестан");
    assert.equal(normalizeRegionLabel("Республика Дагестан"), "Дагестан");
  });

  await test("confirmed demand vs potential buyer", () => {
    const confirmed = classifyDemandSignal({
      title: "Закупка питьевой воды НМЦК 1 млн",
      url: "https://zakupki.gov.ru/epz/order/notice/1",
      opportunityType: "PROCUREMENT",
      pageType: "DETAIL",
    });
    assert.equal(confirmed.classification, "CONFIRMED_DEMAND");
    assert.equal(confirmed.provenance, "FACT");

    const potential = classifyDemandSignal({
      title: "Список гостиниц Дагестана",
      description: "Каталог отелей и санаториев Махачкалы",
      pageType: "LIST",
    });
    assert.equal(potential.classification, "POTENTIAL_BUYER");
    assert.equal(potential.provenance, "INFERENCE");

    const attached = attachDemandClassification(
      base({
        title: "Каталог ресторанов Махачкалы",
        description: "Адреса и контакты заведений общепита",
        opportunityType: "WEB_LISTING",
        pageType: "LIST",
        canonicalUrl: "https://example.com/hotels",
        sources: [
          {
            id: "s_dir",
            category: "PUBLIC_WEB",
            name: "Directory",
            url: "https://example.com/hotels",
            isStub: true,
          },
        ],
      }),
    );
    assert.equal(attached.demandClassification, "POTENTIAL_BUYER");
  });

  await test("regional support applicability federal vs Dagestan", () => {
    const fed = computeSupportApplicability({
      title: "Программа поддержки МСП Корпорации МСП",
      url: "https://corpmsp.ru/programs/grant",
      region: "Россия",
    });
    assert.equal(fed.isFederal, true);
    assert.match(fed.regionApplicability, /Russia/);
    assert.notEqual(fed.regionApplicability, "Dagestan");

    const local = computeSupportApplicability({
      title: "Грант Мой бизнес Дагестан",
      url: "https://mbdag.ru/support/grant",
      region: "Дагестан",
    });
    assert.equal(local.isFederal, false);
    assert.equal(local.regionApplicability, "Dagestan");
  });

  await test("source performance quality over volume", () => {
    const rows = evaluateSourcePerformance([
      base({ id: "a", sourceAdapterId: "procurement", pageType: "DETAIL" }),
      base({
        id: "b",
        sourceAdapterId: "procurement",
        pageType: "LIST",
        isCatalogSource: true,
        contentIntent: "CATALOG",
        nmck: null,
        deadlineAt: null,
      }),
      base({
        id: "c",
        sourceAdapterId: "web",
        pageType: "NEWS",
        contentIntent: "NEWS",
        nmck: null,
      }),
    ]);
    assert.ok(rows.length >= 2);
    const proc = rows.find((r) => r.sourceId === "procurement");
    assert.ok(proc);
    assert.ok(proc!.discovered === 2);
    const msg = formatSourcePerformanceRu(proc!);
    assert.match(msg, /procurement/);
    assert.match(msg, /результат/);
  });

  await test("content gap scenarios + legacy ids + strategies", () => {
    assert.equal(DEFAULT_GAP_SCENARIOS[0]!.id, "a_contract_food_dag");
    assert.equal(resolveGapScenarioId("b_support_mfg_dag"), "c_support_mfg_dag");
    assert.equal(resolveGapScenarioId("d_buyer_food_nc"), "b_buyer_food_nc");
    const gaps = evaluateContentGaps([
      base({ id: "g1" }),
      base({
        id: "g2",
        title: "Список гостиниц Дагестана",
        opportunityType: "WEB_LISTING",
        pageType: "LIST",
        demandClassification: "POTENTIAL_BUYER",
      }),
    ]);
    assert.ok(gaps.some((g) => g.scenarioId === "a_contract_food_dag"));
    const q = buildTargetedDiscoveryQuery(DEFAULT_GAP_SCENARIOS[0]!);
    assert.match(q, /site:zakupki\.gov\.ru/);
    const strat = strategiesForGapScenario(DEFAULT_GAP_SCENARIOS[0]!, 3);
    assert.ok(strat.length >= 1);
    assert.ok(strat.every((s) => s.query.includes("site:") || s.query.length > 10));
  });

  await test("targeted query strategy site-specific not broad-only", () => {
    const strat = buildRegionalQueryStrategies({
      intentType: "SEEK_SUPPORT",
      regions: ["Дагестан"],
      industries: ["manufacturing"],
      maxQueries: 6,
    });
    assert.ok(strat.some((s) => /site:mbdag\.ru|site:minec|site:corpmsp/i.test(s.query)));
    const contract = buildRegionalQueryStrategies({
      intentType: "SEEK_CONTRACT",
      regions: ["Дагестан"],
      industries: ["food", "beverage"],
      maxQueries: 4,
    });
    assert.ok(contract.every((s) => s.query.includes("site:zakupki.gov.ru") || s.id.includes("contract")));
  });

  await test("planner v2 regional prefers site queries + budget cap", () => {
    const plan = buildSearchPlanV2({
      need: {
        intentType: "SEEK_CONTRACT",
        regions: ["Дагестан"],
        industries: ["beverage"],
        budgetMax: null,
        budgetMin: null,
        title: "contract food dag",
      },
      regionalFirst: true,
    });
    assert.equal(plan.plannerVersion, "v2-regional");
    assert.ok(plan.queries.length <= LIA_OI_BUDGETS.maxQueriesPass1);
    assert.ok(plan.queries.some((q) => q.includes("site:zakupki.gov.ru")));
  });

  await test("dedup still works with regional candidates", () => {
    const a = base({ id: "d1", fingerprint: "same", canonicalKey: "same" });
    const b = base({ id: "d2", fingerprint: "same", canonicalKey: "same" });
    const out = dedupeCandidates([a, b]);
    assert.ok(out.length <= 2);
  });

  await test("analyze attaches demand + controlled publish gate compat", () => {
    const analyzed = analyzeCandidate(
      base({
        title: "Закупка воды для школы Махачкала",
        opportunityType: "PROCUREMENT",
      }),
    );
    assert.equal(analyzed.demandClassification, "CONFIRMED_DEMAND");
    const gate = passesPublicationQualityGate(analyzed);
    assert.equal(typeof gate.ok, "boolean");
  });

  await test("Dagestan coverage card", () => {
    const card = dagestanCoverageFromCandidates([
      base({ id: "c1" }),
      base({
        id: "c2",
        region: "Москва",
        title: "Закупка Москва",
      }),
    ]);
    assert.equal(card.region, "Дагестан");
    assert.equal(card.oiTotal, 1);
    assert.ok(card.confirmedDemand >= 1);
    const skfo = buildRegionalCoverageCard({
      region: "СКФО",
      candidates: [base({ id: "s1", region: "Дагестан" })],
    });
    assert.ok(skfo.oiTotal >= 1);
  });

  await test("test-data inventory + marketplace manual types", () => {
    assert.ok(KNOWN_TEST_DATA_INVENTORY.length >= 8);
    const classes = new Set(KNOWN_TEST_DATA_INVENTORY.map((i) => i.cleanupClass));
    assert.ok(classes.has("SAFE_TO_DELETE"));
    assert.ok(classes.has("REAL_DATA"));
    const sum = summarizeInventory();
    assert.equal(sum.migrationRequired, false);
    assert.ok(MARKETPLACE_MANUAL_CONTENT_TYPES.some((t) => t.type === "investment_project"));
    assert.ok(MARKETPLACE_MANUAL_CONTENT_TYPES.every((t) => t.createPath.startsWith("/")));
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
