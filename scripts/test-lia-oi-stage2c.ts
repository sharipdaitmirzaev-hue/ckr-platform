/**
 * Stage 2C tests — specialized sources (fixtures/mocks only, no live API).
 */
import assert from "node:assert/strict";
import {
  daysRemaining,
  deadlineLabel,
  extractDeadlineFromText,
  parseDeadline,
  priorityFromDeadline,
} from "../src/lib/lia/oi/sources/deadline";
import {
  buildSpecializedCandidate,
  extractOfficialIdFromUrl,
} from "../src/lib/lia/oi/sources/candidate-factory";
import {
  getSourceHealthSnapshot,
  listSourceAdapters,
  runMatchingSourceAdapters,
} from "../src/lib/lia/oi/sources/registry";
import { buildOpportunityFingerprint } from "../src/lib/lia/oi/fingerprint";
import { buildSearchPlan } from "../src/lib/lia/oi/planner";
import { runOwnerSearchPipeline } from "../src/lib/lia/oi/pipeline";
import {
  listCandidates,
  resetLiaOiStoreForTests,
  upsertCandidates,
} from "../src/lib/lia/oi/store";
import { canAccessOiOwner } from "../src/lib/lia/oi/http";

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}

async function main() {
  console.log("\nLIA OI Stage 2C — specialized sources\n");
  process.env.LIA_OI_STORE = "memory";
  process.env.LIA_OI_SEARCH_MODE = "stub";

  {
    const adapters = listSourceAdapters();
    assert.equal(adapters.length, 3);
    assert.ok(adapters.some((a) => a.id === "auction_assets"));
    assert.ok(adapters.some((a) => a.id === "procurement"));
    assert.ok(adapters.some((a) => a.id === "support_programs"));
    ok("three specialized adapters registered");
  }

  {
    const plan = buildSearchPlan(
      "Найди производственные активы на торгах до 30 млн рублей",
    );
    const { results, candidates, stats } = await runMatchingSourceAdapters({
      rawQuery: plan.rawQuery,
      plan,
      userId: "00000000-0000-4000-8000-000000000001",
      mode: "stub",
    });
    assert.ok(results.some((r) => r.adapterId === "auction_assets"));
    assert.ok(candidates.length >= 1);
    assert.ok(candidates.every((c) => c.opportunityType === "AUCTION_ASSET"));
    assert.ok(candidates.every((c) => c.isOfficialSource));
    assert.ok(candidates.every((c) => c.sourceObjectId));
    assert.ok(stats.every((s) => s.health === "OK"));
    ok("auction adapter normalization + official provenance (fixture)");
  }

  {
    const plan = buildSearchPlan(
      "Найди закупки воды и напитков по России до 30 млн",
    );
    const { candidates } = await runMatchingSourceAdapters({
      rawQuery: plan.rawQuery,
      plan,
      userId: "u1",
      mode: "stub",
    });
    assert.ok(candidates.some((c) => c.opportunityType === "PROCUREMENT"));
    assert.ok(
      candidates.some((c) =>
        (c.claims || []).some((x) => x.field === "procurementId"),
      ),
    );
    ok("procurement adapter normalization");
  }

  {
    const plan = buildSearchPlan(
      "Найди программы господдержки для малого и среднего производства",
    );
    const { candidates } = await runMatchingSourceAdapters({
      rawQuery: plan.rawQuery,
      plan,
      userId: "u1",
      mode: "stub",
    });
    assert.ok(candidates.some((c) => c.opportunityType === "SUPPORT_PROGRAM"));
    assert.ok(candidates.every((c) => c.sourceAdapterId === "support_programs"));
    ok("support adapter normalization");
  }

  {
    const d = parseDeadline("15.09.2026 12:00");
    assert.ok(d);
    const days = daysRemaining("2026-08-14T10:00:00+03:00", Date.parse("2026-08-11T10:00:00+03:00"));
    assert.equal(days, 3);
    assert.equal(priorityFromDeadline("NORMAL", 3), "URGENT");
    assert.equal(priorityFromDeadline("NORMAL", 10), "INTERESTING");
    assert.equal(deadlineLabel(3), "До окончания: 3 дня");
    const fromText = extractDeadlineFromText("Прием заявок до 20.08.2026");
    assert.ok(fromText);
    ok("deadline awareness");
  }

  {
    const a = buildSpecializedCandidate({
      adapterId: "auction_assets",
      opportunityType: "AUCTION_ASSET",
      sourceClass: "AUCTIONS_ASSETS",
      category: "AUCTIONS",
      sourceName: "ГИС Торги",
      official: true,
      sourceConfidence: 88,
      title: "Цех на торгах",
      description: "Лот",
      url: "https://torgi.gov.ru/new/public/lots/lot/ABC123",
      askingPrice: 10_000_000,
      objectId: "ABC123",
      isStub: false,
    });
    const serperLike = {
      ...a,
      id: "cand_other",
      sourceAdapterId: "serper_general",
      isOfficialSource: false,
      sourceConfidence: 40,
      fingerprint: buildOpportunityFingerprint({
        ...a,
        canonicalUrl: a.canonicalUrl,
      }),
    };
    // same fingerprint → upsert merges
    resetLiaOiStoreForTests();
    await upsertCandidates([serperLike]);
    const merged = await upsertCandidates([a], { reason: "rediscovery" });
    assert.equal(merged.updatedIds.length, 1);
    const list = await listCandidates();
    assert.equal(list.length, 1);
    assert.equal(list[0].isOfficialSource, true);
    assert.equal(list[0].sourceAdapterId, "auction_assets");
    ok("dedup Serper + specialized source by fingerprint");
  }

  {
    assert.equal(
      extractOfficialIdFromUrl(
        "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0373100043226000123",
        "procurement",
      ),
      "0373100043226000123",
    );
    ok("official id extraction");
  }

  {
    const health = await getSourceHealthSnapshot();
    assert.equal(health.length, 3);
    assert.ok(health.every((h) => h.health === "OK"));
    ok("source health snapshot");
  }

  {
    // Failure isolation: broken adapter must not kill others
    const plan = buildSearchPlan("торги и закупки и господдержка производство");
    const { stats } = await runMatchingSourceAdapters({
      rawQuery: plan.rawQuery,
      plan,
      userId: "u1",
      mode: "stub",
    });
    assert.ok(stats.length >= 2);
    assert.ok(stats.every((s) => s.health === "OK" || s.error));
    ok("provider failure isolation shape (multi-adapter run)");
  }

  {
    resetLiaOiStoreForTests();
    process.env.LIA_OI_SEARCH_MODE = "stub";
    process.env.LIA_OI_STORE = "memory";
    const result = await runOwnerSearchPipeline({
      query: "Найди активы на торгах до 30 млн ₽ по России",
      userId: "00000000-0000-4000-8000-000000000001",
    });
    assert.ok(result.stats.adapterStats?.length);
    assert.ok((result.stats.specializedNormalized ?? 0) >= 1);
    const saved = await listCandidates();
    assert.ok(saved.some((c) => c.sourceAdapterId === "auction_assets"));
    ok("persistence of specialized results via pipeline/store");
  }

  {
    assert.equal(canAccessOiOwner(["admin"]), true);
    assert.equal(canAccessOiOwner(["user"]), false);
    ok("owner auth still admin-only");
  }

  {
    const a = buildSpecializedCandidate({
      adapterId: "auction_assets",
      opportunityType: "AUCTION_ASSET",
      sourceClass: "AUCTIONS_ASSETS",
      category: "AUCTIONS",
      sourceName: "ГИС Торги",
      official: true,
      sourceConfidence: 88,
      title: "Лот",
      description: "x",
      url: "https://torgi.gov.ru/new/public/lots/lot/1",
      objectId: "1",
      deadlineRaw: "2026-08-14T10:00:00+03:00",
      isStub: true,
    });
    assert.ok((a.sourceConfidence ?? 0) >= 80);
    assert.ok((a.score.opportunity ?? 0) < 90);
    ok("source confidence separate from opportunity score");
  }

  console.log("\nAll LIA OI Stage 2C checks passed.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
