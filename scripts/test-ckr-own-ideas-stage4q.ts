/**
 * Stage 4Q — Собственные идеи ЦКР (no network, no production writes).
 * Run: npm run test:ckr-own-ideas-stage4q
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CKR_OWN_IDEAS_FORBIDDEN } from "../src/config/ckr-own-ideas";
import { operatorPrimaryNav, operatorSystemNav } from "../src/config/navigation";
import {
  applyOwnerAction,
  computeRoughEconomics,
  formatPaybackMonths,
  FINANCING_SAFE_WORDING,
  findMissingResource,
  hasGuaranteedProfitWording,
  internalCapitalCatalog,
  isNegativeEconomics,
  landTourismCatalog,
  missingFinancingCatalog,
  negativeEconomicsCatalog,
  procurementCatalog,
  rateOwnIdea,
  runOwnIdeaBuilder,
  searchInternalFirst,
  tractorEarthworksCatalog,
} from "../src/lib/ckr-own-ideas";
import { memoryOwnIdeaStore } from "../src/lib/ckr-own-ideas/store";
import type { OwnIdeaComponent } from "../src/types/ckr-own-ideas";

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

function component(partial: Partial<OwnIdeaComponent> & Pick<OwnIdeaComponent, "kind" | "title">): OwnIdeaComponent {
  return {
    id: partial.id || partial.title,
    origin: "EXTERNAL",
    identityKey: null,
    officialId: null,
    canonicalUrl: null,
    amount: null,
    found: true,
    requiresCheck: false,
    provenance: {
      kind: "FACT",
      sourceType: "test",
      sourceUrl: null,
      sourceLabel: "test",
      fetchedAt: null,
      verifiedAt: null,
      trustLevel: "official",
    },
    ...partial,
  };
}

async function main() {
  memoryOwnIdeaStore.reset();

  await test("1. asset+demand creates candidate idea", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.ok(ideas.length >= 1);
    const kinds = ideas[0].components.filter((c) => c.found).map((c) => c.kind);
    assert.ok(kinds.includes("ASSET"));
    assert.ok(kinds.includes("DEMAND"));
    assert.equal(ideas[0].visibility, "OWNER_ONLY");
    assert.equal(ideas[0].ownerState, "REVIEW");
  });

  await test("2. capital gap detected", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: missingFinancingCatalog() });
    assert.ok(ideas[0].missing.some((m) => m.kind === "CAPITAL"));
  });

  await test("3. internal-first capital search", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: internalCapitalCatalog() });
    const cap = ideas[0].components.find((c) => c.kind === "CAPITAL" && c.found);
    assert.ok(cap);
    assert.equal(cap?.origin, "INTERNAL_CKR");
  });

  await test("4. external financing fallback", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    const cap = ideas[0].components.find((c) => c.kind === "CAPITAL" && c.found);
    assert.ok(cap);
    assert.equal(cap?.origin, "EXTERNAL");
    assert.ok(ideas[0].events.some((e) => e.note.includes(FINANCING_SAFE_WORDING)));
  });

  await test("5. missing resource retained", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: missingFinancingCatalog() });
    assert.ok(ideas.length >= 1);
    assert.ok(ideas[0].missing.some((m) => /финанс/i.test(m.reason)));
  });

  await test("6. rough economics", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.ok(ideas[0].economics.capex.amount != null);
    assert.ok(ideas[0].economics.revenue.amount != null);
    assert.ok(ideas[0].economics.disclaimer.includes("Не является гарантией"));
    assert.match(formatPaybackMonths(ideas[0].economics.paybackMonths), /мес|UNKNOWN/);
    assert.doesNotMatch(formatPaybackMonths(ideas[0].economics.paybackMonths), /₽|млн/);
  });

  await test("7. UNKNOWN not invented", () => {
    const e = computeRoughEconomics([
      component({
        kind: "ASSET",
        title: "без цены",
        amount: null,
      }),
    ]);
    assert.equal(e.capex.kind, "UNKNOWN");
    assert.equal(e.fixedCosts.kind, "UNKNOWN");
    assert.equal(e.fixedCosts.amount, null);
  });

  await test("8. negative economics weak", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: negativeEconomicsCatalog() });
    assert.equal(ideas[0].rating, "weak");
    assert.ok(isNegativeEconomics(ideas[0].economics));
  });

  await test("9. dedup", () => {
    const catalog = tractorEarthworksCatalog();
    const first = runOwnIdeaBuilder({ catalog });
    const second = runOwnIdeaBuilder({ catalog, existing: first.ideas });
    assert.equal(second.metrics.ideasGenerated, 0);
    assert.ok(second.metrics.ideasUpdated >= 1);
    assert.equal(second.ideas[0].fingerprint, first.ideas[0].fingerprint);
    assert.ok(first.ideas[0].fingerprint.length > 8);
  });

  await test("10. rediscovery keeps owner edits", () => {
    const catalog = tractorEarthworksCatalog();
    const first = runOwnIdeaBuilder({ catalog });
    const locked = {
      ...first.ideas[0],
      title: "OWNER TITLE",
      ownerLockedFields: ["title"],
    };
    const second = runOwnIdeaBuilder({ catalog, existing: [locked] });
    assert.equal(second.ideas[0].title, "OWNER TITLE");
    assert.ok(second.ideas[0].events.some((e) => e.type === "rediscovery_updated"));
  });

  await test("11. owner lock + review actions", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    const accepted = applyOwnerAction(ideas[0], "accept");
    assert.equal(accepted.ownerState, "ACCEPTED");
    const rejected = applyOwnerAction(ideas[0], "reject");
    assert.equal(rejected.ownerState, "REJECTED");
    const proj = applyOwnerAction(ideas[0], "create_project", "proj-1");
    assert.equal(proj.ownerState, "PROJECT_CREATED");
    assert.equal(proj.projectId, "proj-1");
  });

  await test("12. owner-only privacy", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: landTourismCatalog() });
    assert.equal(ideas[0].visibility, "OWNER_ONLY");
    const page = read("src/app/(admin)/admin/owner/own-ideas/page.tsx");
    assert.match(page, /requireLiaOiOwner/);
  });

  await test("13. no auto publish", () => {
    const { metrics, forbidden } = runOwnIdeaBuilder({
      catalog: tractorEarthworksCatalog(),
    });
    assert.equal(metrics.autoPublish, false);
    assert.equal(forbidden.autoPublish, false);
    const list = read("src/app/(admin)/admin/owner/own-ideas/page.tsx");
    assert.doesNotMatch(list, /Опубликовать|publish CTA|marketplace/);
  });

  await test("14. no outreach", () => {
    const { metrics, forbidden } = runOwnIdeaBuilder({
      catalog: procurementCatalog(),
    });
    assert.equal(metrics.autoOutreach, false);
    assert.equal(forbidden.autoOutreach, false);
    assert.equal(CKR_OWN_IDEAS_FORBIDDEN.autoApplication, false);
  });

  await test("15. no Matching edges", () => {
    const { metrics } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.equal(metrics.matchingEdges, false);
    const builder = read("src/lib/ckr-own-ideas/builder.ts");
    assert.doesNotMatch(builder, /MATCHES|Matching Engine/);
  });

  await test("16. no Scheduler", () => {
    const { metrics } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.equal(metrics.scheduler, false);
    const actions = read("src/features/ckr-own-ideas/actions.ts");
    assert.match(actions, /findNewOwnIdeasAction/);
    assert.doesNotMatch(actions, /cron|schedule\(/);
  });

  await test("17. idea→project only owner action", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.equal(ideas[0].projectId, null);
    assert.notEqual(ideas[0].ownerState, "PROJECT_CREATED");
  });

  await test("18. financing wording safe", () => {
    assert.ok(!hasGuaranteedProfitWording(FINANCING_SAFE_WORDING));
    assert.ok(FINANCING_SAFE_WORDING.includes("потенциальный"));
    assert.ok(hasGuaranteedProfitWording("гарантированная прибыль"));
  });

  await test("19. source provenance", () => {
    const { ideas } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    for (const c of ideas[0].components) {
      assert.ok(c.provenance.kind);
      assert.ok(c.provenance.sourceLabel);
      assert.ok(c.provenance.trustLevel);
    }
  });

  await test("20. run budget stop", () => {
    const { metrics } = runOwnIdeaBuilder({ catalog: tractorEarthworksCatalog() });
    assert.ok(metrics.queries <= 12);
    assert.ok(metrics.depthReached <= 3);
    assert.ok(metrics.externalCalls <= 8);
  });

  await test("21. no-client market driven", () => {
    const { metrics, ideas } = runOwnIdeaBuilder({
      catalog: tractorEarthworksCatalog(),
    });
    assert.equal(metrics.clientRequestUsed, false);
    assert.ok(ideas[0].whyNoticed.includes("без входящей заявки"));
  });

  await test("22. staging cleanup helpers exist", () => {
    const persist = read("src/lib/ckr-own-ideas/persist.ts");
    assert.match(persist, /deleteOwnIdeaExact/);
    const e2e = read("scripts/e2e-ckr-own-ideas-stage4q-smoke.ts");
    assert.match(e2e, /CLEANUP_OK|RESIDUAL_SMOKE_ROWS/);
  });

  await test("internal search used before external", () => {
    const hits = searchInternalFirst("CAPITAL", "лизинг спецтехники", [
      {
        id: "i1",
        kind: "CAPITAL",
        title: "Лизинг спецтехники внутри",
        origin: "INTERNAL_CKR",
      },
    ]);
    assert.equal(hits[0].origin, "INTERNAL_CKR");
    const miss = findMissingResource({
      kind: "TEAM",
      query: "оператор",
      internal: [],
      external: [],
    });
    assert.equal(miss.hit, null);
    assert.equal(miss.searchedInternal, true);
    assert.equal(miss.searchedExternal, true);
  });

  await test("rating uses completeness not magic AI", () => {
    assert.equal(
      rateOwnIdea({
        components: [],
        missing: [],
        economics: computeRoughEconomics([]),
      }),
      "missing_data",
    );
  });

  await test("owner nav + no Synthesis Engine label", () => {
    assert.ok(operatorPrimaryNav.some((i) => i.label === "Собственные идеи ЦКР"));
    assert.ok(
      operatorSystemNav.some((i) => i.href === "/admin/owner/own-ideas/diagnostics"),
    );
    const nav = read("src/config/navigation.ts");
    assert.doesNotMatch(nav, /Synthesis Engine|Autonomous Agent|Composite Match/);
  });

  await test("migration additive owner-only", () => {
    const sql = read("supabase/migrations/20260823220000_ckr_own_ideas_stage4q.sql");
    assert.match(sql, /create table if not exists public.ckr_own_ideas/);
    assert.match(sql, /is_admin/);
    assert.match(sql, /OWNER_ONLY/);
    assert.doesNotMatch(sql, /\bDROP TABLE\b|\bTRUNCATE\b/i);
  });

  await test("4P action loop still present", () => {
    const p = read("src/lib/ckr-action-loop/derive.ts");
    assert.match(p, /deriveActionsFromEvents/);
  });

  console.log(`${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main();
