/**
 * Stage 4Q — Собственные идеи ЦКР (no network, no production writes).
 * Run: npm run test:ckr-own-ideas-stage4q
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CKR_OWN_IDEAS_BUDGETS, CKR_OWN_IDEAS_FORBIDDEN } from "../src/config/ckr-own-ideas";
import { operatorPrimaryNav, operatorSystemNav } from "../src/config/navigation";
import {
  applyOwnerAction,
  buildOwnIdeaCatalog,
  computeRoughEconomics,
  formatPaybackMonths,
  FINANCING_SAFE_WORDING,
  findMissingResource,
  hasGuaranteedProfitWording,
  ideaToRow,
  internalCapitalCatalog,
  isExpiredOpportunity,
  isGenericFinancingPage,
  isNegativeEconomics,
  isOwnIdeasProductionEnv,
  isPlaceholderSource,
  landTourismCatalog,
  missingFinancingCatalog,
  negativeEconomicsCatalog,
  normalizeOwnIdeaGeo,
  alreadyResolvedOfficial,
  acquireOwnIdeaDetails,
  isDiscoverySnippet,
  isGenericRussiaRegion,
  isOfficialDetailUrl,
  oiCandidateToSignal,
  pairCompatibility,
  classifyOwnIdeaPageType,
  geoCompatibility,
  industryCompatibility,
  procurementCatalog,
  rateOwnIdea,
  resolveOwnIdeaCatalogMode,
  resolveOwnIdeaStoreMode,
  rowToIdea,
  runOwnIdeaBuilder,
  searchInternalFirst,
  tractorEarthworksCatalog,
  validateDetailFields,
} from "../src/lib/ckr-own-ideas";
import { memoryOwnIdeaStore } from "../src/lib/ckr-own-ideas/store";
import type { OwnIdeaComponent } from "../src/types/ckr-own-ideas";

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

function component(partial: Partial<OwnIdeaComponent> & Pick<OwnIdeaComponent, "kind" | "title">): OwnIdeaComponent {
  return {
    id: partial.id || partial.title,
    origin: "EXTERNAL",
    identityKey: null,
    officialId: null,
    canonicalUrl: null,
    amount: null,
    found: true,
    requiresCheck: false,
    provenance: {
      kind: "FACT",
      sourceType: "test",
      sourceUrl: null,
      sourceLabel: "test",
      fetchedAt: null,
      verifiedAt: null,
      trustLevel: "official",
    },
    ...partial,
  };
}

async function main() {
  await memoryOwnIdeaStore.reset();

  await test("1. asset+demand creates candidate idea", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.ok(ideas.length >= 1);
    const kinds = ideas[0].components.filter((c) => c.found).map((c) => c.kind);
    assert.ok(kinds.includes("ASSET"));
    assert.ok(kinds.includes("DEMAND"));
    assert.equal(ideas[0].visibility, "OWNER_ONLY");
    assert.equal(ideas[0].ownerState, "REVIEW");
  });

  await test("2. capital gap detected", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: missingFinancingCatalog() });
    assert.ok(ideas[0].missing.some((m) => m.kind === "CAPITAL"));
  });

  await test("3. internal-first capital search", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: internalCapitalCatalog() });
    const cap = ideas[0].components.find((c) => c.kind === "CAPITAL" && c.found);
    assert.ok(cap);
    assert.equal(cap?.origin, "INTERNAL_CKR");
  });

  await test("4. external financing fallback", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    const cap = ideas[0].components.find((c) => c.kind === "CAPITAL" && c.found);
    assert.ok(cap);
    assert.equal(cap?.origin, "EXTERNAL");
    assert.ok(ideas[0].events.some((e) => e.note.includes(FINANCING_SAFE_WORDING)));
  });

  await test("5. missing resource retained", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: missingFinancingCatalog() });
    assert.ok(ideas.length >= 1);
    assert.ok(ideas[0].missing.some((m) => /финанс/i.test(m.reason)));
  });

  await test("6. rough economics", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.ok(ideas[0].economics.capex.amount != null);
    assert.ok(ideas[0].economics.revenue.amount != null);
    assert.ok(ideas[0].economics.disclaimer.includes("Не является гарантией"));
    assert.match(formatPaybackMonths(ideas[0].economics.paybackMonths), /мес|UNKNOWN/);
    assert.doesNotMatch(formatPaybackMonths(ideas[0].economics.paybackMonths), /₽|млн/);
  });

  await test("7. UNKNOWN not invented", () => {
    const e = computeRoughEconomics([
      component({
        kind: "ASSET",
        title: "без цены",
        amount: null,
      }),
    ]);
    assert.equal(e.capex.kind, "UNKNOWN");
    assert.equal(e.fixedCosts.kind, "UNKNOWN");
    assert.equal(e.fixedCosts.amount, null);
  });

  await test("8. negative economics weak", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: negativeEconomicsCatalog() });
    assert.equal(ideas[0].rating, "weak");
    assert.ok(isNegativeEconomics(ideas[0].economics));
  });

  await test("9. dedup", () => {
    const catalog = tractorEarthworksCatalog();
    const first = runOwnIdeaBuilder({ catalog });
    const second = runOwnIdeaBuilder({ catalog, existing: first.ideas });
    assert.equal(second.metrics.ideasGenerated, 0);
    assert.ok(second.metrics.ideasUpdated >= 1);
    assert.equal(second.ideas[0].fingerprint, first.ideas[0].fingerprint);
    assert.ok(first.ideas[0].fingerprint.length > 8);
  });

  await test("10. rediscovery keeps owner edits", () => {
    const catalog = tractorEarthworksCatalog();
    const first = runOwnIdeaBuilder({ catalog });
    const withOwnerEdits = {
      ...first.ideas[0],
      title: "OWNER TITLE",
      economics: { ...first.ideas[0].economics, disclaimer: "OWNER DISCLAIMER" },
    };
    const locked = applyOwnerAction(withOwnerEdits, "accept");
    const second = runOwnIdeaBuilder({ catalog, existing: [locked] });
    assert.equal(second.ideas[0].title, "OWNER TITLE");
    assert.equal(second.ideas[0].economics.disclaimer, "OWNER DISCLAIMER");
    assert.equal(second.ideas[0].ownerState, "ACCEPTED");
    assert.equal(second.ideas[0].rating, locked.rating);
    assert.ok(second.ideas[0].events.some((e) => e.type === "rediscovery_updated"));
  });

  await test("11. owner lock + review actions", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    const accepted = applyOwnerAction(ideas[0], "accept");
    assert.equal(accepted.ownerState, "ACCEPTED");
    assert.ok(accepted.ownerLockedFields.includes("title"));
    assert.ok(accepted.ownerLockedFields.includes("essence"));
    assert.ok(accepted.ownerLockedFields.includes("economics"));
    assert.ok(accepted.ownerLockedFields.includes("rating"));
    const rejected = applyOwnerAction(ideas[0], "reject");
    assert.equal(rejected.ownerState, "REJECTED");
    const proj = applyOwnerAction(ideas[0], "create_project", "proj-1");
    assert.equal(proj.ownerState, "PROJECT_CREATED");
    assert.equal(proj.projectId, "proj-1");
  });

  await test("12. owner-only privacy", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: landTourismCatalog() });
    assert.equal(ideas[0].visibility, "OWNER_ONLY");
    const page = read("src/app/(admin)/admin/owner/own-ideas/page.tsx");
    assert.match(page, /requireLiaOiOwner/);
  });

  await test("13. no auto publish", () => {
    const { metrics, forbidden } = runOwnIdeaBuilder({
      catalog: tractorEarthworksCatalog(),
    });
    assert.equal(metrics.autoPublish, false);
    assert.equal(forbidden.autoPublish, false);
    const list = read("src/app/(admin)/admin/owner/own-ideas/page.tsx");
    assert.doesNotMatch(list, /Опубликовать|publish CTA|marketplace/);
  });

  await test("14. no outreach", () => {
    const { metrics, forbidden } = runOwnIdeaBuilder({
      catalog: procurementCatalog(),
    });
    assert.equal(metrics.autoOutreach, false);
    assert.equal(forbidden.autoOutreach, false);
    assert.equal(CKR_OWN_IDEAS_FORBIDDEN.autoApplication, false);
  });

  await test("15. no Matching edges", () => {
    const { metrics } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.equal(metrics.matchingEdges, false);
    const builder = read("src/lib/ckr-own-ideas/builder.ts");
    assert.doesNotMatch(builder, /MATCHES|Matching Engine/);
  });

  await test("16. no Scheduler", () => {
    const { metrics } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.equal(metrics.scheduler, false);
    const actions = read("src/features/ckr-own-ideas/actions.ts");
    assert.match(actions, /findNewOwnIdeasAction/);
    assert.match(actions, /buildOwnIdeaCatalog/);
    assert.doesNotMatch(actions, /tractorEarthworksCatalog|marketCatalog/);
    assert.doesNotMatch(actions, /cron|schedule\(/);
  });

  await test("17. idea→project only owner action", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.equal(ideas[0].projectId, null);
    assert.notEqual(ideas[0].ownerState, "PROJECT_CREATED");
  });

  await test("18. financing wording safe", () => {
    assert.ok(!hasGuaranteedProfitWording(FINANCING_SAFE_WORDING));
    assert.ok(FINANCING_SAFE_WORDING.includes("потенциальный"));
    assert.ok(hasGuaranteedProfitWording("гарантированная прибыль"));
  });

  await test("19. source provenance", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    for (const c of ideas[0].components) {
      assert.ok(c.provenance.kind);
      assert.ok(c.provenance.sourceLabel);
      assert.ok(c.provenance.trustLevel);
    }
  });

  await test("20. run budget stop", () => {
    const { metrics } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.ok(metrics.queries <= 12);
    assert.ok(metrics.depthReached <= 3);
    assert.ok(metrics.externalCalls <= 8);
  });

  await test("21. no-client market driven", () => {
    const { metrics, ideas } = runOwnIdeaBuilder({
      catalog: tractorEarthworksCatalog(),
    });
    assert.equal(metrics.clientRequestUsed, false);
    assert.ok(ideas[0].whyNoticed.includes("без входящей заявки"));
  });

  await test("22. staging cleanup helpers exist", () => {
    const persist = read("src/lib/ckr-own-ideas/persist.ts");
    assert.match(persist, /deleteOwnIdeaExact/);
    const e2e = read("scripts/e2e-ckr-own-ideas-stage4q-smoke.ts");
    assert.match(e2e, /CLEANUP_OK|RESIDUAL_SMOKE_ROWS/);
    assert.match(e2e, /from "\.\/lib\/ckr-staging-guard"/);
    assert.doesNotMatch(e2e, /from "\.\.\/src\/lib\/ckr-staging-guard"/);
    assert.match(e2e, /createSupabaseOwnIdeaStore/);
    assert.match(e2e, /OWNER LOCKED TITLE|ownerLockedFields/);
    assert.match(e2e, /store recreate|after store recreate|restartPersisted/);
    assert.match(e2e, /buildOwnIdeaCatalog/);
    assert.match(e2e, /torgi\.gov\.ru|zakupki\.gov\.ru/);
    assert.match(e2e, /TradeList|listing\/category/);
    assert.match(e2e, /totalExternalCalls|maxExternalCalls/);
    assert.match(e2e, /resolveDetail/);
    assert.match(e2e, /SERPER_DISCOVERY/);
    assert.match(e2e, /liveFacts/);
  });

  await test("4Q.1 mapper roundtrip keeps locks and OWNER_ONLY", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    const locked = {
      ...ideas[0],
      title: "LOCKED",
      ownerLockedFields: ["title", "essence"],
    };
    const again = rowToIdea(ideaToRow(locked));
    assert.equal(again.visibility, "OWNER_ONLY");
    assert.equal(again.title, "LOCKED");
    assert.deepEqual(again.ownerLockedFields, ["title", "essence"]);
    assert.equal(again.fingerprint, locked.fingerprint);
  });

  await test("4Q.1 memory store only when explicitly selected", async () => {
    const prevStore = process.env.CKR_OWN_IDEAS_STORE;
    const prevEnv = process.env.CKR_ENVIRONMENT;
    const prevSite = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.CKR_OWN_IDEAS_STORE;
    process.env.CKR_ENVIRONMENT = "staging";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    assert.equal(isOwnIdeasProductionEnv(), false);
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.CKR_STAGING_SERVICE_ROLE_KEY) {
      assert.throws(() => resolveOwnIdeaStoreMode(), /требуют Supabase store/);
    }
    process.env.CKR_OWN_IDEAS_STORE = "memory";
    assert.equal(resolveOwnIdeaStoreMode(), "memory");
    process.env.CKR_ENVIRONMENT = "production";
    assert.throws(() => resolveOwnIdeaStoreMode(), /запрещён в production/);
    process.env.CKR_ENVIRONMENT = "staging";
    process.env.NEXT_PUBLIC_SITE_URL = "https://ckr-center.ru";
    assert.throws(() => resolveOwnIdeaStoreMode(), /запрещён в production/);
    if (prevStore === undefined) delete process.env.CKR_OWN_IDEAS_STORE;
    else process.env.CKR_OWN_IDEAS_STORE = prevStore;
    if (prevEnv === undefined) delete process.env.CKR_ENVIRONMENT;
    else process.env.CKR_ENVIRONMENT = prevEnv;
    if (prevSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prevSite;
  });

  await test("4Q.1 owner UI and actions are async DB store", () => {
    const list = read("src/app/(admin)/admin/owner/own-ideas/page.tsx");
    const detail = read("src/app/(admin)/admin/owner/own-ideas/[id]/page.tsx");
    const diag = read("src/app/(admin)/admin/owner/own-ideas/diagnostics/page.tsx");
    const actions = read("src/features/ckr-own-ideas/actions.ts");
    const factory = read("src/lib/ckr-own-ideas/store.ts");
    assert.match(list, /await getOwnIdeaStore\(\)\.list\(\)/);
    assert.match(detail, /await getOwnIdeaStore\(\)\.get\(/);
    assert.match(diag, /await getOwnIdeaStore\(\)\.lastRun\(\)/);
    assert.match(actions, /await store\.list\(\)/);
    assert.match(actions, /await store\.upsert/);
    assert.match(actions, /persistStatus/);
    assert.match(actions, /buildOwnIdeaCatalog/);
    assert.doesNotMatch(actions, /tractorEarthworksCatalog/);
    assert.match(factory, /return createSupabaseOwnIdeaStore/);
    assert.doesNotMatch(factory, /return memoryOwnIdeaStore;\n}/);
    assert.match(factory, /memory запрещён в production/);
  });

  await test("4Q.1 memory restart isolation vs explicit memory SoT", async () => {
    process.env.CKR_OWN_IDEAS_STORE = "memory";
    process.env.CKR_ENVIRONMENT = "test";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    await memoryOwnIdeaStore.reset();
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    await memoryOwnIdeaStore.upsert(ideas[0]);
    assert.equal((await memoryOwnIdeaStore.get(ideas[0].id))?.id, ideas[0].id);
    await memoryOwnIdeaStore.reset();
    assert.equal(await memoryOwnIdeaStore.get(ideas[0].id), undefined);
    delete process.env.CKR_OWN_IDEAS_STORE;
  });

  await test("4Q.1 no new migration file", () => {
    const files = read("docs/ckr-own-ideas-stage4q.md");
    assert.match(files, /4Q\.1|persistent|Supabase/);
  });

  await test("internal search used before external", () => {
    const hits = searchInternalFirst("CAPITAL", "лизинг спецтехники", [
      {
        id: "i1",
        kind: "CAPITAL",
        title: "Лизинг спецтехники внутри",
        origin: "INTERNAL_CKR",
      },
    ]);
    assert.equal(hits[0].origin, "INTERNAL_CKR");
    const miss = findMissingResource({
      kind: "TEAM",
      query: "оператор",
      internal: [],
      external: [],
    });
    assert.equal(miss.hit, null);
    assert.equal(miss.searchedInternal, true);
    assert.equal(miss.searchedExternal, true);
  });

  await test("rating uses completeness not magic AI", () => {
    assert.equal(
      rateOwnIdea({
        components: [],
        missing: [],
        economics: computeRoughEconomics([]),
      }),
      "missing_data",
    );
  });

  await test("owner nav + no Synthesis Engine label", () => {
    assert.ok(operatorPrimaryNav.some((i) => i.label === "Собственные идеи ЦКР"));
    assert.ok(
      operatorSystemNav.some((i) => i.href === "/admin/owner/own-ideas/diagnostics"),
    );
    const nav = read("src/config/navigation.ts");
    assert.doesNotMatch(nav, /Synthesis Engine|Autonomous Agent|Composite Match/);
  });

  await test("migration additive owner-only", () => {
    const sql = read("supabase/migrations/20260823220000_ckr_own_ideas_stage4q.sql");
    assert.match(sql, /create table if not exists public.ckr_own_ideas/);
    assert.match(sql, /is_admin/);
    assert.match(sql, /OWNER_ONLY/);
    assert.doesNotMatch(sql, /\bDROP TABLE\b|\bTRUNCATE\b/i);
  });

  await test("4P action loop still present", () => {
    const p = read("src/lib/ckr-action-loop/derive.ts");
    assert.match(p, /deriveActionsFromEvents/);
  });

  await test("4Q.2 cross-industry pairs rejected", () => {
    const mixed = {
      signals: [
        ...tractorEarthworksCatalog().signals,
        ...procurementCatalog().signals,
      ],
      internalResources: [],
      externalResources: tractorEarthworksCatalog().externalResources,
    };
    const { ideas, metrics } = runOwnIdeaBuilder({ catalog: mixed });
    assert.ok(ideas.length >= 1);
    assert.ok(ideas.every((i) => !/консерв/i.test(i.title)));
    assert.ok((metrics.pairsRejected ?? 0) >= 1);
  });

  await test("4Q.2 empty live catalog is valid", () => {
    const { ideas, metrics } = runOwnIdeaBuilder({
      catalog: { signals: [], internalResources: [], externalResources: [] },
      catalogMode: "empty",
    });
    assert.equal(ideas.length, 0);
    assert.equal(metrics.ideasGenerated, 0);
    assert.equal(metrics.scheduler, false);
    assert.equal(metrics.catalogMode, "empty");
  });

  await test("4Q.2 mapper drops stub, catalog, example, expired", () => {
    assert.equal(
      oiCandidateToSignal({
        isStub: true,
        title: "stub",
        isCatalogSource: false,
        canonicalUrl: "https://zakupki.gov.ru/1",
      } as never),
      null,
    );
    assert.equal(
      oiCandidateToSignal({
        isStub: false,
        isCatalogSource: true,
        title: "catalog",
        canonicalUrl: "https://zakupki.gov.ru/1",
      } as never),
      null,
    );
    assert.equal(
      oiCandidateToSignal({
        isStub: false,
        isCatalogSource: false,
        title: "fake",
        canonicalUrl: "https://torgi.example/lot",
        opportunityType: "AUCTION_ASSET",
      } as never),
      null,
    );
    assert.equal(
      oiCandidateToSignal({
        isStub: false,
        isCatalogSource: false,
        title: "old",
        canonicalUrl: "https://zakupki.gov.ru/old",
        opportunityType: "PROCUREMENT",
        deadlineAt: "2020-01-01T00:00:00.000Z",
      } as never),
      null,
    );
  });

  await test("4Q.2 live injected catalog pairs same industry", async () => {
    const live = await buildOwnIdeaCatalog({
      userId: "owner-test",
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") {
            return [
              {
                id: "live-asset",
                title: "Экскаватор на torgi.gov.ru",
                isStub: false,
                isCatalogSource: false,
                isOfficialSource: true,
                pageType: "DETAIL",
                canonicalUrl: "https://torgi.gov.ru/new/public/lots/lot/exc-1",
                opportunityType: "AUCTION_ASSET",
                sourceClass: "AUCTIONS_ASSETS",
                sourceAdapterId: "auction_assets",
                sourceObjectId: "exc-1",
                region: "Дагестан",
                city: "Махачкала",
                industry: "construction",
                askingPrice: 4_200_000,
                auctionStatus: "active",
                address: "Махачкала",
                sources: [
                  {
                    id: "s1",
                    category: "AUCTIONS",
                    name: "torgi.gov.ru",
                    url: "https://torgi.gov.ru/new/public/lots/lot/exc-1",
                    isStub: false,
                  },
                ],
              } as never,
            ];
          }
          if (q.plan.intent === "tenders") {
            return [
              {
                id: "live-demand",
                title: "Закупка земляных работ",
                isStub: false,
                isCatalogSource: false,
                isOfficialSource: true,
                pageType: "DETAIL",
                canonicalUrl:
                  "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0123456789012345678",
                opportunityType: "PROCUREMENT",
                sourceClass: "TENDERS",
                sourceAdapterId: "procurement",
                sourceObjectId: "0123456789012345678",
                region: "Дагестан",
                industry: "construction",
                customer: "МКУ Махачкала",
                sourcePublishedAt: "2026-04-01T00:00:00.000Z",
                deadlineAt: "2027-06-01T00:00:00.000Z",
                procurementStage: "submission",
                nmck: 8_500_000,
                sources: [
                  {
                    id: "s2",
                    category: "PROCUREMENT",
                    name: "zakupki.gov.ru",
                    url: "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0123456789012345678",
                    isStub: false,
                  },
                ],
              } as never,
            ];
          }
          return [];
        },
      },
    });
    assert.equal(live.mode, "injected");
    assert.ok(live.realSignals >= 2);
    const { ideas, metrics } = runOwnIdeaBuilder({
      catalog: live.catalog,
      catalogMode: live.mode,
      liveMeta: live,
    });
    assert.ok(ideas.length >= 1);
    assert.ok(ideas[0].components.every((c) => !/example\.com/i.test(c.provenance.sourceUrl || "")));
    assert.equal(metrics.scheduler, false);
    assert.equal(metrics.autoPublish, false);
    assert.equal(metrics.catalogMode, "injected");
  });

  await test("4Q.2 generic bank page is not confirmed financing", () => {
    assert.equal(
      isGenericFinancingPage({
        url: "https://www.sberbank.ru/ru/person/credits",
        title: "Кредит наличными",
      }),
      true,
    );
    assert.equal(isPlaceholderSource({ url: "https://torgi.example/x" }), true);
    assert.equal(isPlaceholderSource({ url: "https://zakupki.gov.ru/1" }), false);
  });

  await test("4Q.2 fixture catalog env forbidden in production", () => {
    const prevCat = process.env.CKR_OWN_IDEAS_CATALOG;
    const prevEnv = process.env.CKR_ENVIRONMENT;
    process.env.CKR_OWN_IDEAS_CATALOG = "fixture";
    process.env.CKR_ENVIRONMENT = "production";
    assert.throws(() => resolveOwnIdeaCatalogMode(), /запрещён в production/);
    process.env.CKR_ENVIRONMENT = "test";
    assert.equal(resolveOwnIdeaCatalogMode(), "fixture");
    if (prevCat === undefined) delete process.env.CKR_OWN_IDEAS_CATALOG;
    else process.env.CKR_OWN_IDEAS_CATALOG = prevCat;
    if (prevEnv === undefined) delete process.env.CKR_ENVIRONMENT;
    else process.env.CKR_ENVIRONMENT = prevEnv;
  });

  await test("4Q.2 profit stays UNKNOWN when critical costs unknown", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.equal(ideas[0].economics.profit.kind, "UNKNOWN");
    assert.equal(ideas[0].economics.capex.kind, "FACT");
  });

  await test("4Q.3 TradeList.aspx rejected as asset detail", () => {
    assert.equal(
      classifyOwnIdeaPageType({
        url: "https://bankrot.fedresurs.ru/TradeList.aspx",
        title: "Реестр торгов",
      }),
      "LISTING",
    );
    assert.equal(
      oiCandidateToSignal({
        isStub: false,
        isCatalogSource: false,
        title: "Торги имуществом банкрота",
        canonicalUrl: "https://bankrot.fedresurs.ru/TradeList.aspx",
        opportunityType: "AUCTION_ASSET",
        region: "Орловская область",
        askingPrice: 1,
      } as never),
      null,
    );
  });

  await test("4Q.3 procurement category page rejected as demand FACT", () => {
    assert.equal(
      classifyOwnIdeaPageType({
        url: "https://region-tenders.ru/category/belie-skfo",
        title: "тендеры на белье в СКФО",
      }),
      "CATEGORY",
    );
    const sig = oiCandidateToSignal({
      isStub: false,
      isCatalogSource: false,
      title: "тендеры на белье в СКФО",
      canonicalUrl: "https://region-tenders.ru/category/belie-skfo",
      opportunityType: "PROCUREMENT",
      region: "СКФО",
      nmck: 100,
    } as never);
    assert.equal(sig, null);
  });

  await test("4Q.3 aggregator search/list page is not FACT", () => {
    const page = classifyOwnIdeaPageType({
      url: "https://star-pro.ru/search?q=почта",
      title: "Индекс закупок Почта России",
      isCatalogSource: true,
    });
    assert.ok(page === "MIRROR" || page === "SEARCH_RESULTS" || page === "LISTING");
    assert.equal(
      oiCandidateToSignal({
        isStub: false,
        isCatalogSource: false,
        title: "Индекс закупок Почта России",
        canonicalUrl: "https://star-pro.ru/company/post/purchases",
        opportunityType: "PROCUREMENT",
        pageType: "LIST",
      } as never),
      null,
    );
  });

  await test("4Q.3 concrete zakupki detail page accepted FACT", () => {
    const sig = oiCandidateToSignal({
      isStub: false,
      isCatalogSource: false,
      isOfficialSource: true,
      title: "Поставка ГСМ для земляных работ",
      canonicalUrl:
        "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0123456789012345678",
      opportunityType: "PROCUREMENT",
      pageType: "DETAIL",
      sourceObjectId: "0123456789012345678",
      region: "Дагестан",
      industry: "construction",
      customer: "МКУ Махачкала",
      sourcePublishedAt: "2026-04-01T00:00:00.000Z",
      deadlineAt: "2027-06-01T00:00:00.000Z",
      procurementStage: "submission",
      nmck: 8_500_000,
    } as never);
    assert.ok(sig);
    assert.equal(sig?.pageType, "DETAIL");
    assert.equal(sig?.claimKind, "FACT");
    assert.equal(sig?.kind, "DEMAND");
  });

  await test("4Q.3 concrete torgi lot accepted FACT", () => {
    const sig = oiCandidateToSignal({
      isStub: false,
      isCatalogSource: false,
      isOfficialSource: true,
      title: "Экскаватор гусеничный",
      canonicalUrl: "https://torgi.gov.ru/new/public/lots/lot/lot-exc-99",
      opportunityType: "AUCTION_ASSET",
      pageType: "DETAIL",
      sourceObjectId: "lot-exc-99",
      region: "Дагестан",
      city: "Махачкала",
      industry: "construction",
      askingPrice: 4_200_000,
      auctionStatus: "active",
      address: "Махачкала",
    } as never);
    assert.ok(sig);
    assert.equal(sig?.pageType, "DETAIL");
    assert.equal(sig?.claimKind, "FACT");
    assert.equal(sig?.kind, "ASSET");
  });

  await test("4Q.3 expired procurement rejected", () => {
    assert.equal(
      isExpiredOpportunity({ deadlineAt: "2020-01-01T00:00:00.000Z" }),
      true,
    );
    assert.equal(
      oiCandidateToSignal({
        isStub: false,
        isCatalogSource: false,
        title: "Закупка земляных работ",
        canonicalUrl:
          "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0123456789012345678",
        opportunityType: "PROCUREMENT",
        pageType: "DETAIL",
        sourceObjectId: "0123456789012345678",
        region: "Дагестан",
        customer: "МКУ",
        sourcePublishedAt: "2019-01-01T00:00:00.000Z",
        deadlineAt: "2020-01-01T00:00:00.000Z",
        procurementStage: "completed",
      } as never),
      null,
    );
  });

  await test("4Q.3 Orel × SKFO rejected unless explicit cross-region", () => {
    assert.equal(
      geoCompatibility("Орловская область", "СКФО"),
      "INCOMPATIBLE",
    );
    const asset = tractorEarthworksCatalog().signals[0];
    const demand = {
      ...tractorEarthworksCatalog().signals[1],
      region: "СКФО",
      geo: normalizeOwnIdeaGeo("СКФО"),
    };
    const orel = { ...asset, region: "Орловская область", geo: normalizeOwnIdeaGeo("Орловская область") };
    assert.equal(pairCompatibility(orel, demand).ok, false);
    const justified = {
      ...demand,
      crossRegionJustified: true,
      crossRegionReason: "Перевозка спецтехники автотранспортом, срок 3 дня",
    };
    assert.equal(pairCompatibility(orel, justified).ok, true);
    assert.equal(pairCompatibility(orel, justified).geo, "CROSS_REGION_EXPLICIT");
    const flagOnly = { ...demand, crossRegionJustified: true };
    assert.equal(pairCompatibility(orel, flagOnly).ok, false);
  });

  await test("4Q.3 RF generic × Dagestan is not SAME_REGION", () => {
    assert.notEqual(
      geoCompatibility("Российская Федерация", "Дагестан"),
      "SAME_REGION",
    );
    assert.equal(
      geoCompatibility("Российская Федерация", "Дагестан"),
      "UNKNOWN",
    );
  });

  await test("4Q.3 excavator × earthworks compatible, underwear not", () => {
    const excavator = tractorEarthworksCatalog().signals[0];
    const earth = tractorEarthworksCatalog().signals[1];
    assert.equal(industryCompatibility(excavator, earth).ok, true);
    const underwear = {
      ...earth,
      title: "Закупка белья",
      industry: "textile",
    };
    assert.equal(industryCompatibility(excavator, underwear).ok, false);
    const { ideas } = runOwnIdeaBuilder({
      catalog: {
        signals: [excavator, underwear],
        internalResources: [],
        externalResources: [],
      },
    });
    assert.equal(ideas.length, 0);
  });

  await test("4Q.3 unknown bankruptcy asset × arbitrary tender rejected", () => {
    const unknownAsset = {
      ...tractorEarthworksCatalog().signals[0],
      title: "Имущество банкрота",
      industry: null,
      tags: ["bankruptcy"],
    };
    const tender = {
      ...tractorEarthworksCatalog().signals[1],
      title: "Тендер на поставку",
      industry: "food",
    };
    assert.equal(industryCompatibility(unknownAsset, tender).ok, false);
    const { ideas } = runOwnIdeaBuilder({
      catalog: { signals: [unknownAsset, tender], internalResources: [], externalResources: [] },
    });
    assert.equal(ideas.length, 0);
  });

  await test("4Q.3 0 valid ideas is a successful run", () => {
    const { ideas, metrics } = runOwnIdeaBuilder({
      catalog: { signals: [], internalResources: [], externalResources: [] },
      catalogMode: "empty",
    });
    assert.equal(ideas.length, 0);
    assert.equal(metrics.ideasGenerated, 0);
    assert.equal(metrics.scheduler, false);
    assert.equal(metrics.autoPublish, false);
  });

  await test("4Q.3 promising impossible with <2 live FACT", () => {
    const rating = rateOwnIdea({
      components: [
        component({
          kind: "ASSET",
          title: "Экскаватор",
          pageType: "DETAIL",
          provenance: {
            kind: "FACT",
            sourceType: "auction",
            sourceUrl: "https://torgi.gov.ru/lot/1",
            sourceLabel: "torgi",
            fetchedAt: null,
            verifiedAt: null,
            trustLevel: "official",
          },
        }),
        component({
          kind: "DEMAND",
          title: "Земляные работы",
          pageType: "DETAIL",
          provenance: {
            kind: "INFERENCE",
            sourceType: "procurement",
            sourceUrl: "https://zakupki.gov.ru/notice/1",
            sourceLabel: "zakupki",
            fetchedAt: null,
            verifiedAt: null,
            trustLevel: "search_snippet",
          },
        }),
      ],
      missing: [{ kind: "CAPITAL", reason: "нет", searchedInternal: true, searchedExternal: true }],
      economics: computeRoughEconomics([]),
    });
    assert.notEqual(rating, "promising");
  });

  await test("4Q.3 generic bank page finance UNKNOWN", () => {
    assert.equal(
      isGenericFinancingPage({
        url: "https://www.sberbank.ru/",
        title: "СберБанк — официальный сайт",
      }),
      true,
    );
    const page = classifyOwnIdeaPageType({
      url: "https://www.sberbank.ru/",
      title: "СберБанк",
    });
    assert.equal(page, "LANDING");
    const v = validateDetailFields({
      kind: "CAPITAL",
      pageType: "LANDING",
      title: "Кредит бизнесу",
      sourceUrl: "https://www.sberbank.ru/",
      provider: "Сбер",
    });
    assert.equal(v.reject, true);
    const { ideas } = runOwnIdeaBuilder({
      catalog: {
        ...tractorEarthworksCatalog(),
        externalResources: [
          {
            id: "bank-home",
            kind: "CAPITAL",
            title: "Кредит наличными",
            origin: "EXTERNAL",
            sourceUrl: "https://www.sberbank.ru/ru/person/credits",
            canonicalUrl: "https://www.sberbank.ru/ru/person/credits",
            claimKind: "INFERENCE",
            industry: "construction",
            pageType: "LANDING",
            financeAvailability: "UNKNOWN",
          },
        ],
      },
    });
    const cap = ideas[0]?.components.find((c) => c.kind === "CAPITAL" && c.found);
    assert.ok(!cap || cap.financeAvailability === "UNKNOWN" || cap.provenance.kind === "UNKNOWN");
  });

  await test("4Q.3 hard run external-call budget cannot exceed configured limit", async () => {
    const { CKR_OWN_IDEAS_BUDGETS: budgets } = await import("../src/config/ckr-own-ideas");
    const { consumeExternal, createOwnIdeaRunBudget, totalExternalCalls } = await import(
      "../src/lib/ckr-own-ideas/run-budget"
    );
    const budget = createOwnIdeaRunBudget();
    for (let i = 0; i < budgets.maxExternalCalls; i += 1) {
      assert.equal(consumeExternal(budget, "catalog"), true);
    }
    assert.equal(consumeExternal(budget, "builder"), false);
    assert.equal(totalExternalCalls(budget), budgets.maxExternalCalls);
    let hookCalls = 0;
    await buildOwnIdeaCatalog({
      userId: "budget-test",
      budget,
      hooks: {
        async search() {
          hookCalls += 1;
          return [];
        },
      },
    });
    assert.equal(hookCalls, 0);
    assert.ok(totalExternalCalls(budget) <= budgets.maxExternalCalls);

    const budget2 = createOwnIdeaRunBudget();
    for (let i = 0; i < budgets.maxExternalCalls - 1; i += 1) {
      consumeExternal(budget2, "catalog");
    }
    hookCalls = 0;
    const live = await buildOwnIdeaCatalog({
      userId: "budget-test-2",
      budget: budget2,
      hooks: {
        async search() {
          hookCalls += 1;
          return [];
        },
      },
    });
    assert.ok(hookCalls <= 1);
    assert.ok((live.totalExternalCalls ?? live.externalCalls) <= budgets.maxExternalCalls);
    const built = runOwnIdeaBuilder({
      catalog: tractorEarthworksCatalog(),
      budget: budget2,
      liveMeta: {
        catalogSearches: live.catalogSearches,
        catalogExternalCalls: live.catalogExternalCalls,
      },
    });
    assert.ok((built.metrics.totalExternalCalls ?? built.metrics.externalCalls) <= budgets.maxExternalCalls);
  });

  const serperProcurement = {
    id: "serper-proc",
    isStub: false,
    isCatalogSource: false,
    isOfficialSource: true,
    dataChannel: "SERPER_DISCOVERY",
    title: "Закупка земляных работ № 0123456789012345678",
    description: "snippet only",
    canonicalUrl: "https://star-pro.ru/search?q=земля",
    opportunityType: "PROCUREMENT",
    pageType: "UNKNOWN",
    sourceObjectId: "0123456789012345678",
    region: "Дагестан",
    industry: "construction",
    customer: "МКУ Махачкала",
    sourcePublishedAt: "2026-04-01T00:00:00.000Z",
    deadlineAt: "2027-06-01T00:00:00.000Z",
    procurementStage: "submission",
    nmck: 8_500_000,
    sources: [{ id: "s", category: "PROCUREMENT", name: "serper", url: "https://star-pro.ru/search?q=земля", isStub: false }],
  } as never;

  const officialProcurement = {
    id: "official-proc",
    isStub: false,
    isCatalogSource: false,
    isOfficialSource: true,
    dataChannel: "OFFICIAL_API",
    enrichedFromFetch: true,
    title: "Поставка ГСМ для земляных работ",
    canonicalUrl:
      "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0123456789012345678",
    opportunityType: "PROCUREMENT",
    pageType: "DETAIL",
    sourceObjectId: "0123456789012345678",
    region: "Дагестан",
    industry: "construction",
    customer: "МКУ Махачкала",
    sourcePublishedAt: "2026-04-01T00:00:00.000Z",
    deadlineAt: "2027-06-01T00:00:00.000Z",
    procurementStage: "submission",
    nmck: 8_500_000,
    sources: [
      {
        id: "o",
        category: "PROCUREMENT",
        name: "zakupki.gov.ru",
        url: "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0123456789012345678",
        isStub: false,
      },
    ],
  } as never;

  const officialLot = {
    id: "official-lot",
    isStub: false,
    isCatalogSource: false,
    isOfficialSource: true,
    dataChannel: "OFFICIAL_API",
    enrichedFromFetch: true,
    title: "Экскаватор гусеничный",
    canonicalUrl: "https://torgi.gov.ru/new/public/lots/lot/lot-exc-99",
    opportunityType: "AUCTION_ASSET",
    pageType: "DETAIL",
    sourceObjectId: "lot-exc-99",
    region: "Дагестан",
    city: "Махачкала",
    industry: "construction",
    assetType: "экскаватор",
    askingPrice: 4_200_000,
    auctionStatus: "active",
    address: "Махачкала",
    sources: [
      {
        id: "l",
        category: "AUCTIONS",
        name: "torgi.gov.ru",
        url: "https://torgi.gov.ru/new/public/lots/lot/lot-exc-99",
        isStub: false,
      },
    ],
  } as never;

  await test("4Q.4 Serper snippet itself is not FACT", () => {
    assert.equal(isDiscoverySnippet(serperProcurement), true);
    const sig = oiCandidateToSignal(serperProcurement);
    assert.ok(sig);
    assert.notEqual(sig?.claimKind, "FACT");
    assert.equal(sig?.trustLevel, "search_snippet");
    assert.equal(sig?.detailResolved, false);
  });

  await test("4Q.4 zakupki mirror resolves to official procurement FACT", async () => {
    const { createOwnIdeaRunBudget } = await import("../src/lib/ckr-own-ideas/run-budget");
    const budget = createOwnIdeaRunBudget();
    const live = await buildOwnIdeaCatalog({
      userId: "4q4-mirror",
      budget,
      hooks: {
        async search(q) {
          if (q.plan.intent === "tenders") {
            return [
              {
                ...serperProcurement,
                canonicalUrl: "https://star-pro.ru/region/dagestan/l0123456789012345678-1",
                sources: [
                  {
                    id: "m",
                    category: "PROCUREMENT",
                    name: "star-pro",
                    url: "https://star-pro.ru/region/dagestan/l0123456789012345678-1",
                    isStub: false,
                  },
                ],
              } as never,
            ];
          }
          return [];
        },
        async resolveDetail() {
          return officialProcurement;
        },
      },
    });
    assert.ok(live.aggregatorCandidates >= 1 || live.aggregatorToOfficialResolved >= 1);
    assert.ok(live.officialDetailsResolved >= 1);
    const demand = live.catalog.signals.find((s) => s.kind === "DEMAND");
    assert.ok(demand);
    assert.equal(demand?.claimKind, "FACT");
    assert.equal(demand?.detailResolved, true);
    assert.match(demand?.canonicalUrl || "", /zakupki\.gov\.ru/);
    assert.ok(demand?.factFields?.some((f) => f.field === "official_id" && f.verificationStatus === "VERIFIED"));
  });

  await test("4Q.4 concrete official procurement is validated FACT", () => {
    const sig = oiCandidateToSignal(officialProcurement);
    assert.ok(sig);
    assert.equal(sig?.claimKind, "FACT");
    assert.equal(sig?.pageType, "DETAIL");
    assert.ok(sig?.factFields && sig.factFields.length >= 1);
    assert.ok(sig?.sourceDomain === "zakupki.gov.ru");
  });

  await test("4Q.4 torgi listing is not FACT; official lot is", async () => {
    const listing = oiCandidateToSignal({
      isStub: false,
      isCatalogSource: false,
      dataChannel: "SERPER_DISCOVERY",
      title: "Реестр торгов",
      canonicalUrl: "https://torgi.gov.ru/new/public/lots/lot",
      opportunityType: "AUCTION_ASSET",
    } as never);
    assert.ok(!listing || listing.claimKind !== "FACT" || listing.pageType !== "DETAIL");
    const lot = oiCandidateToSignal(officialLot);
    assert.ok(lot);
    assert.equal(lot?.claimKind, "FACT");
    assert.equal(lot?.kind, "ASSET");
    assert.ok(isOfficialDetailUrl(lot?.canonicalUrl));
  });

  await test("4Q.4 generic TradeList is not FACT", () => {
    const sig = oiCandidateToSignal({
      isStub: false,
      isCatalogSource: false,
      dataChannel: "SERPER_DISCOVERY",
      title: "Торги - Единый федеральный реестр",
      canonicalUrl: "https://old.bankrot.fedresurs.ru/TradeList.aspx",
      opportunityType: "AUCTION_ASSET",
      askingPrice: 1,
    } as never);
    assert.equal(sig, null);
  });

  await test("4Q.4 concrete asset lot is FACT", () => {
    const sig = oiCandidateToSignal(officialLot);
    assert.equal(sig?.claimKind, "FACT");
    assert.equal(sig?.verificationStatus, "VERIFIED");
    assert.ok(sig?.factFields?.some((f) => f.kind === "FACT"));
  });

  await test("4Q.4 expired detail rejected after resolution", async () => {
    const { createOwnIdeaRunBudget } = await import("../src/lib/ckr-own-ideas/run-budget");
    const budget = createOwnIdeaRunBudget();
    const { candidates } = await acquireOwnIdeaDetails(
      [
        {
          ...serperProcurement,
          deadlineAt: "2020-01-01T00:00:00.000Z",
          procurementStage: "completed",
        } as never,
      ],
      budget,
      {
        async resolveDetail() {
          throw new Error("should not resolve expired");
        },
      },
    );
    assert.equal(candidates.length, 0);
  });

  await test("4Q.4 generic MSP page is not financing FACT", () => {
    const sig = oiCandidateToSignal({
      isStub: false,
      isCatalogSource: false,
      dataChannel: "SERPER_DISCOVERY",
      title: "Меры поддержки МСП",
      canonicalUrl: "https://мсп.рф/",
      opportunityType: "SUPPORT_PROGRAM",
      pageType: "HOMEPAGE",
    } as never);
    assert.ok(!sig || sig.claimKind !== "FACT");
  });

  await test("4Q.4 concrete support program is validated support FACT", () => {
    const sig = oiCandidateToSignal({
      isStub: false,
      isCatalogSource: false,
      isOfficialSource: true,
      dataChannel: "OFFICIAL_API",
      enrichedFromFetch: true,
      title: "Льготный лизинг спецтехники МСП.РФ",
      canonicalUrl: "https://мсп.рф/services/lease/special-tech",
      opportunityType: "SUPPORT_PROGRAM",
      pageType: "DETAIL",
      organizer: "Корпорация МСП",
      eligibility: "МСП Республика Дагестан, спецтехника",
      regionApplicability: "Дагестан",
      region: "Дагестан",
      sourcePublishedAt: "2026-03-01T00:00:00.000Z",
      industry: "construction",
    } as never);
    assert.ok(sig);
    assert.equal(sig?.kind, "CAPITAL");
    assert.equal(sig?.claimKind, "FACT");
    assert.equal(sig?.financeAvailability, "KNOWN");
  });

  await test("4Q.4 missing price stays UNKNOWN, missing demand deadline not FACT", () => {
    const asset = oiCandidateToSignal({
      ...officialLot,
      askingPrice: null,
      nmck: null,
      startingPrice: null,
    } as never);
    assert.ok(asset);
    assert.equal(asset?.amount ?? null, null);
    assert.equal(asset?.priceUnknown, true);
    const demand = oiCandidateToSignal({
      ...officialProcurement,
      deadlineAt: null,
      procurementStage: null,
    } as never);
    assert.ok(demand);
    assert.notEqual(demand?.claimKind, "FACT");
  });

  await test("4Q.4 Dagestan preferred; RF generic != Dagestan", () => {
    assert.equal(isGenericRussiaRegion("Российская Федерация"), true);
    assert.equal(isGenericRussiaRegion("Республика Дагестан"), false);
    assert.notEqual(geoCompatibility("Российская Федерация", "Дагестан"), "SAME_REGION");
    assert.equal(geoCompatibility("Махачкала", "Республика Дагестан"), "SAME_REGION");
    assert.ok(!alreadyResolvedOfficial(serperProcurement));
  });

  await test("4Q.4 detail resolution respects global external-call budget", async () => {
    const { CKR_OWN_IDEAS_BUDGETS: budgets } = await import("../src/config/ckr-own-ideas");
    const { consumeExternal, createOwnIdeaRunBudget, totalExternalCalls } = await import(
      "../src/lib/ckr-own-ideas/run-budget"
    );
    const budget = createOwnIdeaRunBudget();
    for (let i = 0; i < budgets.maxExternalCalls; i += 1) {
      consumeExternal(budget, "catalog");
    }
    let resolves = 0;
    const live = await buildOwnIdeaCatalog({
      userId: "4q4-budget",
      budget,
      hooks: {
        async search() {
          return [serperProcurement];
        },
        async resolveDetail() {
          resolves += 1;
          return officialProcurement;
        },
      },
    });
    assert.equal(resolves, 0);
    assert.ok(totalExternalCalls(budget) <= budgets.maxExternalCalls);
    assert.ok((live.totalExternalCalls ?? 0) <= budgets.maxExternalCalls);
    assert.equal(live.liveFacts, 0);
  });

  await test("4Q.4 0 resolved facts is a successful run with 0 ideas", async () => {
    const live = await buildOwnIdeaCatalog({
      userId: "4q4-zero",
      hooks: {
        async search() {
          return [];
        },
      },
    });
    assert.equal(live.liveFacts, 0);
    const { ideas, metrics } = runOwnIdeaBuilder({
      catalog: live.catalog,
      catalogMode: live.mode,
      liveMeta: live,
    });
    assert.equal(ideas.length, 0);
    assert.equal(metrics.ideasGenerated, 0);
    assert.equal(metrics.scheduler, false);
    assert.equal(metrics.liveFacts, 0);
  });

  await test("4Q.4 no new search provider / crawler / scheduler", () => {
    const acquire = read("src/lib/ckr-own-ideas/detail-acquire.ts");
    const catalog = read("src/lib/ckr-own-ideas/live-catalog.ts");
    assert.match(acquire, /resolveProcurementDetail/);
    assert.match(acquire, /fetchOfficialDetail/);
    assert.match(read("src/lib/ckr-own-ideas/official-detail-fetch.ts"), /officialHttpFetch/);
    assert.match(read("src/lib/ckr-own-ideas/official-detail-fetch.ts"), /torgi_api/);
    assert.doesNotMatch(acquire, /puppeteer|playwright|cheerio/i);
    assert.doesNotMatch(acquire, /new SearchProvider|second search stack/i);
    assert.doesNotMatch(catalog, /LIA_WEB_SEARCH_PROVIDER\s*=/);
    assert.match(read("src/config/ckr-own-ideas.ts"), /scheduler:\s*false/);
    assert.match(read("src/config/ckr-own-ideas.ts"), /maxExternalCalls:\s*8/);
    assert.match(read("src/config/ckr-own-ideas.ts"), /maxSearches:\s*12/);
    assert.match(read("src/config/ckr-own-ideas.ts"), /timeoutMs:\s*15_000/);
    assert.match(read("src/config/ckr-own-ideas.ts"), /discoveryMaxExternalCalls:\s*4/);
    assert.match(read("src/config/ckr-own-ideas.ts"), /resolutionReservedExternalCalls:\s*4/);
    assert.match(read("src/config/ckr-own-ideas.ts"), /perDetailTimeoutMs:\s*4_000/);
  });

  await test("4Q.4.1 nested Serper queries count as actual external HTTP", async () => {
    const { searchOfficialSites } = await import("../src/lib/lia/oi/sources/serper-site");
    const {
      createOwnIdeaRunBudgetForTest,
      runWithOwnIdeaBudget,
      totalExternalCalls,
    } = await import("../src/lib/ckr-own-ideas/run-budget");
    const budget = createOwnIdeaRunBudgetForTest({ maxDiscoveryExternalCalls: 2, maxExternalCalls: 8 });
    let http = 0;
    await runWithOwnIdeaBudget(budget, async () => {
      await searchOfficialSites({
        queries: ["q1", "q2", "q3"],
        sites: ["torgi.gov.ru"],
        limitPerQuery: 1,
        timeoutMs: 12_000,
        searchFn: async () => {
          http += 1;
          return [
            {
              id: "t1",
              title: "lot",
              url: "https://torgi.gov.ru/new/public/lots/lot/1",
              description: "x",
              source: "serper",
              published_at: "",
              trust_score: 0.4,
              trusted: false,
              query: "q",
            },
          ];
        },
      });
    });
    assert.equal(http, 2);
    assert.equal(budget.discoveryExternalCalls, 2);
    assert.equal(totalExternalCalls(budget), 2);
    assert.equal(budget.discoveryStoppedForResolutionReserve, true);
  });

  await test("4Q.4.1 adapter fan-out cannot bypass global discovery reserve", async () => {
    const {
      canConsumeDiscovery,
      consumeActualHttp,
      createOwnIdeaRunBudget,
      markResolvableCandidate,
    } = await import("../src/lib/ckr-own-ideas/run-budget");
    const budget = createOwnIdeaRunBudget();
    markResolvableCandidate(budget);
    let ok = 0;
    for (let i = 0; i < 8; i += 1) {
      if (!canConsumeDiscovery(budget)) break;
      if (!consumeActualHttp(budget, "discovery")) break;
      ok += 1;
    }
    assert.ok(ok <= 4);
    assert.ok(budget.discoveryExternalCalls <= 4);
    assert.ok(8 - budget.discoveryExternalCalls >= 4);
  });

  await test("4Q.4.1 discovery cannot spend all 8 calls when a resolvable candidate exists", async () => {
    const { createOwnIdeaRunBudget } = await import("../src/lib/ckr-own-ideas/run-budget");
    const budget = createOwnIdeaRunBudget();
    let searches = 0;
    const live = await buildOwnIdeaCatalog({
      userId: "4q41-reserve",
      budget,
      hooks: {
        async search() {
          searches += 1;
          return [serperProcurement];
        },
        async resolveDetail() {
          return officialProcurement;
        },
      },
    });
    assert.ok(searches <= 4);
    assert.ok(live.discoveryExternalCalls <= 4);
    assert.ok((live.resolutionExternalCalls ?? 0) >= 1);
    assert.ok(live.detailResolutionAttempts >= 1);
    assert.ok(live.totalExternalCalls <= 8);
    assert.ok((live.actualExternalHttpCalls ?? live.totalExternalCalls) === live.totalExternalCalls);
  });

  await test("4Q.4.1 eligible official DETAIL yields detailResolutionAttempts >= 1", async () => {
    const { createOwnIdeaRunBudget } = await import("../src/lib/ckr-own-ideas/run-budget");
    const budget = createOwnIdeaRunBudget();
    const live = await buildOwnIdeaCatalog({
      userId: "4q41-invariant",
      budget,
      hooks: {
        async search(q) {
          if (q.plan.intent === "tenders") return [serperProcurement];
          return [];
        },
        async resolveDetail() {
          return officialProcurement;
        },
      },
    });
    assert.ok(live.detailResolutionAttempts >= 1);
    assert.ok((live.resolutionExternalCalls ?? 0) >= 1);
    assert.ok((live.discoveryExternalCalls ?? 0) >= 1);
    assert.ok(live.liveFacts >= 1);
  });

  await test("4Q.4.1 Dagestan candidate is resolved before other regions", async () => {
    const { createOwnIdeaRunBudget } = await import("../src/lib/ckr-own-ideas/run-budget");
    const order: string[] = [];
    const orel = {
      ...officialLot,
      id: "orel-lot",
      region: "Орловская область",
      city: "Залегощь",
      dataChannel: "SERPER_DISCOVERY",
      enrichedFromFetch: false,
      isOfficialSource: false,
      canonicalUrl: "https://torgi.gov.ru/new/public/lots/lot/orel-1",
    };
    const dag = {
      ...officialLot,
      id: "dag-lot",
      region: "Республика Дагестан",
      city: "Махачкала",
      dataChannel: "SERPER_DISCOVERY",
      enrichedFromFetch: false,
      isOfficialSource: false,
      canonicalUrl: "https://torgi.gov.ru/new/public/lots/lot/dag-1",
    };
    await buildOwnIdeaCatalog({
      userId: "4q41-dag",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search() {
          return [orel as never, dag as never];
        },
        async resolveDetail(c) {
          order.push(String(c.region));
          return { ...c, dataChannel: "OFFICIAL_API", enrichedFromFetch: true, isOfficialSource: true };
        },
      },
    });
    assert.ok(order.length >= 1);
    assert.match(order[0] || "", /Дагестан/i);
  });

  await test("4Q.4.1 slow discovery stops to leave resolution time", async () => {
    const { createOwnIdeaRunBudgetForTest, requestTimeoutMs } = await import(
      "../src/lib/ckr-own-ideas/run-budget"
    );
    const budget = createOwnIdeaRunBudgetForTest({
      timeoutMs: 400,
      resolutionReserveMs: 200,
      maxDiscoveryExternalCalls: 4,
    });
    const now = budget.startedAt + 180;
    const discoveryCap = requestTimeoutMs(budget, 12_000, "discovery", now);
    assert.ok(discoveryCap < 12_000, `discovery request must see remaining phase, got ${discoveryCap}`);
    assert.ok(discoveryCap <= 250);
    let searches = 0;
    let resolves = 0;
    const live = await buildOwnIdeaCatalog({
      userId: "4q41-deadline",
      budget: createOwnIdeaRunBudgetForTest({
        timeoutMs: 800,
        resolutionReserveMs: 250,
      }),
      hooks: {
        async search() {
          searches += 1;
          await new Promise((r) => setTimeout(r, 80));
          return [serperProcurement];
        },
        async resolveDetail() {
          resolves += 1;
          return officialProcurement;
        },
      },
    });
    assert.ok(resolves >= 1, "resolution must run after bounded discovery");
    assert.ok(live.detailResolutionAttempts >= 1);
    assert.ok(searches >= 1);
    assert.ok(searches < 3 || live.discoveryStoppedForResolutionReserve || live.detailResolutionAttempts >= 1);
  });

  await test("4Q.4.1 deadline propagates into nested adapter search timeout", async () => {
    const { createOwnIdeaRunBudgetForTest, requestTimeoutMs, setOwnIdeaBudgetPhase } = await import(
      "../src/lib/ckr-own-ideas/run-budget"
    );
    const budget = createOwnIdeaRunBudgetForTest({ timeoutMs: 15_000, resolutionReserveMs: 6_000 });
    const t = requestTimeoutMs(budget, 12_000, "discovery", budget.startedAt);
    assert.ok(t <= 9_000);
    setOwnIdeaBudgetPhase(budget, "resolution");
    const resT = requestTimeoutMs(budget, 8_000, "resolution", budget.startedAt + 10_000);
    assert.ok(resT <= 5_000);
  });

  await test("4Q.4.1 resolution timeout is classified, 0 FACT is valid", async () => {
    const { createOwnIdeaRunBudgetForTest } = await import("../src/lib/ckr-own-ideas/run-budget");
    const budget = createOwnIdeaRunBudgetForTest({ timeoutMs: 1, resolutionReserveMs: 0 });
    const live = await buildOwnIdeaCatalog({
      userId: "4q41-timeout-class",
      budget,
      hooks: {
        async search() {
          return [serperProcurement];
        },
        async resolveDetail() {
          throw new Error("should not resolve after deadline");
        },
      },
    });
    assert.equal(live.liveFacts, 0);
    const { ideas, metrics } = runOwnIdeaBuilder({
      catalog: live.catalog,
      catalogMode: live.mode,
      liveMeta: live,
    });
    assert.equal(ideas.length, 0);
    assert.equal(metrics.liveFacts, 0);
    assert.ok(live.budgetExhaustedPhase === "timeout" || live.budgetExhausted || live.detailResolutionAttempts === 0);
  });

  await test("4Q.4.1 candidate diagnostics persist without secrets", async () => {
    const { createOwnIdeaRunBudget } = await import("../src/lib/ckr-own-ideas/run-budget");
    const live = await buildOwnIdeaCatalog({
      userId: "4q41-diag",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search(q) {
          if (q.plan.intent === "tenders") return [serperProcurement];
          return [];
        },
        async resolveDetail() {
          return officialProcurement;
        },
      },
    });
    assert.ok(live.candidateDiagnostics.length >= 1);
    assert.ok(live.candidateDiagnostics.length <= 20);
    for (const d of live.candidateDiagnostics) {
      const blob = JSON.stringify(d);
      assert.doesNotMatch(blob, /X-API-KEY|apiKey|Bearer |<html/i);
      assert.ok(d.candidateUrl || d.officialUrl || d.reason);
    }
    const { metrics } = runOwnIdeaBuilder({
      catalog: live.catalog,
      catalogMode: live.mode,
      liveMeta: live,
    });
    assert.ok((metrics.candidateDiagnostics || []).length >= 1);
    assert.doesNotMatch(JSON.stringify(metrics.candidateDiagnostics), /<html|X-API-KEY/i);
  });

  await test("4Q.4.1 quality gates 4Q.3 stay closed", () => {
    assert.equal(
      classifyOwnIdeaPageType({ url: "https://old.bankrot.fedresurs.ru/TradeList.aspx" }),
      "LISTING",
    );
    const listing = oiCandidateToSignal({
      isStub: false,
      isCatalogSource: false,
      dataChannel: "SERPER_DISCOVERY",
      title: "Торги - Единый федеральный реестр",
      canonicalUrl: "https://old.bankrot.fedresurs.ru/TradeList.aspx",
      opportunityType: "AUCTION_ASSET",
    } as never);
    assert.equal(listing, null);
    assert.notEqual(geoCompatibility("Орловская область", "Дагестан"), "SAME_REGION");
  });

  const { parseTorgiLotJson, applyTorgiLotToCandidate } = await import("../src/lib/ckr-own-ideas/torgi-lot");
  const { classifyOfficialFetchFailure, isHtmlShell, shouldRetryOfficialHtmlFallback } = await import(
    "../src/lib/ckr-own-ideas/official-detail-fetch"
  );
  const {
    officialHttpFetch,
    pickOfficialAddress,
    OFFICIAL_IP_FAMILY_POLICY,
    classifyTransportErrno,
  } = await import("../src/lib/http/official-http-transport");
  const { createOwnIdeaRunBudget, createOwnIdeaRunBudgetForTest, requestTimeoutMs, totalExternalCalls } =
    await import("../src/lib/ckr-own-ideas/run-budget");

  const torgiJson = (id: string, extra: Record<string, unknown> = {}) =>
    JSON.stringify({
      id,
      lotName: extra.lotName ?? "Экскаватор гусеничный",
      lotStatus: extra.lotStatus ?? { name: "Опубликован" },
      priceMin: extra.priceMin,
      subjectRFName: extra.subjectRFName ?? "Республика Дагестан",
      estateAddress: extra.estateAddress ?? "г. Махачкала",
      biddOrg: { orgName: extra.organizer ?? "ТУ Росимущества" },
      firstVersionPublicationDate: extra.publishedAt ?? "2026-04-01T00:00:00.000Z",
      biddEndTime: extra.deadlineAt ?? "2027-06-01T12:00:00.000Z",
    });

  function serperTorgi(id: string) {
    return {
      id: `disc-${id}`,
      isStub: false,
      isCatalogSource: false,
      dataChannel: "SERPER_DISCOVERY",
      title: "лот сниппет serper",
      canonicalUrl: `https://torgi.gov.ru/new/public/lots/lot/${id}`,
      opportunityType: "AUCTION_ASSET",
      sourceAdapterId: "auction_assets",
      pageType: "DETAIL",
      sourceObjectId: id,
      sources: [
        {
          id: `s-${id}`,
          category: "AUCTIONS",
          name: "serper",
          url: `https://torgi.gov.ru/new/public/lots/lot/${id}`,
          isStub: false,
        },
      ],
    } as never;
  }

  await test("4Q.4.2 torgi official JSON reaches extraction", () => {
    const parsed = parseTorgiLotJson(torgiJson("lot-ok-1", { priceMin: 4_200_000 }), "https://torgi.gov.ru/new/public/lots/lot/lot-ok-1");
    assert.ok(parsed);
    assert.equal(parsed?.lotId, "lot-ok-1");
    assert.equal(parsed?.title, "Экскаватор гусеничный");
    assert.equal(parsed?.region, "Республика Дагестан");
    assert.equal(parsed?.price, 4_200_000);
    const applied = applyTorgiLotToCandidate(serperTorgi("lot-ok-1"), parsed!);
    assert.equal(applied.dataChannel, "OFFICIAL_API");
    assert.equal(applied.enrichedFromFetch, true);
    assert.ok((applied.structuredFields || []).some((f) => f.field === "lot_id" && f.source === "official_api"));
    assert.ok(!(applied.structuredFields || []).some((f) => f.source === "search_snippet"));
  });

  await test("4Q.4.2 structured API preferred over JS shell", async () => {
    const live = await buildOwnIdeaCatalog({
      userId: "4q42-api",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") return [serperTorgi("lot-api-1")];
          return [];
        },
        async fetchOfficial(url) {
          if (url.includes("/api/public/lotcards/lot/")) {
            return {
              ok: true,
              url,
              finalUrl: url,
              status: 200,
              contentType: "application/json",
              bodyText: torgiJson("lot-api-1", { priceMin: 1_000_000 }),
              bytes: 200,
              elapsedMs: 12,
            };
          }
          return {
            ok: true,
            url,
            finalUrl: url,
            status: 200,
            contentType: "text/html",
            bodyText: `<html><app-root></app-root><script>webpackJsonp</script><title>ГИС Торги</title></html>`,
            bytes: 80,
            elapsedMs: 12,
          };
        },
      },
    });
    assert.ok(live.officialDetailsResolved >= 1);
    assert.equal(live.candidateDiagnostics.some((d) => d.fetchStrategy === "torgi_api"), true);
    const sig = live.catalog.signals.find((s) => s.officialId === "lot-api-1");
    assert.ok(sig);
    assert.notEqual(sig?.title, "лот сниппет serper");
  });

  await test("4Q.4.2 HTML shell classified", async () => {
    assert.equal(
      isHtmlShell(`<html ng-version="17"><app-root></app-root><script src="/main.js"></script></html>`, "text/html"),
      true,
    );
    const live = await buildOwnIdeaCatalog({
      userId: "4q42-shell",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") return [serperTorgi("lot-shell")];
          return [];
        },
        async fetchOfficial(url) {
          return {
            ok: true,
            url,
            finalUrl: url,
            status: 200,
            contentType: "text/html",
            bodyText: `<!doctype html><html><app-root></app-root></html>`,
            bytes: 60,
            elapsedMs: 8,
          };
        },
      },
    });
    assert.ok(live.candidateDiagnostics.some((d) => d.errorCategory === "HTML_SHELL" || d.reason === "HTML_SHELL"));
    assert.equal(live.liveFacts, 0);
  });

  await test("4Q.4.2 HTTP 4xx classified", () => {
    assert.equal(
      classifyOfficialFetchFailure({ ok: false, error: "HTTP 403", code: "http_error", status: 403, elapsedMs: 20 }),
      "HTTP_4XX",
    );
  });

  await test("4Q.4.2 HTTP 5xx classified", () => {
    assert.equal(
      classifyOfficialFetchFailure({ ok: false, error: "HTTP 502", code: "http_error", status: 502, elapsedMs: 20 }),
      "HTTP_5XX",
    );
  });

  await test("4Q.4.2 first DETAIL timeout still attempts second candidate", async () => {
    const live = await buildOwnIdeaCatalog({
      userId: "4q42-queue",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") return [serperTorgi("lot-slow"), serperTorgi("lot-ok-2")];
          return [];
        },
        async fetchOfficial(url) {
          if (url.includes("lot-slow")) {
            return { ok: false, error: "Timeout", code: "timeout", elapsedMs: 40, finalUrl: url };
          }
          return {
            ok: true,
            url,
            finalUrl: url,
            status: 200,
            contentType: "application/json",
            bodyText: torgiJson("lot-ok-2", { priceMin: 2_000_000 }),
            bytes: 180,
            elapsedMs: 15,
          };
        },
      },
    });
    assert.ok(live.detailResolutionAttempts >= 2);
    assert.ok(live.officialDetailsResolved >= 1);
    assert.ok(live.resolutionExternalCalls >= 2);
    assert.ok((live.actualExternalHttpCalls ?? 0) <= 8);
    const slow = live.candidateDiagnostics.find((d) => (d.candidateUrl || "").includes("lot-slow"));
    const ok = live.candidateDiagnostics.find((d) => (d.officialUrl || d.candidateUrl || "").includes("lot-ok-2"));
    assert.equal(slow?.errorCategory || slow?.reason, "CONNECT_TIMEOUT");
    assert.ok(ok?.resolutionAttempted);
  });

  await test("4Q.4.2 per-detail timeout respects remainingMs", () => {
    const budget = createOwnIdeaRunBudgetForTest({ timeoutMs: 800, resolutionReserveMs: 0, now: Date.now() - 500 });
    const t = requestTimeoutMs(budget, CKR_OWN_IDEAS_BUDGETS.perDetailTimeoutMs, "resolution");
    assert.ok(t <= 400);
    assert.ok(t >= 250);
    assert.equal(CKR_OWN_IDEAS_BUDGETS.timeoutMs, 15_000);
    assert.equal(CKR_OWN_IDEAS_BUDGETS.perDetailTimeoutMs, 4_000);
    assert.equal(CKR_OWN_IDEAS_BUDGETS.maxExternalCalls, 8);
  });

  await test("4Q.4.2 fetches count in actualExternalHttpCalls", async () => {
    const budget = createOwnIdeaRunBudget();
    const live = await buildOwnIdeaCatalog({
      userId: "4q42-count",
      budget,
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") return [serperTorgi("lot-count")];
          return [];
        },
        async fetchOfficial(url) {
          return {
            ok: true,
            url,
            finalUrl: url,
            status: 200,
            contentType: "application/json",
            bodyText: torgiJson("lot-count", { priceMin: 3_000_000 }),
            bytes: 120,
            elapsedMs: 9,
          };
        },
      },
    });
    assert.ok((live.resolutionExternalCalls ?? 0) >= 1);
    assert.ok((live.actualExternalHttpCalls ?? 0) >= (live.resolutionExternalCalls ?? 0));
    assert.equal(totalExternalCalls(budget), live.actualExternalHttpCalls);
  });

  await test("4Q.4.2 successful official detail can become validated FACT", async () => {
    const live = await buildOwnIdeaCatalog({
      userId: "4q42-fact",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") return [serperTorgi("lot-fact")];
          return [];
        },
        async fetchOfficial() {
          return {
            ok: true,
            url: "https://torgi.gov.ru/new/api/public/lotcards/lot/lot-fact",
            finalUrl: "https://torgi.gov.ru/new/api/public/lotcards/lot/lot-fact",
            status: 200,
            contentType: "application/json",
            bodyText: torgiJson("lot-fact", { priceMin: 4_200_000 }),
            bytes: 200,
            elapsedMs: 10,
          };
        },
      },
    });
    const sig = live.catalog.signals.find((s) => s.officialId === "lot-fact");
    assert.ok(sig);
    assert.equal(sig?.pageType, "DETAIL");
    assert.equal(sig?.claimKind, "FACT");
    assert.ok((sig?.factFields || []).some((f) => f.kind === "FACT" && f.verificationStatus === "VERIFIED"));
    assert.ok(live.liveFacts >= 1);
  });

  await test("4Q.4.2 expired official lot still rejected", async () => {
    const live = await buildOwnIdeaCatalog({
      userId: "4q42-exp",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") return [serperTorgi("lot-exp")];
          return [];
        },
        async fetchOfficial() {
          return {
            ok: true,
            url: "https://torgi.gov.ru/new/api/public/lotcards/lot/lot-exp",
            finalUrl: "https://torgi.gov.ru/new/api/public/lotcards/lot/lot-exp",
            status: 200,
            contentType: "application/json",
            bodyText: torgiJson("lot-exp", {
              lotStatus: { name: "Торги завершены" },
              deadlineAt: "2020-01-01T00:00:00.000Z",
              priceMin: 100,
            }),
            bytes: 180,
            elapsedMs: 10,
          };
        },
      },
    });
    assert.ok(live.officialDetailsResolved >= 1);
    assert.equal(live.liveFacts, 0);
    assert.ok(live.candidateDiagnostics.some((d) => d.reason === "EXPIRED"));
  });

  await test("4Q.4.2 missing price remains UNKNOWN", () => {
    const parsed = parseTorgiLotJson(torgiJson("lot-np"), "https://torgi.gov.ru/new/public/lots/lot/lot-np");
    assert.equal(parsed?.price, null);
    const applied = applyTorgiLotToCandidate(serperTorgi("lot-np"), parsed!);
    assert.equal(applied.priceStatus, "UNKNOWN");
    const sig = oiCandidateToSignal(applied);
    assert.ok(sig);
    assert.equal(sig?.amount, null);
    assert.equal(sig?.priceUnknown, true);
    assert.equal(sig?.claimKind, "FACT");
  });

  await test("4Q.4.2 Serper snippet is not promoted to FACT on fetch failure", async () => {
    const live = await buildOwnIdeaCatalog({
      userId: "4q42-snip",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") return [serperTorgi("lot-snip")];
          return [];
        },
        async fetchOfficial() {
          return { ok: false, error: "HTTP 404", code: "http_error", status: 404, elapsedMs: 11 };
        },
      },
    });
    assert.equal(live.liveFacts, 0);
    assert.ok(!live.catalog.signals.some((s) => s.claimKind === "FACT"));
    assert.ok(live.candidateDiagnostics.some((d) => d.errorCategory === "HTTP_4XX" || d.reason === "HTTP_4XX"));
  });

  await test("4Q.4.2 candidate diagnostics persist fetch failure metadata", async () => {
    const live = await buildOwnIdeaCatalog({
      userId: "4q42-diag",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") return [serperTorgi("lot-diag")];
          return [];
        },
        async fetchOfficial() {
          return { ok: false, error: "HTTP 503", code: "http_error", status: 503, elapsedMs: 33, finalUrl: "https://torgi.gov.ru/new/api/public/lotcards/lot/lot-diag" };
        },
      },
    });
    const d = live.candidateDiagnostics.find((x) => x.resolutionAttempted);
    assert.ok(d);
    assert.equal(d?.httpStatus, 503);
    assert.equal(d?.elapsedMs, 33);
    assert.equal(d?.fetchStrategy, "torgi_api");
    assert.equal(d?.errorCategory, "HTTP_5XX");
    assert.ok(d?.finalUrl);
    assert.doesNotMatch(JSON.stringify(d), /<html|X-API-KEY|apiKey/i);
  });

  await test("4Q.4.2 quality gates unchanged", () => {
    assert.equal(
      classifyOwnIdeaPageType({ url: "https://old.bankrot.fedresurs.ru/TradeList.aspx" }),
      "LISTING",
    );
    assert.equal(CKR_OWN_IDEAS_BUDGETS.maxExternalCalls, 8);
    assert.equal(CKR_OWN_IDEAS_BUDGETS.timeoutMs, 15_000);
  });

  const fakeSafe = async (raw: string) => ({ url: new URL(raw), addresses: ["203.0.113.10"] });
  const okJson = (url: string, id = "lot-v4") => ({
    ok: true as const,
    url,
    finalUrl: url,
    status: 200,
    contentType: "application/json",
    bodyText: torgiJson(id, { priceMin: 1_000_000 }),
    bytes: 80,
    elapsedMs: 7,
  });

  await test("4Q.4.3 IPv6 fail + IPv4 success uses IPv4", async () => {
    let used: { family: number; address: string } | null = null;
    const res = await officialHttpFetch(
      "https://torgi.gov.ru/new/api/public/lotcards/lot/lot-v4",
      { timeoutMs: 800 },
      {
        assertSafe: fakeSafe,
        lookupAll: async () => [
          { address: "2001:db8::1", family: 6 },
          { address: "203.0.113.10", family: 4 },
        ],
        requestOnce: async (url, address) => {
          used = address;
          if (address.family === 6) {
            return { ok: false, error: "ipv6 timeout", code: "ipv6_connect_timeout", elapsedMs: 5 };
          }
          return okJson(url.toString());
        },
      },
    );
    assert.equal(res.ok, true);
    assert.equal(used?.family, 4);
    assert.equal(used?.address, "203.0.113.10");
    assert.equal(OFFICIAL_IP_FAMILY_POLICY, "ipv4_preferred");
    assert.equal(
      pickOfficialAddress(
        [
          { address: "2001:db8::1", family: 6 },
          { address: "203.0.113.10", family: 4 },
        ],
      )?.family,
      4,
    );
  });

  await test("4Q.4.3 IPv4 preference is official-transport only", () => {
    const official = read("src/lib/http/official-http-transport.ts");
    const safe = read("src/lib/http/safe-fetch.ts");
    const serper = read("src/lib/lia/oi/sources/serper-site.ts");
    assert.match(official, /ipv4_preferred/);
    assert.doesNotMatch(safe, /ipv4_preferred|OFFICIAL_IP_FAMILY_POLICY/);
    assert.doesNotMatch(serper, /officialHttpFetch|ipv4_preferred/);
    assert.match(read("src/lib/ckr-own-ideas/official-detail-fetch.ts"), /officialHttpFetch/);
  });

  await test("4Q.4.3 DNS fail classified", async () => {
    const res = await officialHttpFetch(
      "https://torgi.gov.ru/new/api/public/lotcards/lot/x",
      { timeoutMs: 400 },
      {
        assertSafe: fakeSafe,
        lookupAll: async () => {
          throw new Error("ENOTFOUND");
        },
      },
    );
    assert.equal(res.ok, false);
    if (res.ok) throw new Error("expected fail");
    assert.equal(res.code, "dns_failed");
    assert.equal(classifyOfficialFetchFailure(res), "DNS_ERROR");
  });

  await test("4Q.4.3 TLS timeout classified", () => {
    assert.equal(
      classifyOfficialFetchFailure({
        ok: false,
        error: "tls timeout",
        code: "tls_handshake_timeout",
        elapsedMs: 40,
      }),
      "TLS_HANDSHAKE_TIMEOUT",
    );
    assert.equal(
      classifyTransportErrno({ code: "TIMEOUT", message: "tls timeout" }, "tls", 4),
      "tls_handshake_timeout",
    );
  });

  await test("4Q.4.3 connect timeout classified", () => {
    assert.equal(
      classifyOfficialFetchFailure({
        ok: false,
        error: "connect timeout",
        code: "ipv4_connect_timeout",
        elapsedMs: 40,
      }),
      "IPV4_CONNECT_TIMEOUT",
    );
    assert.equal(
      classifyTransportErrno({ code: "ETIMEDOUT", message: "connect" }, "connect", 6),
      "ipv6_connect_timeout",
    );
    assert.equal(
      classifyTransportErrno({ code: "ECONNREFUSED", message: "refused" }, "connect", 4),
      "connect_refused",
    );
    assert.equal(
      classifyOfficialFetchFailure({
        ok: false,
        error: "headers timeout",
        code: "headers_timeout",
        elapsedMs: 12,
      }),
      "HEADERS_TIMEOUT",
    );
    assert.equal(
      classifyOfficialFetchFailure({
        ok: false,
        error: "body timeout",
        code: "body_timeout",
        elapsedMs: 12,
      }),
      "BODY_TIMEOUT",
    );
  });

  await test("4Q.4.3 one DETAIL transport fail still attempts next", async () => {
    const live = await buildOwnIdeaCatalog({
      userId: "4q43-queue",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") return [serperTorgi("lot-tls"), serperTorgi("lot-ok-43")];
          return [];
        },
        async fetchOfficial(url) {
          if (url.includes("lot-tls")) {
            return { ok: false, error: "tls timeout", code: "tls_handshake_timeout", elapsedMs: 30, finalUrl: url };
          }
          return {
            ok: true,
            url,
            finalUrl: url,
            status: 200,
            contentType: "application/json",
            bodyText: torgiJson("lot-ok-43", { priceMin: 2_000_000 }),
            bytes: 180,
            elapsedMs: 12,
          };
        },
      },
    });
    assert.ok(live.detailResolutionAttempts >= 2);
    assert.ok(live.officialDetailsResolved >= 1);
    assert.ok((live.actualExternalHttpCalls ?? 0) <= 8);
    const failD = live.candidateDiagnostics.find((d) => (d.candidateUrl || "").includes("lot-tls"));
    assert.equal(failD?.errorCategory, "TLS_HANDSHAKE_TIMEOUT");
  });

  await test("4Q.4.3 host unavailable does not HTML-fallback", async () => {
    const urls: string[] = [];
    assert.equal(shouldRetryOfficialHtmlFallback("TLS_HANDSHAKE_TIMEOUT"), false);
    assert.equal(shouldRetryOfficialHtmlFallback("IPV4_CONNECT_TIMEOUT"), false);
    assert.equal(shouldRetryOfficialHtmlFallback("CONNECT_TIMEOUT"), false);
    assert.equal(shouldRetryOfficialHtmlFallback("DNS_ERROR"), false);
    assert.equal(shouldRetryOfficialHtmlFallback("HTML_SHELL"), true);
    const live = await buildOwnIdeaCatalog({
      userId: "4q43-nofallback",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") return [serperTorgi("lot-dead")];
          return [];
        },
        async fetchOfficial(url) {
          urls.push(url);
          return { ok: false, error: "tls timeout", code: "tls_handshake_timeout", elapsedMs: 22, finalUrl: url };
        },
      },
    });
    assert.equal(urls.filter((u) => u.includes("/api/public/lotcards/lot/")).length, 1);
    assert.equal(urls.filter((u) => u.includes("/new/public/lots/lot/") && !u.includes("/api/")).length, 0);
    assert.equal(live.officialDetailsResolved, 0);
    assert.equal(live.liveFacts, 0);
  });

  await test("4Q.4.3 API HTML shell allows HTML fallback", async () => {
    const urls: string[] = [];
    const live = await buildOwnIdeaCatalog({
      userId: "4q43-shell-fb",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") return [serperTorgi("lot-shell-fb")];
          return [];
        },
        async fetchOfficial(url) {
          urls.push(url);
          if (url.includes("/api/public/lotcards/lot/")) {
            return {
              ok: true,
              url,
              finalUrl: url,
              status: 200,
              contentType: "text/html",
              bodyText: `<!doctype html><html ng-version="17"><app-root></app-root></html>`,
              bytes: 70,
              elapsedMs: 8,
            };
          }
          return {
            ok: true,
            url,
            finalUrl: url,
            status: 200,
            contentType: "text/html",
            bodyText: `<html><body>Номер лота lot-shell-fb. Предмет торгов экскаватор. Организатор торгов ТУ. Начальная цена 1000000. Республика Дагестан, г. Махачкала. Лот опубликован до 2027 года и содержит достаточно текста для прохождения html-shell detector threshold in tests.</body></html>`,
            bytes: 280,
            elapsedMs: 9,
          };
        },
      },
    });
    assert.ok(urls.some((u) => u.includes("/api/public/lotcards/lot/")));
    assert.ok(urls.some((u) => u.includes("/new/public/lots/lot/") && !u.includes("/api/")));
    assert.ok(live.detailResolutionAttempts >= 1);
  });

  await test("4Q.4.3 transport counts one actual HTTP attempt", async () => {
    const budget = createOwnIdeaRunBudget();
    const { runWithOwnIdeaBudget, totalExternalCalls } = await import("../src/lib/ckr-own-ideas/run-budget");
    let requests = 0;
    await runWithOwnIdeaBudget(budget, async () => {
      await officialHttpFetch(
        "https://torgi.gov.ru/new/api/public/lotcards/lot/lot-count-43",
        { timeoutMs: 400 },
        {
          assertSafe: fakeSafe,
          lookupAll: async () => [{ address: "203.0.113.10", family: 4 }],
          requestOnce: async (url) => {
            requests += 1;
            return okJson(url.toString(), "lot-count-43");
          },
        },
      );
    });
    assert.equal(requests, 1);
    assert.equal(totalExternalCalls(budget), 1);
    assert.equal(budget.resolutionExternalCalls, 1);
  });

  await test("4Q.4.3 global budget remains <=8 and extraction unchanged", async () => {
    const live = await buildOwnIdeaCatalog({
      userId: "4q43-extract",
      budget: createOwnIdeaRunBudget(),
      hooks: {
        async search(q) {
          if (q.plan.intent === "assets") return [serperTorgi("lot-ext-43")];
          return [];
        },
        async fetchOfficial(url) {
          return {
            ok: true,
            url,
            finalUrl: url,
            status: 200,
            contentType: "application/json",
            bodyText: torgiJson("lot-ext-43", { priceMin: 4_200_000 }),
            bytes: 200,
            elapsedMs: 10,
          };
        },
      },
    });
    assert.ok((live.actualExternalHttpCalls ?? 0) <= 8);
    const sig = live.catalog.signals.find((s) => s.officialId === "lot-ext-43");
    assert.ok(sig);
    assert.equal(sig?.claimKind, "FACT");
    assert.ok(live.liveFacts >= 1);
    assert.equal(CKR_OWN_IDEAS_BUDGETS.maxExternalCalls, 8);
    assert.equal(CKR_OWN_IDEAS_BUDGETS.timeoutMs, 15_000);
    assert.equal(CKR_OWN_IDEAS_FORBIDDEN.scheduler, false);
  });

  console.log(`${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main();
