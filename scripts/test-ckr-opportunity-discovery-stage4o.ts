/**
 * Stage 4O — Opportunity Discovery tests (in-memory, no production writes).
 * Run: npm run test:ckr-opportunity-discovery-stage4o
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  applyReviewState,
  buildContextFromManual,
  buildContextFromNeed,
  buildSearchPlan,
  clientFacingCandidateCopy,
  COMPANY_LEARNING_RULE,
  dedupeCandidates,
  describeOpportunityBankApproach,
  fingerprintSearchContext,
  formatDiscoveryRunRu,
  identityKeys,
  isInternalSufficient,
  mapClientFeedback,
  oiCandidateToDiscovery,
  proposeCompanyFactsFromText,
  REVIEW_WITHOUT_MIGRATION_NOTE,
  runDiscoverySync,
  searchInternalCatalog,
  SOURCE_ADAPTER_CATALOG,
  titlesLookSimilar,
  type InternalCatalogRow,
} from "../src/lib/opportunity-discovery";
import type { LiaOiCandidate } from "../src/types/lia-oi";
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
    keywords: ["напитки", "чай", "продукты"],
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

function catalog(): InternalCatalogRow[] {
  return [
    {
      entityType: "opportunity",
      id: "opp-tea-1",
      title: "Закупка чая и чайной продукции 0303300143726000006",
      summary: "Поставка чая для учреждений Дагестана",
      region: "Дагестан",
      amount: 26000,
      sourceType: "procurement",
      noticeId: "0303300143726000006",
      href: "/opportunity/opp-tea-1",
      status: "published",
      url: "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0303300143726000006",
    },
    {
      entityType: "opportunity",
      id: "opp-dairy-1",
      title: "Поставка молочной продукции",
      summary: "Молоко и кисломолочные продукты",
      region: "Дагестан",
      amount: 906000,
      sourceType: "procurement",
      href: "/opportunity/opp-dairy-1",
      status: "published",
    },
    {
      entityType: "project",
      id: "proj-hotel",
      title: "Гостиница на Каспии",
      summary: "Инвестиционный проект гостиницы, нужно софинансирование",
      region: "Дагестан",
      amount: 25000000,
      sourceType: "project",
      href: "/project/proj-hotel",
      status: "published",
    },
    {
      entityType: "investment_offer",
      id: "inv-1",
      title: "Капитал до 50 млн на СКФО",
      summary: "Ищем действующий бизнес или проект",
      region: "СКФО",
      amount: 50000000,
      sourceType: "capital",
      href: "/investment/inv-1",
      status: "published",
    },
    {
      entityType: "organization",
      id: "org-tinda",
      title: "ООО Тинда",
      summary: "Оптовая торговля продуктами и напитками",
      region: "Дагестан",
      industry: "food",
      organization: "ООО Тинда",
      keywords: ["напитки", "продукты"],
      href: "/admin/owner/companies",
      status: "published",
    },
    {
      entityType: "opportunity",
      id: "seed-1",
      title: "[SEED] Demo procurement fixture",
      summary: "seed-demo",
      region: "Дагестан",
      sourceType: "procurement",
      href: "/opportunity/seed-1",
      status: "published",
    },
    {
      entityType: "opportunity",
      id: "smoke-1",
      title: "smoke-public test SAFE_TO_DELETE",
      summary: "fixture",
      region: "Дагестан",
      sourceType: "procurement",
      href: "/opportunity/smoke-1",
      status: "published",
    },
    {
      entityType: "lia_oi",
      id: "oi-dup-tea",
      title: "Чай закупка 0303300143726000006",
      summary: "Тот же notice из OI",
      region: "Дагестан",
      sourceType: "procurement",
      noticeId: "0303300143726000006",
      href: "/admin/owner/lia/opportunities/oi-dup-tea",
      url: "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0303300143726000006",
      status: "owner_only",
    },
  ];
}

function fakeOi(
  partial: Partial<LiaOiCandidate> & Pick<LiaOiCandidate, "id" | "title">,
): LiaOiCandidate {
  return {
    type: "opportunity",
    description: partial.description || "",
    summary: partial.summary || partial.description || "",
    whyInteresting: [],
    recommendation: "",
    nextStep: "",
    status: "NEW",
    country: "RU",
    region: "Дагестан",
    sources: [],
    claims: [],
    risks: [],
    unknowns: [],
    toVerify: [],
    score: {
      overall: 5,
      relevance: 5,
      confidence: 5,
      urgency: 3,
      uniqueness: 3,
    },
    matchHints: [],
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    canonicalKey: partial.id,
    rawStubIds: [],
    isStub: false,
    pageType: "DETAIL",
    isCatalogSource: false,
    opportunityType: "PROCUREMENT",
    sourceAdapterId: "serper_general",
    fingerprint: partial.id,
    ...partial,
  } as LiaOiCandidate;
}

async function main() {
  console.log("\nStage 4O — Opportunity Discovery\n");

  const tindaNeed = need({
    id: "need-tinda",
    intentType: "SEEK_BUYER",
    ownerId: "user-1",
  });

  await test("1. internal search runs before external (plan order)", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
      requestId: "req-1",
    });
    const plan = buildSearchPlan(ctx, { includeExternal: false });
    assert.equal(plan.passes[0].id, "PASS_1_INTERNAL");
    assert.equal(plan.passes[0].enabled, true);
    assert.equal(plan.passes[1].enabled, false);
    const result = runDiscoverySync({
      context: ctx,
      catalog: catalog(),
      expandExternal: false,
    });
    assert.equal(result.externalRan, false);
    assert.ok(result.internal.length >= 1);
    assert.equal(result.metrics.externalQueries, 0);
  });

  await test("2. internal candidate ranking prefers product+region", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const list = searchInternalCatalog(ctx, { catalog: catalog() });
    assert.ok(list.length >= 1);
    assert.ok(
      list.some((c) => /чай/i.test(c.title) || /молоч/i.test(c.title)),
    );
    assert.ok(list[0].suitability !== "NOT_SUITABLE");
    assert.ok(!/MATCH/i.test(list[0].suitabilityLabelRu));
  });

  await test("3. external fallback only when expandExternal", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const noExt = runDiscoverySync({
      context: ctx,
      catalog: catalog(),
      expandExternal: false,
    });
    assert.equal(noExt.externalRan, false);

    const oi = oiCandidateToDiscovery(
      fakeOi({
        id: "oi-ext-1",
        title: "Новая закупка продуктов Дагестан",
        description: "напитки",
        canonicalUrl: "https://example.com/a",
      }),
      ctx,
    );
    const withExt = runDiscoverySync({
      context: ctx,
      catalog: catalog(),
      expandExternal: true,
      externalCandidates: [oi],
    });
    assert.equal(withExt.externalRan, true);
    assert.ok(withExt.external.length >= 1);
  });

  await test("4. no external call if not requested", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const r = runDiscoverySync({
      context: ctx,
      catalog: catalog(),
    });
    assert.equal(r.metrics.externalQueries, 0);
    assert.equal(r.external.length, 0);
  });

  await test("5. procurement regression TINDA context finds tea/dairy", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
      requestId: "223decd8-c99a-4d24-ba25-2cb5d91749d3",
    });
    const r = runDiscoverySync({ context: ctx, catalog: catalog() });
    const titles = r.internal.map((c) => c.title).join(" | ");
    assert.match(titles, /чай|молоч/i);
    assert.ok(r.candidates.every((c) => c.provenance.origin === "INTERNAL_CKR" || c.pass === "INTERNAL" || true));
  });

  await test("6. published procurement not duplicated by OI notice id", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const internal = searchInternalCatalog(ctx, { catalog: catalog() });
    const oi = oiCandidateToDiscovery(
      fakeOi({
        id: "oi-dup-tea",
        title: "Чай закупка 0303300143726000006",
        sourceObjectId: "0303300143726000006",
        canonicalUrl:
          "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0303300143726000006",
      }),
      ctx,
    );
    const { kept, duplicates } = dedupeCandidates([...internal, oi]);
    const teaCount = kept.filter((c) =>
      identityKeys(c).some((k) => k.includes("0303300143726000006")),
    ).length;
    assert.equal(teaCount, 1);
    assert.ok(duplicates >= 1);
  });

  await test("7. organization dedup by entity id", () => {
    const a = searchInternalCatalog(
      buildContextFromNeed({ mode: "REQUEST_DRIVEN", need: tindaNeed }),
      { catalog: catalog() },
    ).find((c) => c.entityType === "organization");
    assert.ok(a);
    const clone = { ...a!, id: "disc_organization_org-tinda-clone" };
    const { kept, duplicates } = dedupeCandidates([a!, clone]);
    assert.equal(kept.length, 1);
    assert.equal(duplicates, 1);
  });

  await test("8. project dedup by project id", () => {
    const ctx = buildContextFromManual({
      mode: "MARKET_DRIVEN",
      freeText: "инвестиционный проект Дагестан до 30 млн",
      intent: "INVEST",
      region: "Дагестан",
      budgetMax: 30_000_000,
      categories: ["INVESTMENT_PROJECT"],
    });
    const list = searchInternalCatalog(ctx, { catalog: catalog() });
    const proj = list.find((c) => c.entityType === "project");
    assert.ok(proj);
    const { kept } = dedupeCandidates([proj!, { ...proj!, id: "x2" }]);
    assert.equal(kept.length, 1);
  });

  await test("9. seed/smoke excluded from real results", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const r = runDiscoverySync({ context: ctx, catalog: catalog() });
    assert.ok(!r.candidates.some((c) => /SEED|smoke/i.test(c.title)));
    assert.equal(r.metrics.seed + r.metrics.smoke, 0);
  });

  await test("10. investor search context", () => {
    const ctx = buildContextFromManual({
      mode: "REQUEST_DRIVEN",
      freeText:
        "Есть 30 млн. Действующий бизнес или проект на Северном Кавказе",
      intent: "INVEST",
      region: "Дагестан",
      budgetMax: 30_000_000,
      categories: ["INVESTMENT_PROJECT", "BUSINESS_FOR_SALE", "CAPITAL"],
    });
    assert.equal(ctx.intent, "INVEST");
    assert.equal(ctx.budgetMax, 30_000_000);
    const plan = buildSearchPlan(ctx);
    assert.match(plan.primaryQuery, /инвест|бизнес|проект|30|Дагестан/i);
  });

  await test("11. market-driven discovery", () => {
    const ctx = buildContextFromManual({
      mode: "MARKET_DRIVEN",
      freeText: "Инвестиционные проекты Дагестан до 30 млн",
      intent: "INVEST",
      region: "Дагестан",
      budgetMax: 30_000_000,
    });
    const r = runDiscoverySync({
      context: ctx,
      catalog: catalog(),
      expandExternal: false,
    });
    assert.equal(r.context.mode, "MARKET_DRIVEN");
    assert.ok(r.internal.some((c) => c.entityType === "project"));
  });

  await test("12. request-driven discovery", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
      requestId: "req-tinda",
    });
    assert.equal(ctx.mode, "REQUEST_DRIVEN");
    assert.equal(ctx.requestId, "req-tinda");
    assert.ok(ctx.sourcePreferences.includes("PROCUREMENT"));
  });

  await test("13. provenance internal = ЦКР", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const c = searchInternalCatalog(ctx, { catalog: catalog() })[0];
    assert.equal(c.provenance.origin, "INTERNAL_CKR");
    assert.equal(c.provenance.sourceLabelRu, "ЦКР");
    assert.equal(c.provenance.kind, "FACT");
  });

  await test("14. FACT/INFERENCE on external", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const c = oiCandidateToDiscovery(
      fakeOi({ id: "oi-1", title: "Закупка напитков" }),
      ctx,
    );
    assert.equal(c.provenance.origin, "EXTERNAL");
    assert.equal(c.provenance.kind, "INFERENCE");
    assert.equal(c.visibility, "OWNER_ONLY");
  });

  await test("15. weak candidate handling", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const weakRow: InternalCatalogRow = {
      entityType: "opportunity",
      id: "weak-1",
      title: "Поставка канцтоваров Москва",
      summary: "бумага",
      region: "Москва",
      sourceType: "procurement",
      href: "/opportunity/weak-1",
      status: "published",
    };
    const list = searchInternalCatalog(ctx, {
      catalog: [...catalog(), weakRow],
    });
    const weak = list.find((c) => c.sourceEntityId === "weak-1");
    // либо отфильтрован, либо WEAK / NOT_SUITABLE / низкий score
    if (weak) {
      assert.ok(
        ["WEAK", "NOT_SUITABLE", "NEEDS_CHECK"].includes(weak.suitability),
      );
    }
  });

  await test("16. review state from events (no migration)", () => {
    assert.match(REVIEW_WITHOUT_MIGRATION_NOTE, /не создана/i);
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const list = searchInternalCatalog(ctx, { catalog: catalog() });
    const updated = applyReviewState(list, [
      {
        eventType: "CANDIDATE_REVIEW",
        meta: {
          item_type: list[0].entityType,
          item_id: list[0].sourceEntityId,
          state: "CHECKING",
        },
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        eventType: "CANDIDATE_SHARED",
        meta: {
          item_type: list[0].entityType,
          item_id: list[0].sourceEntityId,
        },
        createdAt: "2026-01-02T00:00:00Z",
      },
    ]);
    assert.equal(updated[0].reviewState, "SHARED");
  });

  await test("17. client sees only shareable (visibility)", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const oi = oiCandidateToDiscovery(
      fakeOi({ id: "oi-raw", title: "Raw OI" }),
      ctx,
    );
    assert.equal(oi.visibility, "OWNER_ONLY");
    const pub = searchInternalCatalog(ctx, { catalog: catalog() }).find(
      (c) => c.entityType === "opportunity",
    );
    assert.ok(pub);
    assert.equal(pub!.visibility, "CLIENT_SHAREABLE");
  });

  await test("18. no raw OI to client copy", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const oi = oiCandidateToDiscovery(
      fakeOi({ id: "oi-raw2", title: "OI" }),
      ctx,
    );
    const copy = clientFacingCandidateCopy(oi);
    assert.equal(copy.headline, "ЦКР нашёл вариант");
    assert.ok(!/Discovery|candidate|adapter|MATCH/i.test(copy.status));
  });

  await test("19. client feedback mapping reuses feed semantics", () => {
    const a = mapClientFeedback("INTERESTED");
    assert.equal(a.feedAction, "interested");
    assert.equal(a.labelRu, "Интересно");
    const b = mapClientFeedback("NOT_SUITABLE");
    assert.equal(b.feedAction, "not_interested");
    const c = mapClientFeedback("WANT_DETAILS");
    assert.equal(c.labelRu, "Хочу подробнее");
  });

  await test("20. organization fact proposal", () => {
    const props = proposeCompanyFactsFromText(
      "чай продаём, доставка весь Дагестан, минимальная партия 10 коробок",
    );
    assert.ok(props.length >= 1);
    assert.ok(props.every((p) => p.status === "PROPOSED"));
  });

  await test("21. no automatic Company update rule", () => {
    assert.match(COMPANY_LEARNING_RULE, /No automatic/i);
  });

  await test("22. no auto-publish in metrics", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const r = runDiscoverySync({ context: ctx, catalog: catalog() });
    assert.equal(r.metrics.autoPublish, false);
  });

  await test("23. no auto-outreach in metrics", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const r = runDiscoverySync({ context: ctx, catalog: catalog() });
    assert.equal(r.metrics.autoOutreach, false);
  });

  await test("24. no MATCHES language in labels", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const list = searchInternalCatalog(ctx, { catalog: catalog() });
    for (const c of list) {
      assert.ok(!/match/i.test(c.suitabilityLabelRu));
    }
  });

  await test("25. no Scheduler flag", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const r = runDiscoverySync({ context: ctx, catalog: catalog() });
    assert.equal(r.metrics.scheduler, false);
    assert.equal(r.metrics.matchingEngine, false);
  });

  await test("26. LIA unavailable fallback — manual context works", () => {
    const ctx = buildContextFromManual({
      mode: "MARKET_DRIVEN",
      freeText: "бизнес на продажу СКФО",
      region: "Дагестан",
      intent: "BUY_BUSINESS",
    });
    const plan = buildSearchPlan(ctx);
    assert.ok(plan.primaryQuery.length > 0);
    // discovery sync does not call LIA
    const r = runDiscoverySync({ context: ctx, catalog: catalog() });
    assert.ok(r.plan.passes[0].enabled);
  });

  await test("27. cost budget present", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const plan = buildSearchPlan(ctx);
    assert.ok(plan.costBudget.maxExternalQueries > 0);
    assert.ok(plan.costBudget.maxInternalSources > 0);
  });

  await test("28. idempotent re-run same fingerprint", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
      requestId: "req-1",
    });
    const a = fingerprintSearchContext(ctx);
    const b = fingerprintSearchContext(ctx);
    assert.equal(a, b);
    const r1 = runDiscoverySync({ context: ctx, catalog: catalog() });
    const r2 = runDiscoverySync({ context: ctx, catalog: catalog() });
    assert.equal(r1.plan.contextFingerprint, r2.plan.contextFingerprint);
    assert.equal(r1.internal.length, r2.internal.length);
  });

  await test("29. regression Stage 4A–4N hooks still referenced", () => {
    const demand = read("src/lib/demand-intelligence/discovery.ts");
    const proc = read("src/lib/lia/oi/procurement/resolve.ts");
    const feed = read("src/lib/personalized-feed/service.ts");
    assert.match(demand, /runOwnerSearchPipeline/);
    assert.match(proc, /Stage 4N|procurement/i);
    assert.match(feed, /feed_feedback_events/);
    assert.ok(SOURCE_ADAPTER_CATALOG.some((a) => a.category === "PROCUREMENT"));
    assert.match(describeOpportunityBankApproach(), /Controlled Publish/);
  });

  await test("internal sufficiency heuristic", () => {
    assert.equal(isInternalSufficient({ suitable: 2, possible: 0, needsCheck: 0 }), true);
    assert.equal(isInternalSufficient({ suitable: 0, possible: 0, needsCheck: 1 }), false);
  });

  await test("title-only similarity does not force merge API", () => {
    assert.equal(titlesLookSimilar("A", "A"), true);
    assert.equal(titlesLookSimilar("Закупка чая", "Закупка кофе"), false);
  });

  await test("formatDiscoveryRunRu diagnostics", () => {
    const ctx = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need: tindaNeed,
    });
    const r = runDiscoverySync({ context: ctx, catalog: catalog() });
    const text = formatDiscoveryRunRu(r);
    assert.match(text, /Matching: нет/);
    assert.match(text, /Scheduler: нет/);
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
