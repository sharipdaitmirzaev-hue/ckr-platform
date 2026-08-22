/**
 * LIA OI Stage 2B — persistence (memory store + identity + no silent fallback).
 * Does not require production Supabase.
 */
import assert from "node:assert/strict";
import { applyFeedback, createAssignment } from "../src/lib/lia/oi/actions-core";
import { buildOpportunityFingerprint } from "../src/lib/lia/oi/fingerprint";
import { oiId } from "../src/lib/lia/oi/id";
import { emptyScore } from "../src/lib/lia/oi/score";
import {
  InMemoryLiaOiStore,
  LiaOiStoreWriteError,
  resetMemoryStoreForTests,
  resolveOiStoreMode,
  setOiStoreForTests,
  upsertCandidates,
  listAssignments,
} from "../src/lib/lia/oi/store";
import { SupabaseLiaOiStore } from "../src/lib/lia/oi/store/supabase";
import type { LiaOiCandidate } from "../src/types/lia-oi";

function ok(name: string) {
  console.log(`  ✓ ${name}`);
}

function baseCandidate(over: Partial<LiaOiCandidate> = {}): LiaOiCandidate {
  const id = over.id ?? oiId("cand");
  const title = over.title ?? "Продаётся кафе — 12 млн, Казань";
  const url =
    over.sources?.[0]?.url ?? "https://example-business.ru/offer/cafe-12m";
  const c: LiaOiCandidate = {
    id,
    type: "web_opportunity",
    title,
    description: "Действующее кафе, цена 12 млн ₽",
    summary: "",
    whyInteresting: [],
    recommendation: "",
    nextStep: "",
    status: "NEW",
    country: "RU",
    region: "Татарстан",
    city: "Казань",
    askingPrice: 12_000_000,
    investmentRequired: null,
    sources: [
      {
        id: oiId("src"),
        category: "BUSINESS",
        name: "example-business.ru",
        url,
        isStub: false,
        discoveredAt: new Date().toISOString(),
      },
    ],
    claims: [],
    risks: [],
    unknowns: [],
    toVerify: [],
    score: {
      ...emptyScore(),
      overall: 70,
      confidence: 60,
      relevance: 65,
      quality: 70,
      opportunity: 72,
      priority: "INTERESTING",
    },
    matchHints: [],
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    canonicalKey: "k1",
    rawStubIds: [],
    isStub: false,
    pageType: "DETAIL",
    isCatalogSource: false,
    contentIntent: "OPPORTUNITY",
    budgetFit: "FIT",
    priceStatus: "KNOWN",
    priceKind: "ASKING_PRICE",
    detailConfidence: 70,
    resultBucket: "TOP_OPPORTUNITIES",
    contactPhone: "+7 843 111-22-33",
    ...over,
  };
  c.fingerprint = buildOpportunityFingerprint(c);
  return c;
}

