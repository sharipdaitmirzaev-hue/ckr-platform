/**
 * LIA Opportunity Intelligence — Stage 1 smoke against real modules.
 * Run: npx tsx scripts/test-lia-oi-stage1.ts
 */
import assert from "node:assert/strict";
import { analyzeCandidate } from "../src/lib/lia/oi/analyze";
import { dedupeCandidates } from "../src/lib/lia/oi/dedup";
import { getInternetSearchProvider } from "../src/lib/lia/oi/internet/stub";
import { normalizeHit } from "../src/lib/lia/oi/normalize";
import { buildSearchPlan } from "../src/lib/lia/oi/planner";
import { runOwnerSearchPipeline } from "../src/lib/lia/oi/pipeline";
import { getLiaOiStore, resetLiaOiStoreForTests } from "../src/lib/lia/oi/store";
import { LIA_OI_PROVENANCE_KINDS } from "../src/types/lia-oi";

function ok(name: string) {
  console.log(`  ✓ ${name}`);
}

async function main() {
  console.log("\nLIA OI Stage 1 — smoke & unit checks (real modules)\n");

  if (typeof resetLiaOiStoreForTests === "function") {
    resetLiaOiStoreForTests();
  }

  const smokeQuery = "Инвестор ищет проект до 30 млн рублей по России";

  // 1. Planner
  {
    const plan = buildSearchPlan(smokeQuery);
    assert.equal(plan.intent, "investment_search");
    assert.equal(plan.budgetMax, 30_000_000);
    assert.ok(plan.regions.includes("Россия") || plan.country === "RU");
    assert.ok(plan.queries.length >= 3);
    assert.ok(plan.hypotheses.length >= 3);
    ok("Search Planner: investor / 30M / Russia");
  }

  // 2. Stub provider — explicit stub, no fake live
  {
    const provider = getInternetSearchProvider();
    assert.equal(provider.mode, "stub");
    const hits = await provider.search(smokeQuery, {
      limit: 10,
      budgetMax: 30_000_000,
    });
    assert.ok(hits.length >= 3);
    assert.ok(hits.every((h) => h.isStub === true));
    assert.ok(hits.every((h) => h.title.includes("[STUB]")));
    assert.ok(hits.every((h) => h.url.includes("stub.ckr-center.ru")));
    ok("StubInternetSearchProvider returns only stub-tagged hits");
  }

  // 3. Normalize + provenance
  {
    const provider = getInternetSearchProvider();
    const hits = await provider.search(smokeQuery, { limit: 5 });
    const normalized = hits.map(normalizeHit);
    assert.ok(normalized.every((c) => c.sources.every((s) => s.isStub)));
    assert.ok(normalized.every((c) => c.title.includes("[STUB]")));
    assert.ok(
      normalized.every((c) =>
        (LIA_OI_PROVENANCE_KINDS as readonly string[]).includes(
          c.claims[0]?.kind ?? "UNKNOWN",
        ),
      ),
    );
    const kinds = new Set(normalized.flatMap((c) => c.claims.map((x) => x.kind)));
    assert.ok(kinds.size >= 1);
    ok("Normalization attaches provenance claims");
  }

  // 4. Dedup
  {
    const provider = getInternetSearchProvider();
    const hits = await provider.search("производственная площадка", {
      limit: 20,
    });
    const normalized = hits.map(normalizeHit);
    // force-include known dup pair if present
    const before = normalized.length;
    const after = dedupeCandidates(normalized);
    assert.ok(after.length <= before);
    const urls = after.map((c) => c.sources[0]?.url.split("?")[0]);
    const uniqueUrls = new Set(urls);
    assert.equal(urls.length, uniqueUrls.size, "dedup should collapse utm dups");
    ok("Dedup collapses stub duplicates");
  }

  // 5. Analyze + explainable scoring
  {
    const plan = buildSearchPlan(smokeQuery);
    const provider = getInternetSearchProvider();
    const hits = await provider.search(smokeQuery, {
      limit: 6,
      budgetMax: plan.budgetMax,
    });
    const candidates = dedupeCandidates(hits.map(normalizeHit)).map((c) =>
      analyzeCandidate(c, plan),
    );
    assert.ok(candidates.length >= 2);
    for (const c of candidates) {
      assert.ok(c.score.overall >= 0 && c.score.overall <= 100);
      assert.ok(c.score.confidence >= 0 && c.score.confidence <= 100);
      assert.ok(c.score.explanation.length >= 1);
      assert.ok(c.score.breakdown);
    }
    const under = candidates.find((c) =>
      /28 млн|до 30 млн|under_30m|пищевого производства/i.test(
        `${c.title} ${c.description}`,
      ),
    );
    const over = candidates.find((c) => /55 млн|склад/i.test(c.title));
    if (under && over) {
      assert.ok(
        under.score.overall >= over.score.overall,
        "in-budget should score >= over-budget",
      );
    }
    ok("Analyzer + explainable scoring");
  }

  // 6. Full pipeline smoke
  {
    if (typeof resetLiaOiStoreForTests === "function") {
      resetLiaOiStoreForTests();
    }
    const result = await runOwnerSearchPipeline({
      query: smokeQuery,
      userId: "smoke-test-user",
    });
    assert.equal(result.stubMode, true);
    assert.ok(result.signalsScanned >= 1);
    assert.ok(result.afterDedup >= 1);
    assert.ok(result.candidates.length >= 1);
    assert.ok(result.plan.budgetMax === 30_000_000);
    const store = getLiaOiStore();
    assert.ok(store.candidates.size >= 1);
    assert.ok(store.reports.length >= 1);
    ok(`Smoke E2E: «${smokeQuery}» → ${result.candidates.length} candidates`);
  }

  // 7. Provenance enum
  {
    assert.deepEqual(
      [...LIA_OI_PROVENANCE_KINDS],
      ["FACT", "INFERENCE", "ESTIMATE", "UNKNOWN"],
    );
    ok("Provenance enum FACT/INFERENCE/ESTIMATE/UNKNOWN");
  }

  console.log("\nAll LIA OI Stage 1 checks passed.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
