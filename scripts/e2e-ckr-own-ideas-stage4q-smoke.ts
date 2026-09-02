/**
 * Stage 4Q / 4Q.1 — staging-only E2E for Собственные идеи ЦКР.
 * Persistence + restart + locks. Exact-ID cleanup. Production refused.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isOiLiveConfigured } from "../src/lib/lia/oi/mode";
import { CKR_OWN_IDEAS_BUDGETS, CKR_OWN_IDEAS_SEED_MARKER } from "../src/config/ckr-own-ideas";
import {
  applyOwnerAction,
  buildOwnIdeaCatalog,
  createOwnIdeaRunBudget,
  runOwnIdeaBuilder,
  tractorEarthworksCatalog,
} from "../src/lib/ckr-own-ideas";
import {
  deleteOwnIdeaExact,
  deleteOwnIdeaRunExact,
  ownIdeasAdminClient,
} from "../src/lib/ckr-own-ideas/persist";
import { createSupabaseOwnIdeaStore } from "../src/lib/ckr-own-ideas/supabase-store";
import {
  assertCkrStagingTarget,
  CkrStagingGuardError,
} from "./lib/ckr-staging-guard";

const MANIFEST_PATH = resolve(
  process.env.CKR_E2E_MANIFEST_PATH ||
    "/tmp/cursor/artifacts/e2e-ckr-own-ideas-manifest.json",
);

type Manifest = {
  marker: string;
  ideaIds: string[];
  runId: string | null;
};

function save(m: Manifest) {
  mkdirSync(resolve("/tmp/cursor/artifacts"), { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2));
}

function load(): Manifest | null {
  if (!existsSync(MANIFEST_PATH)) return null;
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
}

async function cleanup(dryRun: boolean) {
  const m = load();
  if (!m) {
    console.log("CLEANUP_SKIPPED_NO_MANIFEST");
    console.log("RESIDUAL_SMOKE_ROWS", 0);
    return;
  }
  const admin = ownIdeasAdminClient();
  console.log("CLEANUP_PLAN", JSON.stringify(m, null, 2));
  if (dryRun) return;
  for (const id of m.ideaIds) await deleteOwnIdeaExact(admin, id);
  if (m.runId) await deleteOwnIdeaRunExact(admin, m.runId);
  const store = createSupabaseOwnIdeaStore(admin);
  let residual = 0;
  for (const id of m.ideaIds) {
    if (await store.get(id)) residual += 1;
  }
  console.log("RESIDUAL_SMOKE_ROWS", residual);
  if (residual !== 0) process.exit(1);
  console.log("CLEANUP_OK");
}

async function runSmoke() {
  const target = assertCkrStagingTarget();
  console.log("STAGING_TARGET_OK", JSON.stringify(target));
  const admin = ownIdeasAdminClient();

  const built = runOwnIdeaBuilder({
    catalog: tractorEarthworksCatalog(),
    marker: CKR_OWN_IDEAS_SEED_MARKER,
  });
  if (built.ideas.length === 0) throw new Error("builder produced no ideas");
  if (built.metrics.autoPublish || built.metrics.autoOutreach) {
    throw new Error("auto action leaked");
  }

  const store1 = createSupabaseOwnIdeaStore(admin);
  await store1.saveRun({
    ...built.metrics,
    persistStatus: "running",
    ideasPersisted: 0,
  });
  for (const idea of built.ideas) await store1.upsert(idea);
  await store1.saveRun({
    ...built.metrics,
    persistStatus: "ok",
    ideasPersisted: built.ideas.length,
  });

  const dbRow = await store1.get(built.ideas[0].id);
  if (!dbRow) throw new Error("DB row missing after create");
  if (dbRow.visibility !== "OWNER_ONLY") throw new Error("privacy leak");

  const store2 = createSupabaseOwnIdeaStore(admin);
  const afterRestart = await store2.get(built.ideas[0].id);
  if (!afterRestart || afterRestart.id !== built.ideas[0].id) {
    throw new Error("idea not visible after store recreate");
  }

  const accepted = applyOwnerAction(afterRestart, "accept");
  await store2.upsert(accepted);

  const store3 = createSupabaseOwnIdeaStore(admin);
  const afterAction = await store3.get(accepted.id);
  if (!afterAction || afterAction.ownerState !== "ACCEPTED") {
    throw new Error("owner action did not persist across restart");
  }

  const locked = {
    ...afterAction,
    title: "OWNER LOCKED TITLE",
    ownerLockedFields: Array.from(new Set([...afterAction.ownerLockedFields, "title"])),
  };
  await store3.upsert(locked);
  const existing = await store3.list();
  const rediscovered = runOwnIdeaBuilder({
    catalog: tractorEarthworksCatalog(),
    existing,
    marker: CKR_OWN_IDEAS_SEED_MARKER,
  });
  for (const idea of rediscovered.ideas) await store3.upsert(idea);

  const store4 = createSupabaseOwnIdeaStore(admin);
  const afterRediscovery = await store4.getByFingerprint(locked.fingerprint);
  if (!afterRediscovery) throw new Error("rediscovery row missing");
  if (afterRediscovery.title !== "OWNER LOCKED TITLE") {
    throw new Error("owner lock lost after rediscovery/restart");
  }
  if (!afterRediscovery.events.some((e) => e.type === "rediscovery_updated")) {
    throw new Error("rediscovery event missing");
  }

  const last = await store4.lastRun();
  if (!last || last.persistStatus !== "ok") throw new Error("run metrics not persisted");

  const liveBudget = createOwnIdeaRunBudget();
  const live = await buildOwnIdeaCatalog({
    userId: "e2e-owner",
    budget: liveBudget,
    hooks: {
      async search(q) {
        if (q.plan.intent === "assets") {
          return [
            {
              id: "e2e-live-asset",
              title: "Экскаватор live torgi.gov.ru",
              isStub: false,
              isCatalogSource: false,
              isOfficialSource: true,
              pageType: "DETAIL",
              canonicalUrl: "https://torgi.gov.ru/new/public/lots/lot/e2e-exc",
              opportunityType: "AUCTION_ASSET",
              sourceClass: "AUCTIONS_ASSETS",
              sourceObjectId: "e2e-exc",
              region: "Дагестан",
              city: "Махачкала",
              industry: "construction",
              askingPrice: 4_200_000,
              auctionStatus: "active",
              address: "Махачкала",
              sources: [
                {
                  id: "e2e-s1",
                  category: "AUCTIONS",
                  name: "torgi.gov.ru",
                  url: "https://torgi.gov.ru/new/public/lots/lot/e2e-exc",
                  isStub: false,
                },
              ],
            } as never,
            {
              id: "e2e-listing-asset",
              title: "Реестр торгов TradeList",
              isStub: false,
              isCatalogSource: false,
              canonicalUrl: "https://bankrot.fedresurs.ru/TradeList.aspx",
              opportunityType: "AUCTION_ASSET",
              region: "Орловская область",
              askingPrice: 1,
            } as never,
          ];
        }
        if (q.plan.intent === "tenders") {
          return [
            {
              id: "e2e-live-demand",
              title: "Закупка земляных работ live",
              isStub: false,
              isCatalogSource: false,
              isOfficialSource: true,
              pageType: "DETAIL",
              canonicalUrl:
                "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0123456789012345678",
              opportunityType: "PROCUREMENT",
              sourceClass: "TENDERS",
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
                  id: "e2e-s2",
                  category: "PROCUREMENT",
                  name: "zakupki.gov.ru",
                  url: "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0123456789012345678",
                  isStub: false,
                },
              ],
            } as never,
            {
              id: "e2e-category-demand",
              title: "тендеры на белье в СКФО",
              isStub: false,
              isCatalogSource: false,
              canonicalUrl: "https://region-tenders.ru/category/belie-skfo",
              opportunityType: "PROCUREMENT",
              region: "СКФО",
              nmck: 100,
            } as never,
          ];
        }
        return [];
      },
    },
  });
  if (live.mode !== "injected") throw new Error("expected injected live catalog");
  if (live.totalExternalCalls > CKR_OWN_IDEAS_BUDGETS.maxExternalCalls) {
    throw new Error(`hard budget exceeded: ${live.totalExternalCalls}`);
  }
  if (live.catalog.signals.some((s) => s.pageType && s.pageType !== "DETAIL" && s.claimKind === "FACT")) {
    throw new Error("listing/category persisted as FACT in catalog");
  }
  if (live.catalog.signals.some((s) => /TradeList|тендеры на белье/i.test(s.title))) {
    throw new Error("listing/category leaked into pairing catalog");
  }

  const liveBuilt = runOwnIdeaBuilder({
    catalog: live.catalog,
    catalogMode: live.mode,
    liveMeta: live,
    budget: liveBudget,
    marker: CKR_OWN_IDEAS_SEED_MARKER,
  });
  if (liveBuilt.ideas.some((i) => /example\.com/i.test(JSON.stringify(i)))) {
    throw new Error("placeholder URL leaked into live ideas");
  }
  if (liveBuilt.metrics.scheduler || liveBuilt.metrics.autoPublish) {
    throw new Error("auto action leaked in live catalog");
  }
  if ((liveBuilt.metrics.totalExternalCalls ?? liveBuilt.metrics.externalCalls) > CKR_OWN_IDEAS_BUDGETS.maxExternalCalls) {
    throw new Error("builder+catalog exceeded hard external budget");
  }
  for (const idea of liveBuilt.ideas) {
    const facts = idea.components.filter((c) => c.provenance.kind === "FACT");
    if (facts.some((c) => c.pageType && c.pageType !== "DETAIL")) {
      throw new Error("listing/category-as-fact in idea");
    }
    if (/бель|underwear|TradeList/i.test(idea.title)) {
      throw new Error("cross-industry garbage idea");
    }
  }

  const garbage = runOwnIdeaBuilder({
    catalog: {
      signals: [
        {
          id: "orel-asset",
          kind: "ASSET",
          title: "Имущество банкрота",
          origin: "EXTERNAL",
          region: "Орловская область",
          industry: null,
          pageType: "LISTING",
          claimKind: "INFERENCE",
          canonicalUrl: "https://bankrot.fedresurs.ru/TradeList.aspx",
        },
        {
          id: "skfo-underwear",
          kind: "DEMAND",
          title: "тендеры на белье в СКФО",
          origin: "EXTERNAL",
          region: "СКФО",
          industry: "textile",
          pageType: "CATEGORY",
          claimKind: "INFERENCE",
        },
      ],
      internalResources: [],
      externalResources: [],
    },
    catalogMode: "injected",
    marker: CKR_OWN_IDEAS_SEED_MARKER,
  });
  if (garbage.ideas.length !== 0) {
    throw new Error("garbage listing/category/cross-region produced ideas");
  }

  for (const idea of liveBuilt.ideas) await store4.upsert(idea);
  await store4.saveRun({
    ...liveBuilt.metrics,
    persistStatus: "ok",
    ideasPersisted: liveBuilt.ideas.length,
  });
  const liveStore = createSupabaseOwnIdeaStore(admin);
  for (const idea of liveBuilt.ideas) {
    const row = await liveStore.get(idea.id);
    if (!row) throw new Error("live injected idea not persisted");
    if (row.visibility !== "OWNER_ONLY") throw new Error("live privacy leak");
  }

  const extraIds: string[] = [];
  let liveSearchUsed = false;
  if (isOiLiveConfigured()) {
    liveSearchUsed = true;
    const realBudget = createOwnIdeaRunBudget();
    const real = await buildOwnIdeaCatalog({ userId: "e2e-owner-live", budget: realBudget });
    if (real.totalExternalCalls > CKR_OWN_IDEAS_BUDGETS.maxExternalCalls) {
      throw new Error("live search exceeded hard external budget");
    }
    if (real.catalog.signals.some((s) => s.claimKind === "FACT" && s.pageType && s.pageType !== "DETAIL")) {
      throw new Error("live search listing/category as FACT");
    }
    const realBuilt = runOwnIdeaBuilder({
      catalog: real.catalog,
      catalogMode: real.mode,
      liveMeta: real,
      budget: realBudget,
      marker: CKR_OWN_IDEAS_SEED_MARKER,
    });
    if (realBuilt.ideas.some((i) => /example\.com/i.test(JSON.stringify(i)))) {
      throw new Error("fixture/example.com in live search ideas");
    }
    for (const idea of realBuilt.ideas) {
      extraIds.push(idea.id);
      await liveStore.upsert(idea);
    }
    console.log("LIVE_SEARCH_USED", {
      mode: real.mode,
      realSignals: real.realSignals,
      liveIdeas: realBuilt.ideas.length,
      totalExternalCalls: realBuilt.metrics.totalExternalCalls,
    });
  } else {
    console.log("LIVE_SEARCH_SKIPPED_NO_SECRETS");
  }

  save({
    marker: CKR_OWN_IDEAS_SEED_MARKER,
    ideaIds: [
      ...built.ideas.map((i) => i.id),
      ...liveBuilt.ideas.map((i) => i.id),
      ...extraIds,
    ],
    runId: liveBuilt.metrics.runId,
  });
  console.log("SMOKE_OK", {
    ideaId: afterRediscovery.id,
    runId: built.metrics.runId,
    rating: afterRediscovery.rating,
    ownerState: afterRediscovery.ownerState,
    restartPersisted: true,
    lockPersisted: afterRediscovery.title === "OWNER LOCKED TITLE",
    missing: afterRediscovery.missing.map((m) => m.kind),
    liveCatalogMode: live.mode,
    liveIdeas: liveBuilt.ideas.length,
    livePersisted: true,
    liveSearchUsed,
    garbageIdeas: garbage.ideas.length,
    totalExternalCalls: liveBuilt.metrics.totalExternalCalls,
    pageTypeSample: live.catalog.signals.map((s) => s.pageType),
  });
}

async function main() {
  if (process.env.CKR_E2E_SMOKE !== "1") {
    console.error("SKIP: set CKR_E2E_SMOKE=1");
    process.exit(2);
  }
  try {
    if (process.env.CKR_E2E_CLEANUP_ONLY === "1") {
      await cleanup(process.env.CKR_E2E_DRY_RUN_CLEANUP === "1");
      return;
    }
    await runSmoke();
    await cleanup(false);
  } catch (e) {
    if (e instanceof CkrStagingGuardError) {
      console.error("STAGING_TARGET_REFUSED", e.code, e.message);
      process.exit(2);
    }
    try {
      await cleanup(false);
    } catch (cleanupErr) {
      console.error("CLEANUP_AFTER_FAILURE", cleanupErr);
    }
    console.error(e);
    process.exit(1);
  }
}

main();