async function main() {
  console.log("\nLIA OI Stage 2B — persistence checks\n");

  {
    resetMemoryStoreForTests();
    setOiStoreForTests(null);
    process.env.LIA_OI_STORE = "memory";
    assert.equal(resolveOiStoreMode(), "memory");
    ok("Store mode defaults to memory");
  }

  {
    resetMemoryStoreForTests();
    const store = new InMemoryLiaOiStore();
    setOiStoreForTests(store);

    const a = baseCandidate();
    const created = await store.upsertCandidates([a], { searchRunId: "run1" });
    assert.equal(created.createdIds.length, 1);
    assert.equal(created.updatedIds.length, 0);

    const again = baseCandidate({
      id: oiId("cand"),
      title: "Продаётся кафе — 12 млн, Казань (обновлено)",
      askingPrice: 11_000_000,
      description: "Цена снижена до 11 млн ₽",
      lastSeenAt: new Date().toISOString(),
    });
    again.fingerprint = a.fingerprint;
    again.sources = a.sources;

    const updated = await store.upsertCandidates([again], {
      searchRunId: "run2",
    });
    assert.equal(updated.createdIds.length, 0);
    assert.equal(updated.updatedIds.length, 1);
    assert.ok(updated.changes.some((c) => c.fieldName === "askingPrice"));

    const got = await store.getCandidate(a.id);
    assert.ok(got);
    assert.equal(got!.askingPrice, 11_000_000);
    assert.equal(got!.firstSeenAt, a.firstSeenAt);
    assert.ok(got!.lastSeenAt >= a.lastSeenAt);

    const events = await store.listOpportunityEvents(a.id);
    assert.ok(events.some((e) => e.eventType === "FIRST_SEEN"));
    assert.ok(events.some((e) => e.eventType === "REDISCOVERY"));
    ok("create / rediscovery / fingerprint / last_seen / change tracking");
  }

  {
    resetMemoryStoreForTests();
    const store = new InMemoryLiaOiStore();
    setOiStoreForTests(store);
    const c = baseCandidate();
    await store.upsertCandidates([c]);

    await applyFeedback({
      candidateId: c.id,
      event: "SAVE",
      userId: "00000000-0000-4000-8000-000000000001",
    });
    const saved = await store.getCandidate(c.id);
    assert.equal(saved!.status, "SAVED");
    assert.equal(saved!.ownerLocked, true);

    const rediscovered = baseCandidate({
      id: oiId("other"),
      status: "NEW",
      title: c.title,
    });
    rediscovered.fingerprint = c.fingerprint;
    rediscovered.sources = c.sources;
    await store.upsertCandidates([rediscovered]);
    const after = await store.getCandidate(c.id);
    assert.equal(after!.status, "SAVED", "owner decision must survive rediscovery");
    ok("owner decision preserved on rediscovery");
  }

  {
    resetMemoryStoreForTests();
    setOiStoreForTests(new InMemoryLiaOiStore());
    const c = baseCandidate();
    await upsertCandidates([c]);
    const asg = await createAssignment({
      candidateId: c.id,
      kind: "DEEP_CHECK",
      instruction: "Проверить юридически",
      userId: "00000000-0000-4000-8000-000000000001",
    });
    assert.equal(asg.status, "COMPLETED");
    const list = await listAssignments();
    assert.ok(list.some((a) => a.id === asg.id));
    ok("assignments persistent in memory store");
  }

  {
    resetMemoryStoreForTests();
    const store = new InMemoryLiaOiStore();
    setOiStoreForTests(store);
    await store.saveSearchRequest({
      id: "run-hist",
      query: "тест",
      plan: {
        id: "p1",
        rawQuery: "тест",
        intent: "business_opportunities",
        country: "RU",
        regions: ["Россия"],
        industries: [],
        assetTypes: [],
        hypotheses: [],
        queries: ["q1"],
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      createdBy: "u1",
      candidateIds: [],
      stubMode: true,
      searchMode: "stub",
      stats: {
        queriesRun: 1,
        signalsRaw: 2,
        filteredOut: 0,
        duplicatesRemoved: 0,
        afterDedup: 2,
        analyzed: 2,
        providerErrors: 0,
        providerUnavailable: false,
        topOpportunities: 1,
        rejected: 0,
      },
    });
    await store.addReport({
      id: oiId("rep"),
      kind: "search_result",
      title: "Отчёт",
      body: "ok",
      stats: { n: 1 },
      candidateIds: [],
      createdAt: new Date().toISOString(),
      stubMode: true,
    });
    const hist = await store.listSearchRequests();
    assert.equal(hist.total, 1);
    const reps = await store.listReports();
    assert.equal(reps.total, 1);
    ok("search history + reports persistence");
  }

  {
    resetMemoryStoreForTests();
    const store = new InMemoryLiaOiStore();
    for (let i = 0; i < 25; i++) {
      await store.upsertCandidates([
        baseCandidate({
          id: oiId("p"),
          title: `Объект ${i}`,
          sources: [
            {
              id: oiId("s"),
              category: "BUSINESS",
              name: "x",
              url: `https://example.ru/offer/${i}`,
              isStub: false,
            },
          ],
        }),
      ]);
    }
    const page1 = await store.listCandidates({ page: 1, pageSize: 10 });
    const page2 = await store.listCandidates({ page: 2, pageSize: 10 });
    assert.equal(page1.items.length, 10);
    assert.equal(page2.items.length, 10);
    assert.ok(page1.total >= 25);
    assert.ok(page1.totalPages >= 3);
    ok("pagination");
  }

  {
    const broken = {
      from() {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          maybeSingle: async () => ({
            data: null,
            error: { message: "relation missing" },
          }),
          upsert: async () => ({ error: { message: "write denied" } }),
          insert: async () => ({ error: { message: "write denied" } }),
          delete() {
            return this;
          },
          update() {
            return this;
          },
          order() {
            return this;
          },
          range: async () => ({ data: [], error: null, count: 0 }),
        };
      },
    };

    const store = new SupabaseLiaOiStore(broken as never);
    let threw = false;
    try {
      await store.getCandidate("x");
    } catch (e) {
      threw = e instanceof LiaOiStoreWriteError;
    }
    assert.ok(threw, "Supabase read/write errors must surface");
    ok("no silent fallback on supabase write/read failure");
  }

  {
    process.env.LIA_OI_STORE = "supabase";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SECRET_KEY;
    let threw = false;
    try {
      resolveOiStoreMode();
    } catch {
      threw = true;
    }
    assert.ok(threw, "supabase mode without key must throw");
    process.env.LIA_OI_STORE = "memory";
    ok("misconfigured supabase mode fails loudly");
  }

  {
    resetMemoryStoreForTests();
    const store = new InMemoryLiaOiStore();
    setOiStoreForTests(store);
    const c = baseCandidate();
    await store.upsertCandidates([c]);
    await applyFeedback({
      candidateId: c.id,
      event: "INTERESTED",
      reason: "нравятся цифры",
      userId: "00000000-0000-4000-8000-000000000001",
    });
    const fb = await store.listFeedback({ candidateId: c.id });
    assert.equal(fb.total, 1);
    assert.equal(fb.items[0].event, "INTERESTED");
    const events = await store.listOpportunityEvents(c.id);
    assert.ok(events.some((e) => e.eventType === "OWNER_FEEDBACK"));
    ok("feedback persistence + owner timeline");
  }

  console.log("\nAll LIA OI Stage 2B checks passed.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
