/**
 * Stage 2C.1 — structured enrichment tests (fixtures/mocks, no live API).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { auctionAssetExtractor } from "../src/lib/lia/oi/enrichment/extractors/auction";
import { procurementExtractor } from "../src/lib/lia/oi/enrichment/extractors/procurement";
import { supportProgramExtractor } from "../src/lib/lia/oi/enrichment/extractors/support";
import {
  extractDeadlineFromOfficialText,
  normalizeRelativeDate,
} from "../src/lib/lia/oi/enrichment/dates";
import { stripHtml } from "../src/lib/lia/oi/enrichment/html";
import {
  extractLabeledMoney,
  extractPrimaryMoney,
} from "../src/lib/lia/oi/enrichment/money";
import { refinePageKind } from "../src/lib/lia/oi/enrichment/page-kind";
import { computeDataQuality } from "../src/lib/lia/oi/enrichment/quality";
import { scoreWithoutFetch } from "../src/lib/lia/oi/enrichment/enrich-candidate";
import { emptyScore } from "../src/lib/lia/oi/score";
import { diffTrackedFields } from "../src/lib/lia/oi/fingerprint";
import {
  resetLiaOiStoreForTests,
  upsertCandidates,
  getCandidate,
} from "../src/lib/lia/oi/store";
import { canAccessOiOwner } from "../src/lib/lia/oi/http";
import type { LiaOiCandidate } from "../src/types/lia-oi";

const FIX = join(
  process.cwd(),
  "src/lib/lia/oi/enrichment/fixtures",
);

function baseCandidate(partial: Partial<LiaOiCandidate>): LiaOiCandidate {
  const now = new Date().toISOString();
  return {
    id: partial.id || "cand_test",
    type: "web_opportunity",
    title: partial.title || "Test",
    description: partial.description || "",
    summary: "",
    whyInteresting: [],
    recommendation: "",
    nextStep: "",
    status: "NEW",
    country: "RU",
    sources: partial.sources || [
      {
        id: "src1",
        category: "AUCTIONS",
        name: "test",
        url: "https://torgi.gov.ru/new/public/lots/lot/21000032180000000281_7",
        isStub: true,
      },
    ],
    claims: [],
    risks: [],
    unknowns: [],
    toVerify: [],
    score: emptyScore(),
    matchHints: [],
    firstSeenAt: now,
    lastSeenAt: now,
    canonicalKey: "k",
    rawStubIds: [],
    isStub: true,
    pageType: "DETAIL",
    isCatalogSource: false,
    ...partial,
  };
}

function ok(name: string) {
  console.log(`  ✓ ${name}`);
}

async function main() {
  console.log("\nLIA OI Stage 2C.1 — structured enrichment\n");

  // --- money ---
  const nmck = extractLabeledMoney(
    "НМЦК: 12 400 000 руб. по контракту",
    /нмцк/i,
    "NMCK",
  );
  assert.equal(nmck?.amountRub, 12_400_000);
  assert.equal(nmck?.kind, "NMCK");
  const rev = extractPrimaryMoney("Выручка компании 50 млн ₽ в год");
  assert.equal(rev, null, "revenue must not become asking price");
  ok("price normalization (NMCK vs revenue)");

  // --- dates ---
  const abs = extractDeadlineFromOfficialText(
    "Окончание: 25.09.2026 18:00 приём заявок",
  );
  assert.ok(abs);
  const rel = normalizeRelativeDate("3 hours ago", Date.parse("2026-08-11T12:00:00Z"));
  assert.ok(rel);
  assert.equal(rel, new Date("2026-08-11T09:00:00.000Z").toISOString());
  ok("deadline / relative date normalization");

  // --- DETAIL vs LIST ---
  const detail = refinePageKind({
    url: "https://torgi.gov.ru/new/public/lots/lot/21000032180000000281_7",
    title: "Лот производственный цех",
  });
  assert.equal(detail.pageType, "DETAIL");
  assert.equal(detail.isDetail, true);
  const list = refinePageKind({
    url: "https://old.bankrot.fedresurs.ru/TradeList.aspx",
    title: "Каталог торгов — все лоты",
  });
  assert.equal(list.isDetail, false);
  const news = refinePageKind({
    url: "https://corpmsp.ru/about/press/news/novosti/",
    title: "Новости корпорации",
  });
  assert.equal(news.pageType, "NEWS");
  ok("DETAIL vs LIST / NEWS");

  // --- auction extractor ---
  const auctionHtml = readFileSync(join(FIX, "auction-detail.html"), "utf8");
  const auctionText = stripHtml(auctionHtml);
  const auction = auctionAssetExtractor.extract({
    candidate: baseCandidate({
      sourceAdapterId: "auction_assets",
      opportunityType: "AUCTION_ASSET",
      isOfficialSource: true,
    }),
    html: auctionHtml,
    text: auctionText,
    finalUrl:
      "https://torgi.gov.ru/new/public/lots/lot/21000032180000000281_7",
    titleTag: "Лот № 21000032180000000281 — Производственный цех",
  });
  assert.ok(auction.structuredFields.find((f) => f.field === "lot_id"));
  assert.ok(auction.structuredFields.find((f) => f.field === "starting_price"));
  assert.equal(auction.patch.startingPrice, 18_500_000);
  assert.equal(auction.patch.currentPrice, 19_200_000);
  assert.ok(auction.patch.deadlineAt);
  assert.ok(auction.structuredFields.every((f) => f.kind === "FACT" || f.value != null));
  ok("auction detail extraction + provenance");

  // --- procurement extractor ---
  const procHtml = readFileSync(join(FIX, "procurement-detail.html"), "utf8");
  const proc = procurementExtractor.extract({
    candidate: baseCandidate({
      sourceAdapterId: "procurement",
      opportunityType: "PROCUREMENT",
      sources: [
        {
          id: "s",
          category: "PROCUREMENT",
          name: "ЕИС",
          url: "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0324100012345000123",
          isStub: true,
        },
      ],
    }),
    html: procHtml,
    text: stripHtml(procHtml),
    finalUrl:
      "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0324100012345000123",
    titleTag: "Поставка продуктов питания для учреждений",
  });
  assert.equal(proc.patch.nmck, 12_400_000);
  assert.ok(proc.structuredFields.find((f) => f.field === "customer"));
  assert.ok(proc.patch.deadlineAt);
  ok("procurement detail extraction");

  // --- support extractor ---
  const supHtml = readFileSync(join(FIX, "support-detail.html"), "utf8");
  const sup = supportProgramExtractor.extract({
    candidate: baseCandidate({
      sourceAdapterId: "support_programs",
      opportunityType: "SUPPORT_PROGRAM",
      sources: [
        {
          id: "s",
          category: "SUPPORT_PROGRAMS",
          name: "МСП",
          url: "https://мсп.рф/services/support/detail/MSP-GRANT-PROD-2026",
          isStub: true,
        },
      ],
    }),
    html: supHtml,
    text: stripHtml(supHtml),
    finalUrl: "https://мсп.рф/services/support/detail/MSP-GRANT-PROD-2026",
    titleTag: "Грант на развитие производственного МСП",
  });
  assert.equal(sup.patch.supportAmount, 5_000_000);
  assert.ok(sup.structuredFields.find((f) => f.field === "support_type"));
  assert.ok(sup.patch.deadlineAt);
  ok("support program extraction");

  // --- matching readiness ---
  const rich = scoreWithoutFetch(
    baseCandidate({
      ...auction.patch,
      id: "cand_ready",
      sourceAdapterId: "auction_assets",
      opportunityType: "AUCTION_ASSET",
      isOfficialSource: true,
      pageType: "DETAIL",
      isCatalogSource: false,
      sourceObjectId: "21000032180000000281",
      startingPrice: 18_500_000,
      askingPrice: 18_500_000,
      priceStatus: "KNOWN",
      priceKind: "STARTING_AUCTION_PRICE",
      region: "Краснодарский край",
      auctionStatus: "Приём заявок",
      deadlineAt: auction.patch.deadlineAt as string,
      structuredFields: auction.structuredFields,
    }),
  );
  assert.ok(
    rich.matchingReadiness === "READY" || rich.matchingReadiness === "PARTIAL",
  );
  assert.ok((rich.dataQualityScore || 0) >= 50);
  const poor = scoreWithoutFetch(
    baseCandidate({
      id: "cand_poor",
      title: "Каталог",
      pageType: "LIST",
      isCatalogSource: true,
      sourceAdapterId: "serper_general",
      sources: [
        {
          id: "s",
          category: "PUBLIC_WEB",
          name: "web",
          url: "https://example.com/catalog",
          isStub: true,
        },
      ],
    }),
  );
  assert.equal(poor.matchingReadiness, "NOT_READY");
  ok("matching_readiness READY/PARTIAL vs NOT_READY");

  // --- field provenance ---
  const priceField = auction.structuredFields.find(
    (f) => f.field === "starting_price",
  );
  assert.equal(priceField?.source, "official_page");
  assert.equal(priceField?.kind, "FACT");
  assert.ok((priceField?.confidence || 0) >= 90);
  ok("field provenance");

  // --- malformed / empty page ---
  const malformed = auctionAssetExtractor.extract({
    candidate: baseCandidate({
      sourceAdapterId: "auction_assets",
      opportunityType: "AUCTION_ASSET",
    }),
    html: "<html><body>broken",
    text: "broken",
    finalUrl: "https://torgi.gov.ru/new/public/lots/lot/x",
    titleTag: null,
  });
  assert.ok(malformed.structuredFields.find((f) => f.field === "official_url"));
  assert.equal(malformed.patch.startingPrice, undefined);
  ok("malformed official page does not invent price");

  // --- quality score uses confirmed fields ---
  const q = computeDataQuality({
    candidate: rich,
    structuredFields: rich.structuredFields || [],
  });
  assert.ok(q.confirmedFields.includes("starting_price") || q.confirmedFields.includes("lot_id"));
  ok("data_quality_score from confirmed fields");

  // --- change tracking after re-enrich style upsert ---
  process.env.LIA_OI_STORE = "memory";
  resetLiaOiStoreForTests();
  const created = await upsertCandidates([
    baseCandidate({
      id: "cand_chg",
      fingerprint: "fp_chg_1",
      askingPrice: 1_000_000,
      startingPrice: 1_000_000,
      matchingReadiness: "NOT_READY",
      dataQualityScore: 20,
    }),
  ]);
  const updated = await upsertCandidates([
    {
      ...created.candidates[0],
      askingPrice: 18_500_000,
      startingPrice: 18_500_000,
      matchingReadiness: "PARTIAL",
      dataQualityScore: 70,
      deadlineAt: "2026-09-25T15:00:00.000Z",
    },
  ]);
  assert.ok(updated.updatedIds.includes(created.candidates[0].id));
  const again = await getCandidate(created.candidates[0].id);
  assert.equal(again?.startingPrice, 18_500_000);
  const diffs = diffTrackedFields(created.candidates[0], again!);
  assert.ok(diffs.some((d) => d.field === "startingPrice"));
  assert.ok(diffs.some((d) => d.field === "matchingReadiness"));
  ok("change tracking after re-enrich upsert");

  // --- owner auth still admin-only ---
  assert.equal(canAccessOiOwner(["admin"]), true);
  assert.equal(canAccessOiOwner(["user"]), false);
  ok("owner auth still admin-only");

  // --- list page fixture classification ---
  const listHtml = readFileSync(join(FIX, "list-page.html"), "utf8");
  const listKind = refinePageKind({
    url: "https://example.com/catalog/list",
    title: stripHtml(listHtml).slice(0, 80),
  });
  assert.equal(listKind.isDetail, false);
  ok("LIST page not enrichable as DETAIL");

  console.log("\nAll LIA OI Stage 2C.1 checks passed.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
