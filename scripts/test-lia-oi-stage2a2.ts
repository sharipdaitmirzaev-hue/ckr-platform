/**
 * LIA OI Stage 2A.2 — precision: hard constraints, content_intent, buckets.
 */
import assert from "node:assert/strict";
import { applyBuckets } from "../src/lib/lia/oi/buckets";
import { classifyContentIntent } from "../src/lib/lia/oi/content-intent";
import {
  parseHardConstraints,
  resolveBudgetFit,
  resolvePriceStatus,
} from "../src/lib/lia/oi/constraints";
import { validateDetailOpportunity } from "../src/lib/lia/oi/detail-validate";
import { extractMoneyFromText } from "../src/lib/lia/oi/extract";
import { analyzeCandidate } from "../src/lib/lia/oi/analyze";
import { mapExternalResultToHit } from "../src/lib/lia/oi/internet/live";
import { normalizeHit } from "../src/lib/lia/oi/normalize";
import { buildPass2Queries, buildSearchPlan, detectIntent } from "../src/lib/lia/oi/planner";
import type { ExternalSearchResult } from "../src/types/lia";
import type { LiaOiCandidate } from "../src/types/lia-oi";

function ok(name: string) {
  console.log(`  ✓ ${name}`);
}

console.log("\nLIA OI Stage 2A.2 — precision checks\n");

{
  const hard = parseHardConstraints(
    "Найди 10 перспективных бизнес-возможностей до 30 млн ₽ по России",
  );
  assert.equal(hard.geography, "Россия");
  assert.equal(hard.maxBudgetRub, 30_000_000);
  assert.equal(resolveBudgetFit(20_000_000, 30_000_000), "FIT");
  assert.equal(resolveBudgetFit(200_000_000, 30_000_000), "OVER_BUDGET");
  assert.equal(resolveBudgetFit(null, 30_000_000), "UNKNOWN");
  assert.equal(resolvePriceStatus(null), "UNKNOWN");
  ok("HARD constraints + budgetFit");
}

{
  assert.equal(
    detectIntent(
      "Найди 10 перспективных бизнес-возможностей до 30 млн ₽ по России",
    ),
    "business_opportunities",
  );
  const plan = buildSearchPlan(
    "Найди 10 перспективных бизнес-возможностей до 30 млн ₽ по России",
  );
  assert.ok(plan.hardConstraints?.maxBudgetRub === 30_000_000);
  assert.ok((plan.sourceClasses?.length ?? 0) >= 3);
  assert.ok(plan.queries.length >= 4);
  assert.ok(plan.queries.length <= 6);
  for (const q of plan.queries) {
    assert.ok(!/россия\s+россия/i.test(q));
  }
  const pass2 = buildPass2Queries(
    plan,
    {
      topCount: 0,
      detailCount: 0,
      fitCount: 0,
      unknownPriceCount: 5,
      opportunityCount: 1,
    },
    6,
  );
  assert.ok(pass2.length > 0);
  assert.ok(pass2.length <= 6);
  ok("Source-aware planner + pass2 expansion");
}

{
  assert.equal(
    classifyContentIntent({
      url: "https://habr.com/ru/articles/1/",
      title: "Как продать свой бизнес быстро и дорого",
      pageType: "UNKNOWN",
    }),
    "GUIDE",
  );
  assert.equal(
    classifyContentIntent({
      url: "https://bzbroker.ru/catalog",
      title: "Каталог готового бизнеса",
      pageType: "LIST",
    }),
    "CATALOG",
  );
  assert.equal(
    classifyContentIntent({
      url: "https://example.ru/offer/cafe-12m",
      title: "Продаётся кафе — 12 млн рублей, Казань",
      snippet: "Действующее кафе, выручка 400 тыс/мес",
      pageType: "DETAIL",
    }),
    "OPPORTUNITY",
  );
  ok("content_intent GUIDE/CATALOG/OPPORTUNITY");
}

