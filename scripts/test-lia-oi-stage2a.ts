/**
 * LIA OI Stage 2A — mocked Serper / mode / SSRF / pipeline tests.
 * Run: npx tsx scripts/test-lia-oi-stage2a.ts
 * Не требует реального API key.
 */
import assert from "node:assert/strict";
import { WebApiSearchProvider } from "../src/lib/lia/search/providers/web-api";
import { cheapFilterHits } from "../src/lib/lia/oi/filter";
import {
  isBlockedHostname,
  isPrivateOrReservedIp,
  assertSafeUrl,
} from "../src/lib/http/safe-fetch";
import { mapExternalResultToHit } from "../src/lib/lia/oi/internet/live";
import { LiveInternetSearchProvider } from "../src/lib/lia/oi/internet/live";
import { StubInternetSearchProvider } from "../src/lib/lia/oi/internet/stub";
import { getInternetSearchProvider } from "../src/lib/lia/oi/internet";
import {
  isOiLiveConfigured,
  resolveOiSearchMode,
  safeProviderErrorMessage,
} from "../src/lib/lia/oi/mode";
import { normalizeHit } from "../src/lib/lia/oi/normalize";
import { dedupeCandidates } from "../src/lib/lia/oi/dedup";
import { analyzeCandidate } from "../src/lib/lia/oi/analyze";
import { buildSearchPlan } from "../src/lib/lia/oi/planner";
import { runOwnerSearchPipeline } from "../src/lib/lia/oi/pipeline";
import { resetLiaOiStoreForTests } from "../src/lib/lia/oi/store";
import { extractMoneyFromText } from "../src/lib/lia/oi/extract";
import { canAccessOiOwner } from "../src/lib/lia/oi/http";
import type { ExternalSearchResult } from "../src/types/lia";
import type { WebSearchProvider } from "../src/lib/lia/search/types";

function ok(name: string) {
  console.log(`  ✓ ${name}`);
}

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const prev: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    prev[key] = process.env[key];
    const v = vars[key];
    if (v === undefined) delete process.env[key];
    else process.env[key] = v;
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(vars)) {
      if (prev[key] === undefined) delete process.env[key];
      else process.env[key] = prev[key];
    }
  }
}

const MOCK_SERPER_ORGANIC = {
  organic: [
    {
      title: "Продажа готового бизнеса — производство, инвестиции 28 млн рублей, Россия",
      link: "https://example-business.ru/offer/prod-28m",
      snippet:
        "Действующее производство ищет инвестора до 30 млн ₽. Регион: Краснодарский край.",
      date: "2026-08-01",
    },
    {
      title: "Инвестпроект пищевое производство — поиск партнёра",
      link: "https://example-invest.ru/projects/food-25m",
      snippet: "Требуются инвестиции 25 млн рублей по России. Контакт: +7 (900) 111-22-33",
    },
    {
      title: "Склад class B Москва — 55 млн ₽",
      link: "https://example-realty.ru/warehouse-55",
      snippet: "Продажа склада, цена 55 млн рублей.",
    },
    {
      title: "Дубликат производства",
      link: "https://example-business.ru/offer/prod-28m?utm=dup",
      snippet: "Тот же объект производства 28 млн.",
    },
  ],
};

