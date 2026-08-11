/**
 * Stage 2C.3 — Official API readiness (fixture-based, no live credentials).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { emptyScore } from "../src/lib/lia/oi/score";
import { dedupeCandidates } from "../src/lib/lia/oi/dedup";
import {
  eisConnectionStatus,
  fedresursConnectionStatus,
  getFedresursAccessToken,
  loadEisFixtureObjects,
  loadFedresursFixtureObjects,
  mergeSerperWithOfficial,
  parseEisNoticeXml,
  parseFedresursLotsPayload,
  procurementOfficialProvider,
  fedresursOfficialProvider,
  refreshFedresursAccessToken,
  resetFedresursTokenCacheForTests,
  getOfficialAndDiscoveryStatusRows,
} from "../src/lib/lia/oi/sources/providers";
import { officialObjectToCandidate } from "../src/lib/lia/oi/sources/providers/to-candidate";
import { hitToSpecializedCandidate } from "../src/lib/lia/oi/sources/candidate-factory";
import type { LiaOiCandidate } from "../src/types/lia-oi";

function ok(name: string) {
  console.log(`  ✓ ${name}`);
}

function serperLikeProcurement(id: string): LiaOiCandidate {
  return {
    ...hitToSpecializedCandidate(
      {
        id: "hit1",
        title: `Закупка воды ${id} snippet wrong NMCK`,
        description: "НМЦК примерно 1 млн руб по сниппету",
        url: `https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=${id}`,
        source: "Serper",
        published_at: "",
        trust_score: 0.5,
        trusted: false,
      },
      {
        adapterId: "procurement",
        opportunityType: "PROCUREMENT",
        sourceClass: "TENDERS",
        category: "PROCUREMENT",
        sourceName: "ЕИС Закупки (Serper discovery)",
        idKind: "procurement",
      },
    ),
    dataChannel: "SERPER_DISCOVERY",
    askingPrice: 1_000_000,
    nmck: 1_000_000,
    sourceConfidence: 82,
    score: {
      ...emptyScore(),
      overall: 50,
      opportunity: 50,
      confidence: 82,
      quality: 40,
    },
  };
}

async function main() {
  console.log("\nLIA OI Stage 2C.3 — Official API readiness\n");

  // --- env status without secrets ---
  assert.equal(eisConnectionStatus(), "NOT_CONFIGURED");
  assert.equal(fedresursConnectionStatus(), "NOT_CONFIGURED");
  const rows = getOfficialAndDiscoveryStatusRows();
  assert.ok(rows.find((r) => r.id === "eis")?.statusMessage.includes("не настроен"));
  assert.ok(
    rows.find((r) => r.id === "fedresurs")?.statusMessage.includes("не настроен"),
  );
  ok("EIS/ЕФРСБ status NOT_CONFIGURED (no secrets shown)");

  // --- EIS XML parse / normalize / provenance ---
  const xmlPath = join(
    process.cwd(),
    "src/lib/lia/oi/sources/providers/eis/fixtures/notice-ep.xml",
  );
  const xml = readFileSync(xmlPath, "utf8");
  const eisObjects = parseEisNoticeXml(xml, { dataChannel: "OFFICIAL_API" });
  assert.ok(eisObjects.length >= 2);
  const first = eisObjects[0]!;
  assert.equal(first.rawOfficialId, "0373100043226000123");
  assert.equal(first.nmck, 12_500_000);
  assert.ok(first.deadlineAt);
  assert.ok(first.customer);
  assert.ok(first.region);
  assert.ok(first.status);
  assert.ok(first.officialUrl.includes("zakupki.gov.ru"));
  assert.ok(
    first.structuredFields.every(
      (f) => f.kind === "FACT" && f.source === "official_api",
    ),
  );
  assert.equal(first.sourceConfidence >= 90, true);
  ok("ЕИС XML: parse + normalize + FACT + NMCK + deadline + ID");

  const eisFixtures = loadEisFixtureObjects();
  assert.ok(eisFixtures.length >= 1);
  assert.equal(eisFixtures[0]!.dataChannel, "FIXTURE_DEMO");
  ok("ЕИС fixture channel FIXTURE_DEMO");

  const eisProvider = await procurementOfficialProvider.search({
    rawQuery: "закупка воды",
    limit: 5,
    allowLive: false,
    useFixtures: true,
  });
  assert.equal(eisProvider.transport, "fixture");
  assert.equal(eisProvider.connectionStatus, "NOT_CONFIGURED");
  assert.ok(eisProvider.objects.length >= 1);
  // Must not require live network
  ok("ЕИС provider fixtures without live HTTP");

  const eisCand = officialObjectToCandidate(eisProvider.objects[0]!, {
    adapterId: "procurement",
    opportunityType: "PROCUREMENT",
    sourceClass: "TENDERS",
    category: "PROCUREMENT",
  });
  assert.ok(eisCand.matchingReadiness === "READY" || eisCand.matchingReadiness === "PARTIAL");
  assert.ok((eisCand.score.opportunity ?? 0) <= 60, "official ≠ auto-high opportunity");
  assert.ok((eisCand.sourceConfidence ?? 0) >= 90);
  ok("ЕИС candidate: matching_readiness + source_confidence vs opportunity");

  // --- Fedresurs auth mock + JSON ---
  resetFedresursTokenCacheForTests();
  const auth = await getFedresursAccessToken({ allowLive: false, useMock: true });
  assert.ok(auth.token);
  assert.equal(auth.fromMock, true);
  const refreshed = await refreshFedresursAccessToken({
    allowLive: false,
    useMock: true,
  });
  assert.ok(refreshed.token);
  ok("ЕФРСБ auth mock + token refresh (fixture)");

  const lotsJson = JSON.parse(
    readFileSync(
      join(
        process.cwd(),
        "src/lib/lia/oi/sources/providers/fedresurs/fixtures/lots.json",
      ),
      "utf8",
    ),
  );
  const lots = parseFedresursLotsPayload(lotsJson, {
    dataChannel: "OFFICIAL_API",
  });
  assert.ok(lots.length >= 1);
  const lot = lots[0]!;
  assert.ok(lot.rawOfficialId);
  assert.ok(lot.startingPrice != null || lot.currentPrice != null);
  assert.ok(lot.status);
  assert.ok(
    lot.structuredFields.every(
      (f) => f.kind === "FACT" && f.source === "official_api",
    ),
  );
  ok("ЕФРСБ JSON: parse + normalize + price + status + lot id + provenance");

  const fed = await fedresursOfficialProvider.search({
    rawQuery: "торги цех",
    limit: 5,
    allowLive: false,
    useFixtures: true,
  });
  assert.equal(fed.transport, "fixture");
  assert.equal(fed.connectionStatus, "NOT_CONFIGURED");
  assert.ok(fed.objects.length >= 1);
  assert.ok(loadFedresursFixtureObjects().length >= 1);
  ok("ЕФРСБ provider fixtures without live HTTP");

  // --- Merge Serper + official → one opportunity ---
  const officialId = first.rawOfficialId;
  const serper = serperLikeProcurement(officialId);
  const officialCand = officialObjectToCandidate(first, {
    adapterId: "procurement",
    opportunityType: "PROCUREMENT",
    sourceClass: "TENDERS",
    category: "PROCUREMENT",
  });
  // Force OFFICIAL_API channel on parsed official object candidate
  officialCand.dataChannel = "OFFICIAL_API";
  officialCand.nmck = first.nmck;
  officialCand.askingPrice = first.nmck;

  const merged = mergeSerperWithOfficial(serper, officialCand);
  assert.equal(merged.sourceObjectId, officialId);
  assert.equal(merged.nmck, 12_500_000, "official NMCK wins over snippet");
  assert.ok(merged.sources.length >= 2, "both source provenances kept");
  assert.ok(
    merged.claims.some((c) => c.field === "procurement_id"),
  );
  assert.ok(
    (merged.structuredFields || []).some(
      (f) => f.field === "nmck" && f.source === "official_api",
    ),
  );
  assert.ok(merged.matchingReadiness);

  const deduped = dedupeCandidates([serper, officialCand]);
  assert.equal(deduped.length, 1, "no duplicate opportunity");
  ok("Merge: Serper + official → одна opportunity, official fields win");

  console.log("\nStage 2C.3 tests passed.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
