/**
 * LIA OI Stage 2A.1 — quality improvements (mocked, no real Serper).
 */
import assert from "node:assert/strict";
import { classifyPageType, isCatalogPageType } from "../src/lib/lia/oi/page-type";
import {
  buildSearchPlan,
  detectIntent,
  geographyToken,
} from "../src/lib/lia/oi/planner";
import { normalizeHit } from "../src/lib/lia/oi/normalize";
import { analyzeCandidate } from "../src/lib/lia/oi/analyze";
import { mapExternalResultToHit } from "../src/lib/lia/oi/internet/live";
import type { ExternalSearchResult } from "../src/types/lia";

function ok(name: string) {
  console.log(`  ✓ ${name}`);
}

console.log("\nLIA OI Stage 2A.1 — quality checks\n");

// Intent
{
  assert.equal(
    detectIntent(
      "Найди 10 перспективных бизнес-возможностей до 30 млн ₽ по России",
    ),
    "business_opportunities",
  );
  assert.equal(
    detectIntent("Инвестор ищет проект до 30 млн рублей по России"),
    "investment_search",
  );
  assert.equal(
    detectIntent("Купить готовый бизнес в Краснодаре"),
    "business_for_sale",
  );
  assert.equal(detectIntent("Тендер на закупку оборудования"), "tenders");
  ok("Intent classifier: broad vs narrow");
}

// Query cleanup
{
  const plan = buildSearchPlan(
    "Найди 10 перспективных бизнес-возможностей до 30 млн ₽ по России",
  );
  assert.equal(plan.intent, "business_opportunities");
  assert.ok(plan.queries.length >= 4);
  for (const q of plan.queries) {
    assert.ok(
      !/россия\s+россия/i.test(q),
      `duplicate geo in: ${q}`,
    );
    assert.ok(!/россия\s+рф/i.test(q), `россия+рф in: ${q}`);
    const geoCount = (q.toLowerCase().match(/\bроссия\b/g) || []).length;
    assert.ok(geoCount <= 1, `too many Россия in: ${q}`);
  }
  assert.equal(geographyToken(["Россия"]), "Россия");
  assert.equal(geographyToken(["Москва"]), "Москва");
  // broad intent mixes directions + prefers specific lots over catalogs
  const joined = plan.hypotheses.join(" | ");
  assert.ok(/инвест|торги|франшиз|производ|недвижим|бизнес/i.test(joined));
  assert.ok(
    plan.queries.some((q) => /-каталог/i.test(q)),
    "expected negative catalog operator in at least one query",
  );
  ok("Search Planner: clean geo + mixed hypotheses");
}

// Page type
{
  assert.equal(
    classifyPageType({
      url: "https://bzbroker.ru/catalog",
      title: "Каталог – купить готовый бизнес",
    }),
    "LIST",
  );
  assert.equal(
    classifyPageType({
      url: "https://example.ru/",
      title: "Продажа бизнеса",
    }),
    "HOMEPAGE",
  );
  assert.equal(
    classifyPageType({
      url: "https://example.ru/offer/prod-28m",
      title: "Продаётся производство 28 млн",
      snippet: "Действующий цех в Краснодаре",
    }),
    "DETAIL",
  );
  assert.equal(
    classifyPageType({
      url: "https://rusinvestproject.ru/katalog-investorov/",
      title: "Каталог инвесторов — поиск партнёра",
      snippet: "База инвесторов России",
    }),
    "LIST",
  );
  assert.equal(
    classifyPageType({
      url: "https://habr.com/ru/articles/887322/",
      title: "Как продать свой бизнес быстро и дорого",
    }),
    "UNKNOWN",
  );
  assert.equal(
    classifyPageType({
      url: "https://optima-invest.ru/obekty/345/",
      title: "Продажа объекта оптовой торговли",
    }),
    "DETAIL",
  );
  assert.ok(isCatalogPageType("LIST"));
  assert.ok(!isCatalogPageType("DETAIL"));
  ok("page_type DETAIL/LIST/HOMEPAGE");
}

// Scoring prefers DETAIL over catalog
{
  const plan = buildSearchPlan(
    "Найди 10 перспективных бизнес-возможностей до 30 млн ₽ по России",
  );
  const catalog: ExternalSearchResult = {
    id: "c1",
    title: "Каталог – купить готовый бизнес от 30 млн",
    description: "Все объявления",
    url: "https://bzbroker.ru/catalog",
    source: "serper",
    published_at: "",
    trust_score: 0.4,
    trusted: false,
  };
  const detail: ExternalSearchResult = {
    id: "d1",
    title: "Продаётся производство снеков — 28 млн рублей, Краснодар",
    description:
      "Действующее производство ищет покупателя/инвестора. Цена 28 млн ₽. Краснодарский край. Площадь 1200 м².",
    url: "https://example-business.ru/offer/snacks-28m",
    source: "serper",
    published_at: "2026-08-01",
    trust_score: 0.5,
    trusted: false,
  };
  const cat = analyzeCandidate(normalizeHit(mapExternalResultToHit(catalog)), plan);
  const det = analyzeCandidate(normalizeHit(mapExternalResultToHit(detail)), plan);
  assert.equal(cat.pageType, "LIST");
  assert.equal(det.pageType, "DETAIL");
  assert.ok(cat.isCatalogSource);
  assert.ok(!det.isCatalogSource);
  assert.ok(
    det.score.overall > cat.score.overall,
    `detail ${det.score.overall} should beat catalog ${cat.score.overall}`,
  );
  assert.ok(det.score.quality > cat.score.quality);
  assert.ok(typeof det.score.relevance === "number");
  assert.ok(typeof det.score.opportunity === "number");
  assert.ok(det.score.whyTop.some((w) => /DETAIL|цена|регион/i.test(w)));
  ok("DETAIL outranks catalog; multi-scores present");
}

console.log("\nAll LIA OI Stage 2A.1 checks passed.\n");
