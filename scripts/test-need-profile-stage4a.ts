/**
 * Stage 4A — Need Profile tests (in-memory).
 * Run: npx tsx scripts/test-need-profile-stage4a.ts
 */
import assert from "node:assert/strict";
import { createMemoryBusinessGraphService } from "../src/lib/business-graph/service";
import { createMemoryNeedProfileService } from "../src/lib/need-profile/service";
import { parseNeedProfileDrafts } from "../src/lib/need-profile/nl-parser";
import { mapIntentToGraphNodeType } from "../src/lib/need-profile/graph-bridge";

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

async function main() {
  await test("create + update intent", async () => {
    const svc = createMemoryNeedProfileService();
    svc.resetForTests();
    const { need, created } = await svc.create({
      intentType: "INVEST",
      title: "Инвестиции в производство",
      ownerType: "user",
      ownerId: "u1",
      budgetMax: 20_000_000,
      regions: ["Дагестан"],
      industries: ["manufacturing"],
      status: "ACTIVE",
    });
    assert.equal(created, true);
    const updated = await svc.update(need.id, { title: "Обновлено" });
    assert.equal(updated.title, "Обновлено");
  });

  await test("multiple intents per user", async () => {
    const svc = createMemoryNeedProfileService();
    svc.resetForTests();
    await svc.create({
      intentType: "INVEST",
      title: "A",
      ownerType: "user",
      ownerId: "u1",
      status: "ACTIVE",
      budgetMax: 10,
    });
    await svc.create({
      intentType: "BUY_BUSINESS",
      title: "B",
      ownerType: "user",
      ownerId: "u1",
      status: "ACTIVE",
      budgetMax: 15,
    });
    const active = await svc.getActiveIntents({
      ownerType: "user",
      ownerId: "u1",
    });
    assert.equal(active.length, 2);
  });

  await test("pause fulfill archive", async () => {
    const svc = createMemoryNeedProfileService();
    svc.resetForTests();
    const { need } = await svc.create({
      intentType: "SEEK_PARTNER",
      title: "P",
      ownerType: "user",
      ownerId: "u1",
      status: "ACTIVE",
    });
    assert.equal((await svc.setStatus(need.id, "PAUSED")).status, "PAUSED");
    assert.equal((await svc.setStatus(need.id, "FULFILLED")).status, "FULFILLED");
    assert.equal((await svc.setStatus(need.id, "ARCHIVED")).status, "ARCHIVED");
  });

  await test("organization intent", async () => {
    const svc = createMemoryNeedProfileService();
    svc.resetForTests();
    const { need } = await svc.create({
      intentType: "SUPPLY",
      title: "Org supply",
      ownerType: "organization",
      ownerId: "org-1",
      status: "ACTIVE",
    });
    const list = await svc.getActiveIntents({
      ownerType: "organization",
      ownerId: "org-1",
    });
    assert.equal(list[0]?.id, need.id);
  });

  await test("visibility field", async () => {
    const svc = createMemoryNeedProfileService();
    svc.resetForTests();
    const { need } = await svc.create({
      intentType: "DEMAND",
      title: "Private",
      ownerType: "user",
      ownerId: "u1",
      visibility: "PRIVATE",
      status: "ACTIVE",
    });
    assert.equal(need.visibility, "PRIVATE");
  });

  await test("NL scenario A INVEST", () => {
    const r = parseNeedProfileDrafts(
      "Есть 20 млн ₽, хочу инвестировать в производство в Дагестане или Ставропольском крае",
    );
    assert.ok(r.drafts.some((d) => d.intentType === "INVEST"));
    const d = r.drafts.find((d) => d.intentType === "INVEST")!;
    assert.equal(d.budgetMax, 20_000_000);
    assert.ok(d.regions.includes("Дагестан"));
    assert.ok(d.regions.some((x) => x.includes("Ставропол")));
    assert.ok(d.industries.includes("manufacturing"));
    assert.equal(d.requiresConfirmation, true);
  });

  await test("NL scenario B SEEK_INVESTMENT", () => {
    const r = parseNeedProfileDrafts(
      "Ищу инвестора. Нужно 50 млн ₽ на гостиничный проект на берегу моря",
    );
    assert.ok(r.drafts.some((d) => d.intentType === "SEEK_INVESTMENT"));
    const d = r.drafts.find((d) => d.intentType === "SEEK_INVESTMENT")!;
    assert.equal(d.budgetMax, 50_000_000);
    assert.ok(d.industries.includes("hospitality"));
  });

  await test("NL scenario C SEEK_BUYER", () => {
    const r = parseNeedProfileDrafts(
      "Поставляем напитки по Дагестану. Ищем магазины, рестораны и гостиницы",
    );
    assert.ok(r.drafts.some((d) => d.intentType === "SEEK_BUYER"));
  });

  await test("NL scenario D multi intents + confirm", async () => {
    const r = parseNeedProfileDrafts(
      "Есть участок 80 соток у моря. Ищу инвестора или партнёра для строительства гостиницы",
    );
    assert.equal(r.contextGroupSuggested, true);
    assert.ok(r.drafts.some((d) => d.intentType === "SEEK_INVESTMENT"));
    assert.ok(r.drafts.some((d) => d.intentType === "SEEK_PARTNER"));

    const svc = createMemoryNeedProfileService();
    svc.resetForTests();
    const created = await svc.confirmDrafts({
      drafts: r.drafts,
      ownerType: "user",
      ownerId: "u1",
      createdBy: "u1",
      activate: true,
    });
    assert.ok(created.length >= 2);
    assert.ok(created.every((n) => n.contextGroupId));
    assert.equal(created[0]?.contextGroupId, created[1]?.contextGroupId);
    const hist = await svc.getHistory(created[0]!.id);
    assert.ok(hist.some((h) => h.eventType === "CONFIRMED_FROM_NL"));
  });

  await test("confirmation required — parse does not persist", async () => {
    const svc = createMemoryNeedProfileService();
    svc.resetForTests();
    parseNeedProfileDrafts("Есть 20 млн, хочу вложить в производство");
    const active = await svc.getActiveIntents({
      ownerType: "user",
      ownerId: "u1",
    });
    assert.equal(active.length, 0);
  });

  await test("duplicate protection", async () => {
    const svc = createMemoryNeedProfileService();
    svc.resetForTests();
    const a = await svc.create({
      intentType: "INVEST",
      title: "Same",
      ownerType: "user",
      ownerId: "u1",
      budgetMax: 20_000_000,
      regions: ["Дагестан"],
      industries: ["manufacturing"],
      status: "ACTIVE",
    });
    const b = await svc.create({
      intentType: "INVEST",
      title: "Same",
      ownerType: "user",
      ownerId: "u1",
      budgetMax: 20_000_000,
      regions: ["Дагестан"],
      industries: ["manufacturing"],
      status: "ACTIVE",
    });
    assert.equal(a.created, true);
    assert.equal(b.created, false);
    assert.equal(a.need.id, b.need.id);
  });

  await test("Graph bridge without MATCHES", async () => {
    const svc = createMemoryNeedProfileService();
    svc.resetForTests();
    const graph = createMemoryBusinessGraphService();
    await graph.resetForTests();
    const { need } = await svc.create({
      intentType: "INVEST",
      title: "Capital need",
      ownerType: "user",
      ownerId: "u1",
      status: "ACTIVE",
      budgetMax: 20_000_000,
    });
    assert.equal(mapIntentToGraphNodeType("INVEST"), "CAPITAL");
    const { nodeId } = await svc.bridgeToGraph(need.id, graph);
    const node = await graph.getNode(nodeId);
    assert.equal(node?.nodeType, "CAPITAL");
    assert.equal(node?.sourceType, "need_profile");
    const edges = await graph.getEdges({ nodeId });
    assert.equal(
      edges.filter((e) => e.relationshipType === "MATCHES").length,
      0,
    );
    const hist = await svc.getHistory(need.id);
    assert.ok(hist.some((h) => h.eventType === "GRAPH_BRIDGED"));
  });

  await test("getActiveIntents ignores paused", async () => {
    const svc = createMemoryNeedProfileService();
    svc.resetForTests();
    const { need } = await svc.create({
      intentType: "SEEK_SUPPORT",
      title: "Grant",
      ownerType: "user",
      ownerId: "u1",
      status: "ACTIVE",
    });
    await svc.setStatus(need.id, "PAUSED");
    const active = await svc.getActiveIntents({
      ownerType: "user",
      ownerId: "u1",
    });
    assert.equal(active.length, 0);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
