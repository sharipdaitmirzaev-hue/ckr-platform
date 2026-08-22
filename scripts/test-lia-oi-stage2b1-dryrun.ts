/**
 * Stage 2B.1 — integration dry-run against isolated local PostgREST+Postgres.
 * Does NOT touch production. Requires:
 *   - DB lia_oi_dryrun on 127.0.0.1:5432
 *   - PostgREST on 127.0.0.1:54321
 *
 * Run:
 *   npx tsx scripts/test-lia-oi-stage2b1-dryrun.ts
 *   npx tsx scripts/test-lia-oi-stage2b1-dryrun.ts --restart-check
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { applyFeedback, createAssignment } from "../src/lib/lia/oi/actions-core";
import { buildOpportunityFingerprint } from "../src/lib/lia/oi/fingerprint";
import { oiId } from "../src/lib/lia/oi/id";
import { emptyScore } from "../src/lib/lia/oi/score";
import {
  LiaOiStoreWriteError,
  setOiStoreForTests,
} from "../src/lib/lia/oi/store";
import { SupabaseLiaOiStore } from "../src/lib/lia/oi/store/supabase";
import { createClient } from "@supabase/supabase-js";
import type { LiaOiCandidate } from "../src/types/lia-oi";

const JWT_SECRET =
  "super-secret-jwt-token-with-at-least-32-characters-long";
// 54322 = tiny proxy mapping /rest/v1 → PostgREST :54321 (supabase-js path)
const REST_URL = process.env.LIA_OI_DRYRUN_URL || "http://127.0.0.1:54322";
const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const STATE_FILE = "/tmp/lia-oi-dryrun-state.json";

function ok(name: string) {
  console.log(`  ✓ ${name}`);
}

function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function makeJwt(role: "service_role" | "anon" | "authenticated", sub?: string) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({
      role,
      iss: "supabase",
      iat: now,
      exp: now + 60 * 60,
      ...(sub ? { sub } : {}),
    }),
  );
  const data = `${header}.${payload}`;
  const sig = createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${sig}`;
}

function makeStore() {
  const key = makeJwt("service_role");
  const db = createClient(REST_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return new SupabaseLiaOiStore(db);
}

function baseCandidate(over: Partial<LiaOiCandidate> = {}): LiaOiCandidate {
  const id = over.id ?? oiId("cand");
  const url =
    over.sources?.[0]?.url ?? "https://example-business.ru/offer/cafe-25m";
  const c: LiaOiCandidate = {
    id,
    type: "web_opportunity",
    title: over.title ?? "Продаётся кафе — 25 млн, Казань",
    description: over.description ?? "Действующее кафе, цена 25 млн ₽",
    summary: "stub",
    whyInteresting: ["цена"],
    recommendation: "посмотреть",
    nextStep: "звонок",
    status: "NEW",
    country: "RU",
    region: "Татарстан",
    city: "Казань",
    askingPrice: over.askingPrice ?? 25_000_000,
    investmentRequired: null,
    sources: over.sources ?? [
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
      overall: 75,
      confidence: 60,
      relevance: 70,
      quality: 70,
      opportunity: 80,
      priority: "HIGH_PRIORITY",
      whyTop: ["бюджет"],
    },
    matchHints: [],
    firstSeenAt: over.firstSeenAt ?? new Date().toISOString(),
    lastSeenAt: over.lastSeenAt ?? new Date().toISOString(),
    canonicalKey: "cafe-25m",
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
  c.fingerprint = over.fingerprint ?? buildOpportunityFingerprint(c);
  return c;
}

async function rlsSmoke() {
  const anon = createClient(REST_URL, makeJwt("anon"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const hasErr = (e: { message?: string } | null) =>
    Boolean(e && (e.message || Object.keys(e).length > 0) && e.message);

  const anonRes = await anon.from("lia_oi_opportunities").select("id");
  assert.ok(!hasErr(anonRes.error), anonRes.error?.message);
  assert.equal((anonRes.data ?? []).length, 0, "anon must not see OI rows");

  const user = createClient(
    REST_URL,
    makeJwt("authenticated", "22222222-2222-4222-8222-222222222222"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const userRes = await user.from("lia_oi_opportunities").select("id");
  assert.ok(!hasErr(userRes.error), userRes.error?.message);
  assert.equal((userRes.data ?? []).length, 0, "non-admin must not see OI rows");

  // seed a row via service role so admin SELECT can be verified
  const service = createClient(REST_URL, makeJwt("service_role"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await service.from("lia_oi_opportunities").upsert({
    id: "cand-rls-probe",
    title: "RLS probe",
    description: "x",
    status: "NEW",
    canonical_key: "rls-probe",
    fingerprint: "fp-rls-probe",
  });

  const admin = createClient(
    REST_URL,
    makeJwt("authenticated", ADMIN_ID),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const adminRead = await admin.from("lia_oi_opportunities").select("id");
  assert.ok(!hasErr(adminRead.error), adminRead.error?.message);
  assert.ok(
    (adminRead.data ?? []).some((r) => r.id === "cand-rls-probe"),
    "admin must see OI rows",
  );

  const { error: adminWriteErr } = await admin.from("lia_oi_reports").upsert({
    id: "rep-http-rls",
    kind: "search_result",
    title: "admin write",
    body: "ok",
    stats: {},
    candidate_ids: [],
    stub_mode: true,
  });
  assert.ok(!hasErr(adminWriteErr), adminWriteErr?.message);

  // non-admin still cannot see seeded row
  const userAfter = await user.from("lia_oi_opportunities").select("id");
  assert.equal((userAfter.data ?? []).length, 0, "non-admin still denied");
  ok("RLS via PostgREST: anon/non-admin denied, admin read/write OK");
}

async function mainCycle() {
  const store = makeStore();
  setOiStoreForTests(store);

  const firstSeen = new Date().toISOString();
  const a = baseCandidate({
    id: "cand-dryrun-cafe",
    askingPrice: 25_000_000,
    firstSeenAt: firstSeen,
    lastSeenAt: firstSeen,
  });

  // search run first (FK for run↔candidate links)
  await store.saveSearchRequest({
    id: "run-1",
    query: "Найди бизнес до 30 млн по России",
    plan: {
      id: "plan-1",
      rawQuery: "Найди бизнес до 30 млн по России",
      intent: "business_opportunities",
      country: "RU",
      regions: ["Россия"],
      industries: [],
      assetTypes: [],
      budgetMax: 30_000_000,
      hypotheses: ["готовые бизнесы"],
      queries: ["бизнес до 30 млн Россия", "продажа бизнеса Россия"],
      createdAt: firstSeen,
    },
    createdAt: firstSeen,
    createdBy: ADMIN_ID,
    candidateIds: [a.id],
    stubMode: true,
    searchMode: "stub",
    providerLabel: "StubInternetSearchProvider",
    durationMs: 1234,
    stats: {
      queriesRun: 2,
      signalsRaw: 20,
      filteredOut: 5,
      duplicatesRemoved: 3,
      afterDedup: 12,
      analyzed: 12,
      providerErrors: 0,
      providerUnavailable: false,
      topOpportunities: 1,
      rejected: 4,
    },
  });
  ok("search run saved with plan/stats/provider/stub");

  const created = await store.upsertCandidates([a], { searchRunId: "run-1" });
  assert.equal(created.createdIds.length, 1);
  assert.equal(created.updatedIds.length, 0);

  // rediscovery with price drop + SAVE lock later
  const later = new Date(Date.now() + 1000).toISOString();
  const again = baseCandidate({
    id: oiId("other"),
    title: "Продаётся кафе — 21 млн, Казань",
    description: "Цена снижена до 21 млн ₽",
    askingPrice: 21_000_000,
    lastSeenAt: later,
    fingerprint: a.fingerprint,
    sources: [
      ...a.sources,
      {
        id: oiId("src2"),
        category: "BUSINESS",
        name: "mirror.example",
        url: "https://mirror.example/offer/cafe-25m",
        isStub: false,
      },
    ],
  });
  // keep same primary source URL for fingerprint stability
  again.sources[0] = a.sources[0];
  again.fingerprint = a.fingerprint;

  await store.saveSearchRequest({
    id: "run-2",
    query: "Найди бизнес до 30 млн по России",
    plan: {
      id: "plan-2",
      rawQuery: "Найди бизнес до 30 млн по России",
      intent: "business_opportunities",
      country: "RU",
      regions: ["Россия"],
      industries: [],
      assetTypes: [],
      hypotheses: [],
      queries: ["q"],
      createdAt: later,
    },
    createdAt: later,
    createdBy: ADMIN_ID,
    candidateIds: [a.id],
    stubMode: true,
    searchMode: "stub",
    providerLabel: "StubInternetSearchProvider",
    stats: {
      queriesRun: 1,
      signalsRaw: 5,
      filteredOut: 0,
      duplicatesRemoved: 0,
      afterDedup: 5,
      analyzed: 5,
      providerErrors: 0,
      providerUnavailable: false,
      topOpportunities: 1,
      rejected: 0,
    },
  });

  const updated = await store.upsertCandidates([again], {
    searchRunId: "run-2",
  });
  assert.equal(updated.createdIds.length, 0);
  assert.equal(updated.updatedIds.length, 1);
  assert.ok(updated.changes.some((c) => c.fieldName === "askingPrice"));

  const got = await store.getCandidate(a.id);
  assert.ok(got);
  assert.equal(got!.askingPrice, 21_000_000);
  assert.equal(
    new Date(got!.firstSeenAt).getTime(),
    new Date(firstSeen).getTime(),
  );
  assert.ok(new Date(got!.lastSeenAt).getTime() >= new Date(firstSeen).getTime());
  assert.ok(got!.sources.length >= 2, "sources merged");

  const changes = await store.listOpportunityChanges(a.id);
  assert.ok(changes.some((c) => c.fieldName === "askingPrice"));
  const events = await store.listOpportunityEvents(a.id);
  assert.ok(events.some((e) => e.eventType === "FIRST_SEEN"));
  assert.ok(events.some((e) => e.eventType === "REDISCOVERY"));
  ok("rediscovery / dedup / last_seen / change tracking / sources merge");

  // owner SAVE then rediscovery must not reset
  await applyFeedback({
    candidateId: a.id,
    event: "SAVE",
    reason: "интересная локация",
    userId: ADMIN_ID,
  });
  let locked = await store.getCandidate(a.id);
  assert.equal(locked!.status, "SAVED");
  assert.equal(locked!.ownerLocked, true);

  await store.saveSearchRequest({
    id: "run-3",
    query: "повтор",
    plan: {
      id: "plan-3",
      rawQuery: "повтор",
      intent: "business_opportunities",
      country: "RU",
      regions: ["Россия"],
      industries: [],
      assetTypes: [],
      hypotheses: [],
      queries: ["повтор"],
      createdAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    createdBy: ADMIN_ID,
    candidateIds: [a.id],
    stubMode: true,
    searchMode: "stub",
  });
  await store.upsertCandidates([
    baseCandidate({
      id: oiId("r3"),
      status: "NEW",
      askingPrice: 20_000_000,
      fingerprint: a.fingerprint,
      sources: a.sources,
      lastSeenAt: new Date().toISOString(),
    }),
  ], { searchRunId: "run-3" });
  locked = await store.getCandidate(a.id);
  assert.equal(locked!.status, "SAVED", "owner lock must survive rediscovery");
  assert.equal(locked!.askingPrice, 20_000_000, "price still updates");
  ok("owner-lock: SAVE survives rediscovery; price still updates");

  // INTERESTED / REJECT variants on fresh objects
  const b = baseCandidate({
    id: "cand-reject-me",
    title: "Объект reject",
    sources: [
      {
        id: oiId("s"),
        category: "BUSINESS",
        name: "x",
        url: "https://example.ru/offer/reject-1",
        isStub: false,
      },
    ],
  });
  await store.upsertCandidates([b]);
  await applyFeedback({
    candidateId: b.id,
    event: "REJECT",
    reason: "далеко",
    userId: ADMIN_ID,
  });
  await store.upsertCandidates([
    baseCandidate({
      id: oiId("r4"),
      status: "NEW",
      fingerprint: b.fingerprint,
      sources: b.sources,
    }),
  ]);
  const rejected = await store.getCandidate(b.id);
  assert.equal(rejected!.status, "REJECTED");
  ok("owner-lock: REJECT survives rediscovery");

  const asg = await createAssignment({
    candidateId: a.id,
    kind: "DEEP_CHECK",
    instruction: "Проверить юрлицо",
    userId: ADMIN_ID,
  });
  assert.equal(asg.status, "COMPLETED");
  const asgs = await store.listAssignments();
  assert.ok(asgs.items.some((x) => x.id === asg.id));
  ok("assignment persisted");

  await store.addReport({
    id: "rep-dryrun-1",
    kind: "daily_digest",
    title: "Дайджест dry-run",
    body: "persistent",
    stats: { n: 1 },
    candidateIds: [a.id],
    createdAt: new Date().toISOString(),
    stubMode: true,
  });
  const reps = await store.listReports();
  assert.ok(reps.items.some((r) => r.id === "rep-dryrun-1"));
  ok("report persisted");

  const fb = await store.listFeedback({ candidateId: a.id });
  assert.ok(fb.total >= 1);
  ok("feedback persisted");

  // pagination
  for (let i = 0; i < 15; i++) {
    await store.upsertCandidates([
      baseCandidate({
        id: `cand-page-${i}`,
        title: `Page object ${i}`,
        sources: [
          {
            id: `src-page-${i}`,
            category: "BUSINESS",
            name: "p",
            url: `https://example.ru/offer/page-${i}`,
            isStub: false,
          },
        ],
      }),
    ]);
  }
  const page1 = await store.listCandidates({ page: 1, pageSize: 10 });
  const page2 = await store.listCandidates({ page: 2, pageSize: 10 });
  assert.equal(page1.items.length, 10);
  assert.ok(page2.items.length >= 1);
  assert.ok(page1.total >= 15);
  const savedPage = await store.listCandidates({ savedOnly: true, pageSize: 50 });
  assert.ok(savedPage.items.some((c) => c.id === a.id));
  ok("pagination + saved filter");

  const hist = await store.listSearchRequests();
  assert.ok(hist.items.some((r) => r.id === "run-1"));
  const run = await store.getSearchRequest("run-1");
  assert.ok(run);
  assert.equal(run!.query, "Найди бизнес до 30 млн по России");
  assert.equal(run!.stats?.queriesRun, 2);
  assert.equal(run!.searchMode, "stub");
  ok("search history readable");

  // failed write surfaces
  const broken = new SupabaseLiaOiStore({
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
          error: { message: "boom" },
        }),
      };
    },
  } as never);
  await assert.rejects(
    () => broken.getCandidate("x"),
    (e: unknown) => e instanceof LiaOiStoreWriteError,
  );
  ok("no silent fallback on store error");

  // persist ids for restart check
  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    STATE_FILE,
    JSON.stringify({
      opportunityId: a.id,
      reportId: "rep-dryrun-1",
      assignmentId: asg.id,
      searchRunId: "run-1",
      fingerprint: a.fingerprint,
    }),
  );
  ok(`state written to ${STATE_FILE}`);
}

async function restartCheck() {
  const { readFileSync, existsSync } = await import("node:fs");
  assert.ok(existsSync(STATE_FILE), "run main cycle first");
  const state = JSON.parse(readFileSync(STATE_FILE, "utf8")) as {
    opportunityId: string;
    reportId: string;
    assignmentId: string;
    searchRunId: string;
  };
  const store = makeStore();
  const opp = await store.getCandidate(state.opportunityId);
  assert.ok(opp, "opportunity survived process restart");
  // SAVE then DEEP_CHECK assignment → DEEP_RESEARCH (owner-locked)
  assert.ok(
    ["SAVED", "DEEP_RESEARCH", "INTERESTING", "REJECTED"].includes(opp!.status),
    `unexpected status after restart: ${opp!.status}`,
  );
  assert.equal(opp!.ownerLocked, true);
  const reps = await store.listReports();
  assert.ok(reps.items.some((r) => r.id === state.reportId));
  const asgs = await store.listAssignments();
  assert.ok(asgs.items.some((a) => a.id === state.assignmentId));
  const fb = await store.listFeedback({ candidateId: state.opportunityId });
  assert.ok(fb.total >= 1);
  const run = await store.getSearchRequest(state.searchRunId);
  assert.ok(run);
  assert.equal(run!.query, "Найди бизнес до 30 млн по России");
  ok("restart persistence: opportunities/reports/assignments/feedback/search");
}

async function main() {
  console.log("\nLIA OI Stage 2B.1 — isolated dry-run integration\n");
  console.log(`  REST: ${REST_URL}`);

  if (process.argv.includes("--restart-check")) {
    await restartCheck();
  } else {
    await rlsSmoke();
    await mainCycle();
  }
  console.log("\nAll Stage 2B.1 dry-run checks passed.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
