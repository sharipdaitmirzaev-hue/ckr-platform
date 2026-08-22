/**
 * Stage 3A — Business Graph foundation tests (in-memory, no DB apply).
 *
 * Run: npx tsx scripts/test-business-graph-stage3a.ts
 */
import assert from "node:assert/strict";
import { loadStage3aFixtureScenario } from "../src/lib/business-graph/fixtures/stage3a-scenario";
import { createMemoryBusinessGraphService } from "../src/lib/business-graph/service";
import { runOwnerGraphSync } from "../src/lib/business-graph/sync";
import type { LiaOiCandidate } from "../src/types/lia-oi";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(error instanceof Error ? error.stack : error);
  }
}

async function freshService() {
  const svc = createMemoryBusinessGraphService();
  await svc.resetForTests();
  return svc;
}

function minimalOi(
  partial: Partial<LiaOiCandidate> & { id: string; title: string },
): LiaOiCandidate {
  return {
    type: "opportunity",
    description: partial.description || "",
    summary: partial.summary || "",
    whyInteresting: [],
    recommendation: "",
    nextStep: "",
    status: "new",
    country: "RU",
    sources: [],
    claims: [],
    risks: [],
    unknowns: [],
    toVerify: [],
    score: {
      overall: 50,
      confidence: 40,
      relevance: 40,
      quality: 30,
      opportunity: 55,
      breakdown: {
        market: 50,
        economics: 50,
        location: 50,
        demand: 50,
        competition: 50,
        execution: 50,
        legal: 50,
        sourceConfidence: 40,
        dataCompleteness: 30,
        strategicFit: 40,
      },
      explanation: [],
      whyTop: [],
      priority: "NORMAL",
    },
    matchHints: [],
    firstSeenAt: "2026-08-11T00:00:00.000Z",
    lastSeenAt: "2026-08-11T00:00:00.000Z",
    canonicalKey: partial.canonicalKey || `ck-${partial.id}`,
    rawStubIds: [],
    isStub: true,
    pageType: "detail",
    isCatalogSource: false,
    ...partial,
  } as LiaOiCandidate;
}

