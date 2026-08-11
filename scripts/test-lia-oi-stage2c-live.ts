/**
 * Stage 2C live/fixture smoke per connected source.
 * Default: stub/fixture (safe). Pass --live to use Serper site-restricted discovery.
 *
 * Usage:
 *   npx tsx scripts/test-lia-oi-stage2c-live.ts
 *   npx tsx scripts/test-lia-oi-stage2c-live.ts --live
 */
import { runMatchingSourceAdapters } from "../src/lib/lia/oi/sources/registry";
import { buildSearchPlan } from "../src/lib/lia/oi/planner";
import { runOwnerSearchPipeline } from "../src/lib/lia/oi/pipeline";
import { listCandidates, resetLiaOiStoreForTests } from "../src/lib/lia/oi/store";

const live = process.argv.includes("--live");

async function runOne(label: string, query: string) {
  console.log(`\n=== ${label} ===`);
  console.log("QUERY:", query);
  const plan = buildSearchPlan(query);
  const adapterRun = await runMatchingSourceAdapters({
    rawQuery: query,
    plan,
    userId: "live-2c",
    mode: live ? "live" : "stub",
  });
  for (const s of adapterRun.stats) {
    console.log(
      `ADAPTER ${s.adapterId}: health=${s.health} raw=${s.rawCount} norm=${s.normalizedCount} transport=${s.transport} err=${s.error || "-"}`,
    );
  }
  console.log(
    "NORMALIZED sample:",
    JSON.stringify(
      adapterRun.candidates.slice(0, 3).map((c) => ({
        id: c.id,
        title: c.title,
        type: c.opportunityType,
        official: c.isOfficialSource,
        objectId: c.sourceObjectId,
        deadline: c.deadlineAt,
        days: c.daysRemaining,
        price: c.askingPrice ?? c.investmentRequired,
        url: c.sources[0]?.url,
        sourceConfidence: c.sourceConfidence,
        opportunityScore: c.score.opportunity,
      })),
      null,
      2,
    ),
  );

  resetLiaOiStoreForTests();
  process.env.LIA_OI_STORE = "memory";
  process.env.LIA_OI_SEARCH_MODE = live ? "live" : "stub";
  const pipeline = await runOwnerSearchPipeline({
    query,
    userId: "00000000-0000-4000-8000-000000000099",
  });
  const saved = await listCandidates();
  console.log("PIPELINE stats:", {
    raw: pipeline.stats.signalsRaw,
    afterDedup: pipeline.stats.afterDedup,
    specializedRaw: pipeline.stats.specializedRaw,
    specializedNormalized: pipeline.stats.specializedNormalized,
    mergedWithSerper: pipeline.stats.specializedMergedWithSerper,
    top: pipeline.topOpportunities.length,
    saved: saved.length,
    adapterErrors: pipeline.stats.adapterStats?.filter((a) => a.error).length,
  });
  console.log(
    "TOP:",
    pipeline.topOpportunities.slice(0, 5).map((c) => ({
      title: c.title.slice(0, 80),
      adapter: c.sourceAdapterId,
      official: c.isOfficialSource,
      days: c.daysRemaining,
    })),
  );
}

async function main() {
  console.log(`Stage 2C live smoke mode=${live ? "live" : "stub/fixture"}`);
  await runOne(
    "A auctions",
    "Найди активы/предприятия на торгах до 30 млн ₽ по России",
  );
  await runOne(
    "B procurement",
    "Найди закупки продуктов питания до 30 млн ₽ по России",
  );
  await runOne(
    "C support",
    "Найди программы господдержки для малого и среднего производства",
  );
  console.log("\nLIVE_SMOKE_DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