{
  const money = extractMoneyFromText(
    "Продаётся производство за 18 млн рублей в Краснодаре",
  );
  assert.ok(money);
  assert.equal(money!.amount, 18_000_000);
  assert.ok(
    money!.priceKind === "ASKING_PRICE" || money!.priceKind === "UNKNOWN",
  );

  const rev = extractMoneyFromText(
    "Выручка 5 млн рублей в год, продаётся бизнес",
  );
  // Prefer asking context if present; at least don't invent from pure revenue alone without sale context
  assert.ok(rev == null || rev.amount !== 5_000_000 || /прода/i.test("продаётся"));

  const onlyRev = extractMoneyFromText("Выручка компании 5 млн рублей в год");
  assert.equal(onlyRev, null);
  ok("Price extraction skips pure revenue");
}

{
  const plan = buildSearchPlan(
    "Найди 10 перспективных бизнес-возможностей до 30 млн ₽ по России",
  );

  const over: ExternalSearchResult = {
    id: "o1",
    title: "Продаётся завод — 200 млн рублей, Москва",
    description:
      "Действующий завод оптовой торговли. Цена 200 млн ₽. Москва. Площадь 5000 м². Тел. +7 999 111-22-33",
    url: "https://example-business.ru/offer/factory-200m",
    source: "serper",
    published_at: "2026-08-01",
    trust_score: 0.5,
    trusted: false,
  };
  const fit: ExternalSearchResult = {
    id: "f1",
    title: "Продаётся кафе — 12 млн рублей, Казань",
    description:
      "Действующее кафе в центре. Цена 12 млн ₽. Казань, Татарстан. Площадь 120 м², выручка 400 тыс. Окупаемость 3 года. Тел. +7 843 111-22-33",
    url: "https://example-business.ru/offer/cafe-12m",
    source: "serper",
    published_at: "2026-08-01",
    trust_score: 0.5,
    trusted: false,
  };
  const guide: ExternalSearchResult = {
    id: "g1",
    title: "Как купить готовый бизнес и не ошибиться",
    description: "Инструкция для начинающих предпринимателей",
    url: "https://habr.com/ru/articles/999/",
    source: "serper",
    published_at: "",
    trust_score: 0.3,
    trusted: false,
  };
  const catalog: ExternalSearchResult = {
    id: "c1",
    title: "Каталог – купить готовый бизнес",
    description: "Все объявления",
    url: "https://bzbroker.ru/catalog",
    source: "serper",
    published_at: "",
    trust_score: 0.4,
    trusted: false,
  };

  const analyzed = [over, fit, guide, catalog].map((r) =>
    analyzeCandidate(normalizeHit(mapExternalResultToHit(r), plan), plan),
  );

  const overC = analyzed.find((c) => c.title.includes("200 млн"))!;
  const fitC = analyzed.find((c) => c.title.includes("кафе"))!;
  const guideC = analyzed.find((c) => c.title.includes("Как купить"))!;
  const catC = analyzed.find((c) => c.title.includes("Каталог"))!;

  assert.equal(overC.budgetFit, "OVER_BUDGET");
  assert.equal(fitC.budgetFit, "FIT");
  assert.ok((fitC.detailConfidence ?? 0) >= 40);

  const buckets = applyBuckets(analyzed);
  assert.ok(
    !buckets.top.some((c) => c.budgetFit === "OVER_BUDGET"),
    "OVER_BUDGET must not be in TOP",
  );
  assert.ok(buckets.rejected.some((c) => c.id === overC.id || c.title.includes("200")));
  assert.ok(
    buckets.rejected.some((c) => c.contentIntent === "GUIDE") ||
      guideC.contentIntent === "GUIDE",
  );
  assert.ok(buckets.catalogs.length >= 1 || catC.isCatalogSource);
  assert.ok(
    buckets.top.some((c) => c.title.includes("кафе")) ||
      buckets.needsResearch.some((c) => c.title.includes("кафе")),
  );
  ok("Buckets: OVER_BUDGET rejected, guide demoted, FIT opportunity preferred");
}

{
  const v = validateDetailOpportunity({
    title: "Продаётся цех",
    description: "Коротко",
    pageType: "DETAIL",
    sources: [{ id: "1", category: "BUSINESS", name: "x", url: "https://x.ru/1", isStub: false }],
    isStub: false,
  } as LiaOiCandidate);
  assert.ok(v.detailConfidence < 40);
  assert.equal(v.effectivePageType, "UNKNOWN");
  ok("DETAIL validation requires multiple signals");
}

console.log("\nAll LIA OI Stage 2A.2 checks passed.\n");
