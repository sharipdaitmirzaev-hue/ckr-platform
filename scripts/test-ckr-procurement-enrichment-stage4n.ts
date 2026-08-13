/**
 * Stage 4N — Procurement Source Access & DETAIL Enrichment tests (offline).
 * Run: npx tsx scripts/test-ckr-procurement-enrichment-stage4n.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assessAssortmentSufficiency,
  isFoodFalsePositiveForBeverageWholesale,
  productFitScore,
  detectProductTags,
} from "../src/lib/demand-intelligence";
import { dedupeCandidates } from "../src/lib/lia/oi/dedup";
import {
  extractNoticeIdFromText,
  extractNoticeIdFromUrl,
  normalizeNoticeId,
  sameNoticeId,
  resetProcurementDetailCache,
  parseProcurementDetailHtml,
  resolveProcurementDetail,
  summarizeDetailResolveStats,
  assessOfficialEisAccess,
  officialEisRequiresOwnerCredentialsMessage,
} from "../src/lib/lia/oi/procurement";
import { getSourceHealthRows } from "../src/lib/lia/oi/source-health";
import { sameOfficialIdentity } from "../src/lib/lia/oi/sources/providers/merge";
import type { LiaOiCandidate } from "../src/types/lia-oi";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(e instanceof Error ? e.stack : e);
  }
}

function read(path: string) {
  return readFileSync(resolve(path), "utf8");
}

const FIXTURE_HTML = `
<html><body>
<h1>Закупка 0103200008426006399 Лот 1 Поставка молочной продукции</h1>
<p>Заказчик ГКУ «Детский дом №7» Начальная максимальная цена</p>
<p>Объект закупки: молочная продукция для учреждения</p>
<p>Регион: Республика Дагестан</p>
<p>НМЦК: 906 000,00 руб.</p>
<p>Подать заявку до: 24.08.2026 09:00 МСК</p>
<p>Подача заявок</p>
</body></html>
`;

const TEA_HTML = `
<html><body>
<p>Номер закупки: 0303300143726000006</p>
<p>Заказчик МКОУ «Аверьяновская СОШ» ИНН 123</p>
<p>Предмет закупки: чай черный ферментированный в упаковках</p>
<p>Регион: Республика Дагестан</p>
<p>НМЦК 26 000 руб.</p>
<p>Подача заявок: 01.08.2026 - 19.08.2026 06:10</p>
</body></html>
`;

const EXPIRED_HTML = `
<html><body>
<p>Номер закупки: 0103200008426006533</p>
<p>Заказчик лагерь «Планета»</p>
<p>Объект закупки: продукты питания</p>
<p>НМЦК: 469000 руб</p>
<p>Подать заявку до: 14.08.2020 10:00</p>
</body></html>
`;

const CANCELLED_HTML = `
<html><body>
<p>Номер закупки: 0103200008426006801</p>
<p>Заказчик ГБУ РД РЦИБ</p>
<p>Объект закупки: продукты питания</p>
<p>Статус: отменена</p>
<p>НМЦК: 245000</p>
</body></html>
`;

function baseCand(partial: Partial<LiaOiCandidate>): LiaOiCandidate {
  return {
    id: partial.id || "c1",
    title: partial.title || "Закупка",
    description: partial.description || "",
    opportunityType: "PROCUREMENT",
    sourceAdapterId: "procurement",
    sourceClass: "TENDERS",
    category: "PROCUREMENT",
    region: partial.region ?? "Дагестан",
    sources: partial.sources || [
      {
        url: "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0303300064726000936",
        name: "EIS",
      },
    ],
    claims: [],
    score: {
      overall: 50,
      relevance: 50,
      quality: 50,
      freshness: 50,
      explanation: ["test"],
      breakdown: { dataCompleteness: 50 },
    },
    isStub: false,
    isOfficialSource: true,
    dataChannel: "SERPER_DISCOVERY",
    fingerprint: partial.fingerprint || `fp-${partial.id || "c1"}`,
    canonicalKey: partial.canonicalKey || `ck-${partial.id || "c1"}`,
    ...partial,
  } as LiaOiCandidate;
}

async function main() {
  console.log("\nStage 4N — Procurement Enrichment\n");
  resetProcurementDetailCache();

  await test("1. notice ID identity", () => {
    assert.equal(
      normalizeNoticeId("0303300064726000936"),
      "0303300064726000936",
    );
    assert.equal(
      extractNoticeIdFromUrl(
        "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0103200008426006399",
      ),
      "0103200008426006399",
    );
    assert.equal(
      extractNoticeIdFromUrl("https://star-pro.ru/region/x/l0103200008426006801-1"),
      "0103200008426006801",
    );
    assert.equal(
      extractNoticeIdFromText("Извещение 0303300143726000006 чай"),
      "0303300143726000006",
    );
    assert.ok(sameNoticeId("0303300064726000936", "0303300064726000936"));
  });

  await test("2. official source precedence", async () => {
    resetProcurementDetailCache();
    const detail = await resolveProcurementDetail({
      noticeId: "0103200008426006399",
      allowLiveFetch: true,
      skipCache: true,
      fetchImpl: async (url) => {
        if (/zakupki\.gov\.ru/i.test(url)) {
          return {
            ok: true,
            url,
            finalUrl: url,
            status: 200,
            contentType: "text/html",
            bodyText: FIXTURE_HTML,
            bytes: FIXTURE_HTML.length,
          };
        }
        return { ok: false, error: "skip", code: "network" };
      },
    });
    assert.equal(detail.confidence, "OFFICIAL_CONFIRMED");
    assert.ok(detail.customer);
  });

  await test("3. secondary source provenance", async () => {
    resetProcurementDetailCache();
    const detail = await resolveProcurementDetail({
      noticeId: "0103200008426006399",
      mirrorUrls: ["https://star-pro.ru/region/respublika-dagestan/l0103200008426006399-1"],
      allowLiveFetch: true,
      skipCache: true,
      fetchImpl: async (url) => {
        if (/star-pro/i.test(url)) {
          return {
            ok: true,
            url,
            finalUrl: url,
            status: 200,
            contentType: "text/html",
            bodyText: FIXTURE_HTML,
            bytes: FIXTURE_HTML.length,
          };
        }
        return { ok: false, error: "timeout", code: "timeout" };
      },
    });
    assert.equal(detail.confidence, "TRUSTED_SECONDARY");
    assert.ok(detail.facts.some((f) => f.trust === "trusted_secondary"));
    assert.notEqual(detail.confidence, "OFFICIAL_CONFIRMED");
  });

  await test("4. cross-source confirmation", async () => {
    resetProcurementDetailCache();
    const detail = await resolveProcurementDetail({
      noticeId: "0103200008426006399",
      mirrorUrls: [
        "https://star-pro.ru/x/l0103200008426006399-1",
        "https://zakupki360.ru/tender/1",
      ],
      allowLiveFetch: true,
      skipCache: true,
      fetchImpl: async (url) => {
        if (/star-pro|zakupki360/i.test(url)) {
          return {
            ok: true,
            url,
            finalUrl: url,
            status: 200,
            contentType: "text/html",
            bodyText: FIXTURE_HTML,
            bytes: FIXTURE_HTML.length,
          };
        }
        return { ok: false, error: "fail", code: "timeout" };
      },
    });
    assert.equal(detail.confidence, "MULTI_SOURCE_CONFIRMED");
  });

  await test("5. conflicting facts do not silently overwrite", async () => {
    resetProcurementDetailCache();
    const htmlA = FIXTURE_HTML;
    const htmlB = FIXTURE_HTML.replace(
      "ГКУ «Детский дом №7»",
      "Другой заказчик ООО Тест",
    );
    let n = 0;
    const detail = await resolveProcurementDetail({
      noticeId: "0103200008426006399",
      mirrorUrls: [
        "https://star-pro.ru/a/l0103200008426006399-1",
        "https://zakupki360.ru/tender/2",
      ],
      allowLiveFetch: true,
      skipCache: true,
      fetchImpl: async (url) => {
        n += 1;
        const body = n === 1 ? htmlA : htmlB;
        return {
          ok: true,
          url,
          finalUrl: url,
          status: 200,
          contentType: "text/html",
          bodyText: body,
          bytes: body.length,
        };
      },
    });
    assert.match(detail.customer || "", /Детский дом/i);
    assert.ok(detail.facts.some((f) => f.field === "customer_conflict"));
  });

  await test("6. UNKNOWN remains UNKNOWN", async () => {
    resetProcurementDetailCache();
    const detail = await resolveProcurementDetail({
      noticeId: "0103200008426006399",
      allowLiveFetch: true,
      skipCache: true,
      fetchImpl: async () => ({
        ok: true,
        url: "https://star-pro.ru/x",
        finalUrl: "https://star-pro.ru/x",
        status: 200,
        contentType: "text/html",
        bodyText: "<html>нет данных о закупке 0103200008426006399</html>",
        bytes: 40,
      }),
    });
    // May have notice but missing fields stay null
    assert.equal(detail.amount, null);
    assert.ok(!detail.customer || detail.customer.length > 0);
  });

  await test("7. amount parsing", () => {
    const p = parseProcurementDetailHtml({ html: FIXTURE_HTML });
    assert.ok(p.amount != null && p.amount >= 900_000 && p.amount <= 910_000);
  });

  await test("8. deadline parsing", () => {
    const p = parseProcurementDetailHtml({ html: FIXTURE_HTML });
    assert.ok(p.deadlineAt);
    assert.match(p.deadlineAt!, /2026-08-24/);
  });

  await test("9. publication date != deadline", () => {
    const html = `
      <p>Номер закупки: 0103200008426006399</p>
      <p>Дата размещения: 01.08.2026</p>
      <p>Подать заявку до: 24.08.2026 09:00</p>
      <p>НМЦК: 100000</p>
    `;
    const p = parseProcurementDetailHtml({ html });
    assert.ok(p.deadlineAt);
    assert.match(p.deadlineAt!, /2026-08-24/);
    assert.ok(!/2026-08-01/.test(p.deadlineAt!));
  });

  await test("10. customer extraction", () => {
    const p = parseProcurementDetailHtml({ html: FIXTURE_HTML });
    assert.match(p.customer || "", /Детский дом/i);
  });

  await test("11. region extraction", () => {
    const p = parseProcurementDetailHtml({ html: FIXTURE_HTML });
    assert.match(p.region || "", /Дагестан/i);
  });

  await test("12. tea classification", () => {
    const tags = detectProductTags("чай черный ферментированный");
    assert.ok(tags.includes("tea"));
    const fit = productFitScore(
      ["food", "beverage"],
      ["напитки", "чай"],
      "Закупка чая для школы, Республика Дагестан",
    );
    assert.ok(fit.score >= 14, `expected strong tea fit, got ${fit.score}`);
    assert.ok(fit.matched.some((m) => /tea|чай/.test(m)));
  });

  await test("13. food false-positive protection", () => {
    assert.ok(
      isFoodFalsePositiveForBeverageWholesale(
        "поставка мяса говядины для больницы",
      ),
    );
    const fit = productFitScore(
      ["beverage"],
      ["напитки", "вода"],
      "Специализированное детское питание энтеральное",
    );
    assert.ok(fit.score <= 3, `false positive score too high: ${fit.score}`);
  });

  await test("14. expired reject (lifecycle)", () => {
    const p = parseProcurementDetailHtml({ html: EXPIRED_HTML });
    assert.equal(p.lifecycle, "EXPIRED");
  });

  await test("15. cancelled reject (lifecycle)", () => {
    const p = parseProcurementDetailHtml({ html: CANCELLED_HTML });
    assert.equal(p.lifecycle, "CANCELLED");
  });

  await test("16. dedup same notice", () => {
    const a = baseCand({
      id: "a",
      sourceObjectId: "0303300064726000936",
      title: "Закупка A",
    });
    const b = baseCand({
      id: "b",
      sourceObjectId: "0303300064726000936",
      title: "Закупка A mirror",
      sources: [
        {
          url: "https://star-pro.ru/l0303300064726000936-1",
          name: "mirror",
        },
      ],
    });
    assert.ok(sameOfficialIdentity(a, b));
    const deduped = dedupeCandidates([a, b]);
    assert.equal(deduped.length, 1);
  });

  await test("17. different notices stay separate", () => {
    const a = baseCand({
      id: "a",
      sourceObjectId: "0103200008426006399",
      title: "Молочка",
      canonicalUrl:
        "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0103200008426006399",
      sources: [
        {
          url: "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0103200008426006399",
          name: "EIS",
        },
      ],
    });
    const b = baseCand({
      id: "b",
      sourceObjectId: "0103200008426006801",
      title: "Продукты",
      canonicalUrl:
        "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0103200008426006801",
      sources: [
        {
          url: "https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0103200008426006801",
          name: "EIS",
        },
      ],
    });
    assert.equal(sameOfficialIdentity(a, b), false);
    assert.equal(dedupeCandidates([a, b]).length, 2);
  });

  await test("18. owner locks (regression presence)", () => {
    const src = read("src/lib/lia/oi/publish/service.ts");
    assert.match(src, /lockedFields/);
    assert.match(src, /Owner-locked/);
  });

  await test("19. change review (regression presence)", () => {
    const src = read("src/lib/lia/oi/publish/service.ts");
    assert.match(src, /change_review/);
    const stage4c = read("scripts/test-lia-controlled-publish-stage4c.ts");
    assert.match(stage4c, /change_review|owner lock/i);
  });

  await test("20. source health", () => {
    const rows = getSourceHealthRows({
      eisPublicHtmlProbe: {
        dnsOk: true,
        tcp443Ok: false,
        httpStatus: null,
        error: "timeout",
      },
    });
    const eis = rows.find((r) => r.id === "eis");
    assert.ok(eis);
    assert.equal(eis!.reason, "tcp_timeout");
    assert.ok(
      eis!.health === "UNAVAILABLE" || eis!.health === "DEGRADED",
    );
  });

  await test("21. failed EIS gracefully falls back", async () => {
    resetProcurementDetailCache();
    const detail = await resolveProcurementDetail({
      noticeId: "0103200008426006399",
      mirrorUrls: ["https://star-pro.ru/l0103200008426006399-1"],
      allowLiveFetch: true,
      skipCache: true,
      fetchImpl: async (url) => {
        if (/zakupki\.gov\.ru/i.test(url)) {
          return { ok: false, error: "timeout", code: "timeout" };
        }
        return {
          ok: true,
          url,
          finalUrl: url,
          status: 200,
          contentType: "text/html",
          bodyText: FIXTURE_HTML,
          bytes: FIXTURE_HTML.length,
        };
      },
    });
    assert.ok(detail.customer);
    assert.notEqual(detail.confidence, "OFFICIAL_CONFIRMED");
  });

  await test("22. total source outage does not crash", async () => {
    resetProcurementDetailCache();
    const detail = await resolveProcurementDetail({
      noticeId: "0103200008426006399",
      allowLiveFetch: true,
      skipCache: true,
      fetchImpl: async () => ({
        ok: false,
        error: "down",
        code: "network",
      }),
    });
    assert.equal(detail.confidence, "UNVERIFIED");
    const stats = summarizeDetailResolveStats([detail]);
    assert.equal(stats.detailFailure, 1);
  });

  await test("23. no auto-publish", () => {
    const disc = read("src/lib/demand-intelligence/discovery.ts");
    assert.doesNotMatch(disc, /autoPublish\s*[:=]\s*true/);
    assert.match(disc, /publish|Controlled|review/i);
  });

  await test("24. no MATCHES", () => {
    const resolveSrc = read("src/lib/lia/oi/procurement/resolve.ts");
    assert.doesNotMatch(resolveSrc, /MatchingEngine|createMatch\(/);
  });

  await test("25. no client share", () => {
    const assortment = read(
      "src/lib/demand-intelligence/company-assortment.ts",
    );
    assert.match(assortment, /INTERNAL/);
    assert.doesNotMatch(assortment, /sendClient|postClientMessage/);
    assert.match(assortment, /never send as CLIENT/i);
  });

  await test("26. RLS regression (script present)", () => {
    const rls = read("scripts/test-org-create-rls-hotfix.ts");
    assert.ok(rls.length > 50);
  });

  await test("27. Stage 4M regression (product fit still works)", () => {
    const fit = productFitScore(
      ["food", "beverage"],
      ["вода", "напитки"],
      "поставка питьевой воды и безалкогольных напитков",
    );
    assert.ok(fit.score >= 14);
  });

  await test("28. Stage 4L regression (files present)", () => {
    assert.ok(read("scripts/test-ckr-tinda-demand-pilot-stage4l.ts").length > 50);
    assert.ok(read("scripts/test-ckr-demand-intelligence-stage4m.ts").length > 50);
  });

  await test("29. tea HTML parse fixture", () => {
    const p = parseProcurementDetailHtml({ html: TEA_HTML });
    assert.equal(p.noticeId, "0303300143726000006");
    assert.match(p.subject || p.title || "", /чай/i);
  });

  await test("30. official access requires credentials message", () => {
    const access = assessOfficialEisAccess();
    assert.equal(access.credentialsRequired, true);
    assert.match(officialEisRequiresOwnerCredentialsMessage(), /REQUIRES OWNER CREDENTIALS/);
  });

  await test("31. assortment insufficient → staff message", () => {
    const a = assessAssortmentSufficiency({
      industries: ["food"],
      keywords: ["продукты"],
    });
    assert.equal(a.sufficient, false);
    assert.match(a.message, /Недостаточно данных об ассортименте/);
  });

  await test("32. known notice fixtures identity set", () => {
    const ids = [
      "0303300064726000936",
      "0103200008426006399",
      "0103200008426006801",
      "0103200008426006533",
      "0303300143726000006",
    ];
    for (const id of ids) {
      assert.equal(normalizeNoticeId(id), id);
    }
  });

  console.log(`\nStage 4N results: ${passed} passed, ${failed} failed\n`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
