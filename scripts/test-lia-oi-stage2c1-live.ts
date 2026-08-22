/**
 * Stage 2C.1 live smoke — structured enrichment metrics.
 * Default: stub. Pass --live for Serper + safe-fetch.
 *
 * Usage:
 *   npx tsx scripts/test-lia-oi-stage2c1-live.ts
 *   npx tsx scripts/test-lia-oi-stage2c1-live.ts --live
 */
import { runOwnerSearchPipeline } from "../src/lib/lia/oi/pipeline";
import { listCandidates, resetLiaOiStoreForTests } from "../src/lib/lia/oi/store";

const live = process.argv.includes("--live");

function summarize(label: string, items: Awaited<ReturnType<typeof listCandidates>>) {
  const detail = items.filter((c) => c.pageType === "DETAIL").length;
  const enriched = items.filter((c) => c.enrichedFromFetch).length;
  const confirmedPrice = items.filter(
    (c) =>
      c.confirmedFields?.some((f) =>
        ["starting_price", "current_price", "nmck", "support_amount", "asking_price"].includes(
          f,
        ),
      ) ||
      (c.priceStatus === "KNOWN" &&
        (c.startingPrice != null ||
          c.nmck != null ||
          c.supportAmount != null ||
          c.askingPrice != null)),
  ).length;
  const confirmedDeadline = items.filter(
    (c) => c.deadlineAt || c.confirmedFields?.includes("deadline_at"),
  ).length;
  const confirmedId = items.filter(
    (c) =>
      Boolean(c.sourceObjectId) ||
      c.confirmedFields?.some((f) =>
        ["lot_id", "procurement_id", "program_id"].includes(f),
      ),
  ).length;
  const ready = items.filter((c) => c.matchingReadiness === "READY").length;
  const partial = items.filter((c) => c.matchingReadiness === "PARTIAL").length;
  const notReady = items.filter(
    (c) => !c.matchingReadiness || c.matchingReadiness === "NOT_READY",
  ).length;

  console.log(`\n=== ${label} ===`);
  console.log(
    JSON.stringify(
      {
        opportunitiesFound: items.length,
        DETAIL: detail,
        enriched,
        confirmedPrice,
        confirmedDeadline,
        confirmedOfficialId: confirmedId,
        READY: ready,
        PARTIAL: partial,
        NOT_READY: notReady,
        sample: items.slice(0, 5).map((c) => ({
          title: c.title.slice(0, 70),
          adapter: c.sourceAdapterId,
          pageType: c.pageType,
          readiness: c.matchingReadiness,
          quality: c.dataQualityScore,
          confirmed: c.confirmedFields?.slice(0, 6),
          unknown: c.unknownFields?.slice(0, 6),
          price: c.nmck ?? c.startingPrice ?? c.supportAmount ?? c.askingPrice,
          deadline: c.deadlineAt,
          id: c.sourceObjectId,
        })),
      },
      null,
      2,
    ),
  );
}

async function runOne(label: string, query: string) {
  resetLiaOiStoreForTests();
  process.env.LIA_OI_STORE = "memory";
  process.env.LIA_OI_SEARCH_MODE = live ? "live" : "stub";
  const pipeline = await runOwnerSearchPipeline({
    query,
    userId: "00000000-0000-4000-8000-000000000099",
  });
  const saved = await listCandidates();
  console.log("PIPELINE", {
    mode: pipeline.searchMode,
    pagesFetched: pipeline.stats.pagesFetched,
    pagesFetchFailed: pipeline.stats.pagesFetchFailed,
    adapterErrors: pipeline.stats.adapterStats?.filter((a) => a.error).length,
  });
  summarize(label, saved);
}

async function main() {
  console.log(`Stage 2C.1 live smoke mode=${live ? "live" : "stub"}`);
  await runOne(
    "A auctions",
    "Найди производственные активы на торгах до 30 млн ₽",
  );
  await runOne(
    "B procurement",
    "Найди закупки продуктов питания до 30 млн ₽",
  );
  await runOne(
    "C support",
    "Найди действующие меры господдержки для производства",
  );
  console.log("\nSTAGE2C1_LIVE_DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