async function main() {
  console.log("\nLIA OI Stage 2A — mocked live path checks\n");

  // 1. Mode: stub without key
  withEnv(
    {
      LIA_WEB_SEARCH_PROVIDER: "mock",
      LIA_WEB_SEARCH_API_KEY: undefined,
      LIA_OI_SEARCH_MODE: "auto",
    },
    () => {
      assert.equal(isOiLiveConfigured(), false);
      assert.equal(resolveOiSearchMode().mode, "stub");
      assert.ok(resolveOiSearchMode().bannerTitle.includes("STUB"));
      ok("Mode: stub when no API key");
    },
  );

  // 2. Mode: live when web_api + key
  withEnv(
    {
      LIA_WEB_SEARCH_PROVIDER: "web_api",
      LIA_WEB_SEARCH_ENGINE: "serper",
      LIA_WEB_SEARCH_API_KEY: "test-key-not-real",
      LIA_OI_SEARCH_MODE: "auto",
    },
    () => {
      assert.equal(isOiLiveConfigured(), true);
      const m = resolveOiSearchMode();
      assert.equal(m.mode, "live");
      assert.ok(m.bannerTitle.includes("LIVE"));
      assert.ok(m.bannerTitle.includes("Serper"));
      ok("Mode: live when web_api + key");
    },
  );

  // 3. Mode: force live without key → stub fallback
  withEnv(
    {
      LIA_WEB_SEARCH_PROVIDER: "web_api",
      LIA_WEB_SEARCH_API_KEY: undefined,
      LIA_OI_SEARCH_MODE: "live",
    },
    () => {
      const m = resolveOiSearchMode();
      assert.equal(m.mode, "stub");
      assert.ok(m.bannerBody.toLowerCase().includes("ключ") || m.reason.includes("fallback"));
      ok("Mode: live requested without key → stub fallback");
    },
  );

  // 4. Provider selection
  withEnv(
    {
      LIA_WEB_SEARCH_PROVIDER: "mock",
      LIA_WEB_SEARCH_API_KEY: undefined,
      LIA_OI_SEARCH_MODE: "stub",
    },
    () => {
      const p = getInternetSearchProvider();
      assert.equal(p.mode, "stub");
      assert.ok(p instanceof StubInternetSearchProvider);
      ok("Provider selection: stub");
    },
  );

  // 5. Search planner → several Russia-wide queries
  {
    const plan = buildSearchPlan(
      "Найди варианты инвестирования до 30 млн рублей по России",
    );
    assert.equal(plan.intent, "investment_search");
    assert.equal(plan.budgetMax, 30_000_000);
    assert.ok(plan.regions.includes("Россия"));
    assert.ok(plan.queries.length >= 3);
    assert.ok(plan.queries.every((q) => /росси/i.test(q)));
    assert.ok(plan.queries.every((q) => !/россия\s+россия|россия\s+рф/i.test(q)));
    ok("Search Planner: several Russia queries");
  }

  // 6. Mocked Serper HTTP → WebApiSearchProvider
  {
    const originalFetch = globalThis.fetch;
    let sawApiKeyHeader = false;
    globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (headers.get("X-API-KEY") === "test-key-not-real") sawApiKeyHeader = true;
      return new Response(JSON.stringify(MOCK_SERPER_ORGANIC), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    try {
      const web = new WebApiSearchProvider({
        apiKey: "test-key-not-real",
        engine: "serper",
      });
      const results = await web.search(
        "Инвестор ищет проект до 30 млн рублей по России",
        { limit: 10 },
      );
      assert.ok(sawApiKeyHeader);
      assert.ok(results.length >= 3);
      assert.ok(results.every((r) => r.url.startsWith("https://")));
      ok("Mocked Serper HTTP response parsed");

      const live = new LiveInternetSearchProvider(web, "Serper");
      const hits = await live.search("инвестиции Россия 30 млн", { limit: 10 });
      assert.equal(live.mode, "live");
      assert.ok(hits.every((h) => h.isStub === false));
      assert.ok(hits.every((h) => Boolean(h.url && h.sourceName)));
      ok("Live adapter maps ExternalSearchResult → InternetSearchHit");
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  // 7. Quota / rate limit error
  {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response("quota", { status: 429 })) as typeof fetch;
    try {
      const web = new WebApiSearchProvider({
        apiKey: "test-key-not-real",
        engine: "serper",
      });
      await assert.rejects(() => web.search("test", { limit: 3 }), /Serper HTTP 429/);
      ok("Quota/rate-limit throws controlled error");
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  // 8. Network error
  {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error("ECONNRESET");
    }) as typeof fetch;
    try {
      const web = new WebApiSearchProvider({
        apiKey: "test-key-not-real",
        engine: "serper",
      });
      await assert.rejects(() => web.search("test", { limit: 1 }), /ECONNRESET/);
      ok("Network error propagates from provider");
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  // 9. Malformed response
  {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ unexpected: true }), {
        status: 200,
      })) as typeof fetch;
    try {
      const web = new WebApiSearchProvider({
        apiKey: "k",
        engine: "serper",
      });
      const results = await web.search("q", { limit: 5 });
      assert.deepEqual(results, []);
      ok("Malformed Serper JSON → empty results");
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  // 10. Normalize + provenance + dedup + score (live path logic)
  {
    const external: ExternalSearchResult[] = MOCK_SERPER_ORGANIC.organic.map(
      (o, i) => ({
        id: `e${i}`,
        title: o.title,
        description: o.snippet,
        url: o.link,
        source: "serper",
        published_at: o.date || "",
        trust_score: 0.5,
        trusted: false as const,
      }),
    );
    const hits = external.map(mapExternalResultToHit);
    // Stage 2A.2: умеренный over-budget не дропаем в cheap filter (→ REJECTED bucket).
    // Абсурдные суммы (>>10× budget) по-прежнему отсекаются.
    const absurd = [
      ...hits,
      {
        ...hits[0],
        id: "absurd",
        title: "Завод 400 млн рублей",
        snippet: "Цена 400 млн рублей",
        askingPrice: 400_000_000,
        investmentRequired: 400_000_000,
        url: "https://example.ru/absurd-400m",
      },
    ];
    const { hits: filtered, stats } = cheapFilterHits(absurd, {
      budgetMax: 30_000_000,
    });
    assert.ok(stats.droppedBudget >= 1, "400млн should drop as absurd over-budget");
    const normalized = filtered.map((h) => normalizeHit(h));
    assert.ok(normalized.every((c) => c.isStub === false));
    assert.ok(
      normalized.every((c) =>
        c.claims.some((x) => x.field === "source_url" && x.kind === "FACT"),
      ),
    );
    const money = extractMoneyFromText("инвестиции 28 млн рублей");
    assert.equal(money?.amount, 28_000_000);
    assert.equal(money?.kind, "FACT");

    const before = normalized.length;
    const deduped = dedupeCandidates(normalized);
    assert.ok(deduped.length < before);
    const plan = buildSearchPlan(
      "Инвестор ищет проект до 30 млн рублей по России",
    );
    const analyzed = deduped.map((c) => analyzeCandidate(c, plan));
    assert.ok(analyzed.every((c) => c.score.explanation.length >= 1));
    assert.ok(analyzed.every((c) => c.sources[0]?.url));
    assert.ok(analyzed.every((c) => c.sources[0]?.discoveredAt || c.firstSeenAt));
    ok("normalize / dedup / provenance / scoring on mock live hits");
  }

  // 11. SSRF protection
  {
    assert.equal(isPrivateOrReservedIp("127.0.0.1"), true);
    assert.equal(isPrivateOrReservedIp("10.0.0.5"), true);
    assert.equal(isPrivateOrReservedIp("192.168.1.1"), true);
    assert.equal(isPrivateOrReservedIp("8.8.8.8"), false);
    assert.equal(isBlockedHostname("localhost"), true);
    assert.equal(isBlockedHostname("169.254.169.254"), true);
    const blocked = await assertSafeUrl("http://127.0.0.1/secret");
    assert.equal("ok" in blocked && blocked.ok === false, true);
    const badProto = await assertSafeUrl("file:///etc/passwd");
    assert.equal("ok" in badProto && badProto.ok === false, true);
    ok("SSRF: localhost / private IP / bad protocol blocked");
  }

  // 12. API key redaction in errors
  {
    process.env.LIA_WEB_SEARCH_API_KEY = "super-secret-key-xyz";
    const msg = safeProviderErrorMessage(
      new Error("failed with super-secret-key-xyz in body"),
    );
    assert.ok(!msg.includes("super-secret-key-xyz"));
    assert.ok(msg.includes("[REDACTED]"));
    delete process.env.LIA_WEB_SEARCH_API_KEY;
    ok("API key redacted in safeProviderErrorMessage");
  }

  // 13. Smoke live-path pipeline with mock WebSearchProvider (no real Serper)
  {
    resetLiaOiStoreForTests();
    const mockWeb: WebSearchProvider = {
      id: "web-api",
      label: "Mock Serper for test",
      kind: "external",
      async search(query: string) {
        return MOCK_SERPER_ORGANIC.organic.map((o, i) => ({
          id: `m${i}-${query.slice(0, 8)}`,
          title: o.title,
          description: `${o.snippet} (q=${query.slice(0, 20)})`,
          url: o.link,
          source: "serper",
          published_at: o.date || "",
          trust_score: 0.5,
          trusted: false as const,
          query,
        }));
      },
    };

    // Patch getInternetSearchProvider path by forcing live mode + injecting via direct pipeline pieces
    withEnv(
      {
        LIA_WEB_SEARCH_PROVIDER: "web_api",
        LIA_WEB_SEARCH_API_KEY: "test-key-not-real",
        LIA_WEB_SEARCH_ENGINE: "serper",
        LIA_OI_SEARCH_MODE: "live",
      },
      () => {
        assert.equal(resolveOiSearchMode().mode, "live");
      },
    );

    // Direct adapter smoke (pipeline uses factory; here we validate end logic)
    const live = new LiveInternetSearchProvider(mockWeb, "Serper");
    const plan = buildSearchPlan(
      "Инвестор ищет проект до 30 млн рублей по России",
    );
    const hitChunks = await Promise.all(
      plan.queries.slice(0, 3).map((q) => live.search(q, { limit: 5 })),
    );
    const raw = hitChunks.flat();
    const { hits } = cheapFilterHits(raw, { budgetMax: plan.budgetMax });
    const analyzed = dedupeCandidates(hits.map((h) => normalizeHit(h)))
      .slice(0, 8)
      .map((c) => analyzeCandidate(c, plan));
    assert.ok(analyzed.length >= 1);
    assert.ok(analyzed.every((c) => !c.isStub));
    assert.ok(analyzed.every((c) => c.sources[0]?.url.includes("example-")));
    ok(
      "Smoke live-path: «Инвестор ищет проект до 30 млн рублей по России» (mock Serper)",
    );
  }

  // 14. Pipeline stub still works
  {
    resetLiaOiStoreForTests();
    const prevProvider = process.env.LIA_WEB_SEARCH_PROVIDER;
    const prevKey = process.env.LIA_WEB_SEARCH_API_KEY;
    const prevMode = process.env.LIA_OI_SEARCH_MODE;
    process.env.LIA_WEB_SEARCH_PROVIDER = "mock";
    delete process.env.LIA_WEB_SEARCH_API_KEY;
    process.env.LIA_OI_SEARCH_MODE = "stub";
    try {
      const result = await runOwnerSearchPipeline({
        query: "Инвестор ищет проект до 30 млн рублей по России",
        userId: "test-owner",
      });
      assert.equal(result.searchMode, "stub");
      assert.equal(result.stubMode, true);
      assert.ok(result.candidates.length >= 1);
      ok("Pipeline stub path still works");
    } finally {
      if (prevProvider === undefined) delete process.env.LIA_WEB_SEARCH_PROVIDER;
      else process.env.LIA_WEB_SEARCH_PROVIDER = prevProvider;
      if (prevKey === undefined) delete process.env.LIA_WEB_SEARCH_API_KEY;
      else process.env.LIA_WEB_SEARCH_API_KEY = prevKey;
      if (prevMode === undefined) delete process.env.LIA_OI_SEARCH_MODE;
      else process.env.LIA_OI_SEARCH_MODE = prevMode;
    }
  }

  // 15. Live pipeline with failing fetch → providerUnavailable, no throw
  {
    resetLiaOiStoreForTests();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response("nope", { status: 503 })) as typeof fetch;
    process.env.LIA_WEB_SEARCH_PROVIDER = "web_api";
    process.env.LIA_WEB_SEARCH_API_KEY = "test-key-not-real";
    process.env.LIA_WEB_SEARCH_ENGINE = "serper";
    process.env.LIA_OI_SEARCH_MODE = "live";
    try {
      const result = await runOwnerSearchPipeline({
        query: "Инвестор ищет проект до 30 млн рублей по России",
        userId: "test-owner",
      });
      assert.equal(result.searchMode, "live");
      assert.equal(result.providerUnavailable, true);
      assert.ok(result.ownerMessage);
      assert.ok(!JSON.stringify(result).includes("test-key-not-real"));
      ok("Live provider failure → owner message, no crash, no key leak");
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.LIA_WEB_SEARCH_API_KEY;
      process.env.LIA_WEB_SEARCH_PROVIDER = "mock";
      process.env.LIA_OI_SEARCH_MODE = "stub";
    }
  }

  // 16. Owner authorization
  {
    assert.equal(canAccessOiOwner(["admin"]), true);
    assert.equal(canAccessOiOwner(["admin", "investor"]), true);
    assert.equal(canAccessOiOwner(["investor"]), false);
    assert.equal(canAccessOiOwner([]), false);
    ok("Owner authorization: admin only (OWNER role later)");
  }

  console.log("\nAll LIA OI Stage 2A checks passed.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