async function main() {
  await test("create + update node by source", async () => {
    const svc = await freshService();
    const a = await svc.createOrUpdateNode({
      nodeType: "COMPANY",
      title: "ООО Ромашка",
      sourceType: "manual",
      sourceId: "company-1",
      dataConfidence: 90,
    });
    const b = await svc.createOrUpdateNode({
      nodeType: "COMPANY",
      title: "ООО «Ромашка»",
      sourceType: "manual",
      sourceId: "company-1",
      description: "updated",
      dataConfidence: 95,
    });
    assert.equal(a.created, true);
    assert.equal(b.created, false);
    assert.equal(a.node.id, b.node.id);
    assert.equal(b.node.description, "updated");
    assert.equal(b.node.dataConfidence, 95);
  });

  await test("identity: strong INN reuse, weak name does not merge", async () => {
    const svc = await freshService();
    const a = await svc.createOrUpdateNode({
      nodeType: "COMPANY",
      title: "Ромашка",
      region: "Москва",
    });
    const b = await svc.createOrUpdateNode({
      nodeType: "COMPANY",
      title: "Ромашка",
      region: "Москва",
    });
    assert.notEqual(a.node.id, b.node.id);
    assert.equal(a.node.fingerprint, null);

    const withInn1 = await svc.createOrUpdateNode({
      nodeType: "COMPANY",
      title: "ООО А",
      structuredData: { inn: "7701234567" },
    });
    const withInn2 = await svc.createOrUpdateNode({
      nodeType: "COMPANY",
      title: "ООО А обновл",
      structuredData: { inn: "7701234567" },
    });
    assert.equal(withInn1.node.id, withInn2.node.id);
    assert.ok(withInn1.node.fingerprint);
  });

  await test("no duplicate by source_type+source_id", async () => {
    const svc = await freshService();
    const a = await svc.createOrUpdateNode({
      nodeType: "DEMAND",
      title: "A",
      sourceType: "lia_oi_opportunity",
      sourceId: "oi-1",
    });
    const b = await svc.createOrUpdateNode({
      nodeType: "DEMAND",
      title: "A updated",
      sourceType: "lia_oi_opportunity",
      sourceId: "oi-1",
    });
    assert.equal(a.node.id, b.node.id);
    assert.equal(b.node.title, "A updated");
  });

  await test("alias", async () => {
    const svc = await freshService();
    const n = (
      await svc.createOrUpdateNode({
        nodeType: "COMPANY",
        title: "ООО Ромашка",
        sourceType: "manual",
        sourceId: "alias-co-1",
      })
    ).node;
    await svc.addAlias(n.id, "Romashka LLC", "manual");
    await svc.addAlias(n.id, "Romashka LLC", "manual");
    const history = await svc.getNodeHistory(n.id);
    assert.equal(
      history.filter((h) => h.eventType === "ALIAS_ADDED").length,
      1,
    );
  });

  await test("edge + provenance + scores separation", async () => {
    const svc = await freshService();
    const capital = (
      await svc.createOrUpdateNode({
        nodeType: "CAPITAL",
        title: "Investor",
        sourceType: "fixture",
        sourceId: "cap-score",
        dataConfidence: 95,
        opportunityAttractiveness: 61,
      })
    ).node;
    const project = (
      await svc.createOrUpdateNode({
        nodeType: "PROJECT",
        title: "Plant",
        sourceType: "fixture",
        sourceId: "proj-score",
        dataConfidence: 90,
      })
    ).node;
    const edge = (
      await svc.createOrUpdateEdge({
        sourceNodeId: capital.id,
        targetNodeId: project.id,
        relationshipType: "CAN_FINANCE",
        confidence: 72,
        provenanceType: "INFERENCE",
        reasoningSummary: "budget fits project need",
        matchClass: "SOFT",
      })
    ).edge;
    assert.equal(edge.provenanceType, "INFERENCE");
    assert.equal(edge.confidence, 72);
    assert.notEqual(edge.confidence, capital.dataConfidence);
  });

  await test("temporal archive keeps history", async () => {
    const svc = await freshService();
    const a = (
      await svc.createOrUpdateNode({
        nodeType: "SUPPORT",
        title: "Grant",
        sourceType: "fixture",
        sourceId: "sup-t",
      })
    ).node;
    const b = (
      await svc.createOrUpdateNode({
        nodeType: "PROJECT",
        title: "P",
        sourceType: "fixture",
        sourceId: "proj-t",
      })
    ).node;
    const e1 = (
      await svc.createOrUpdateEdge({
        sourceNodeId: a.id,
        targetNodeId: b.id,
        relationshipType: "SUPPORTED_BY",
        provenanceType: "FACT",
        isCurrent: true,
      })
    ).edge;
    await svc.archiveEdge(e1.id, "2026-12-31T00:00:00.000Z");
    const current = await svc.getEdges({ nodeId: a.id, currentOnly: true });
    assert.equal(current.length, 0);
    const all = await svc.getEdges({ nodeId: a.id, currentOnly: false });
    assert.equal(all[0]?.isCurrent, false);
    assert.equal(all[0]?.status, "ARCHIVED");
  });

  await test("owner confirm/reject/comment + history", async () => {
    const svc = await freshService();
    const a = (
      await svc.createOrUpdateNode({
        nodeType: "PROPERTY",
        title: "Site",
        sourceType: "fixture",
        sourceId: "prop-cr",
      })
    ).node;
    const b = (
      await svc.createOrUpdateNode({
        nodeType: "PROJECT",
        title: "P",
        sourceType: "fixture",
        sourceId: "proj-cr",
      })
    ).node;
    const e = (
      await svc.createOrUpdateEdge({
        sourceNodeId: a.id,
        targetNodeId: b.id,
        relationshipType: "SUITABLE_FOR",
        provenanceType: "ESTIMATE",
        createdByKind: "LIA",
      })
    ).edge;
    assert.equal((await svc.confirmEdge(e.id, "owner-1", "ok")).status, "CONFIRMED");
    assert.equal((await svc.rejectEdge(e.id, "owner-1", "no")).status, "REJECTED");
    const commented = await svc.commentEdge(e.id, "owner-1", "note");
    assert.equal(commented.ownerComment, "note");
    const history = await svc.getNodeHistory(a.id);
    assert.ok(history.some((h) => h.eventType === "EDGE_CONFIRMED"));
    assert.ok(history.some((h) => h.eventType === "EDGE_REJECTED"));
    assert.ok(history.some((h) => h.eventType === "OWNER_COMMENT"));
  });

  await test("OI → graph bridge no duplicate", async () => {
    const svc = await freshService();
    const oi = minimalOi({
      id: "oi-bridge-1",
      title: "Закупка сырья",
      opportunityType: "PROCUREMENT",
      fingerprint: "fp-abc",
      canonicalUrl: "https://example.com/t",
      sourceObjectId: "proc-1",
      sourceConfidence: 80,
      dataQualityScore: 70,
      region: "Татарстан",
    });
    const n1 = await svc.bridgeFromOiCandidate(oi);
    const n2 = await svc.bridgeFromOiCandidate(oi);
    assert.equal(n1.id, n2.id);
    assert.equal(n1.nodeType, "DEMAND");
    assert.equal(n1.visibility, "OWNER_ONLY");
  });

  await test("internal project → graph + batch sync", async () => {
    const svc = await freshService();
    const project = {
      id: "proj-1",
      title: "Завод",
      description: "desc",
      region: "Казань",
      status: "published",
    };
    const n1 = await svc.bridgeFromProject(project);
    const n2 = await svc.bridgeFromProject(project);
    assert.equal(n1.id, n2.id);
    const summary = await runOwnerGraphSync({
      service: svc,
      projects: [project],
      investments: [
        {
          id: "inv-1",
          title: "Капитал 10м",
          budgetMax: 10_000_000,
          regions: ["Казань"],
        },
      ],
      oiCandidates: [
        minimalOi({
          id: "oi-sync-1",
          title: "Сигнал",
          opportunityType: "OTHER",
        }),
      ],
    });
    assert.equal(summary.projectsUpserted, 1);
    assert.equal(summary.investmentsUpserted, 1);
    assert.equal(summary.oiUpserted, 1);
    assert.equal(summary.errors.length, 0);
  });

  await test("stage3a fixture scenario neighbors", async () => {
    const seeded = await loadStage3aFixtureScenario();
    const neighbors = await seeded.service.getNeighbors(
      seeded.nodes.project.id,
    );
    assert.ok(neighbors.incoming.length + neighbors.outgoing.length >= 5);
    const oppNeighbors = await seeded.service.getNeighbors(
      seeded.nodes.opportunity.id,
    );
    assert.ok(
      oppNeighbors.outgoing.filter((x) => x.edge.relationshipType === "DERIVED_FROM")
        .length >= 5,
    );
  });

  await test("security visibility field preserved", async () => {
    const svc = await freshService();
    await svc.createOrUpdateNode({
      nodeType: "OPPORTUNITY",
      title: "secret",
      visibility: "OWNER_ONLY",
      sourceType: "fixture",
      sourceId: "sec-1",
    });
    const secret = (await svc.findNodes({ q: "secret" }))[0];
    assert.equal(secret?.visibility, "OWNER_ONLY");
  });

  await test("provenance FACT not downgraded on edge update", async () => {
    const svc = await freshService();
    const a = (
      await svc.createOrUpdateNode({
        nodeType: "DEMAND",
        title: "D",
        sourceType: "f",
        sourceId: "d1",
      })
    ).node;
    const b = (
      await svc.createOrUpdateNode({
        nodeType: "PROJECT",
        title: "P",
        sourceType: "f",
        sourceId: "p1",
      })
    ).node;
    await svc.createOrUpdateEdge({
      sourceNodeId: a.id,
      targetNodeId: b.id,
      relationshipType: "CREATES_DEMAND_FOR",
      provenanceType: "FACT",
      confidence: 90,
    });
    const updated = (
      await svc.createOrUpdateEdge({
        sourceNodeId: a.id,
        targetNodeId: b.id,
        relationshipType: "CREATES_DEMAND_FOR",
        provenanceType: "INFERENCE",
        confidence: 50,
      })
    ).edge;
    assert.equal(updated.provenanceType, "FACT");
    assert.equal(updated.confidence, 90);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
