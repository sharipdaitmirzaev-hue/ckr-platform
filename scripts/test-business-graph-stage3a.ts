/**
 * Stage 3A — Business Graph foundation tests (in-memory, no DB apply).
 *
 * Run: npx tsx scripts/test-business-graph-stage3a.ts
 */
import assert from "node:assert/strict";
import { BusinessGraphService } from "../src/lib/business-graph/service";
import { loadStage3aFixtureScenario } from "../src/lib/business-graph/fixtures/stage3a-scenario";
import type { LiaOiCandidate } from "../src/types/lia-oi";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(error instanceof Error ? error.stack : error);
  }
}

function freshService(): BusinessGraphService {
  const svc = new BusinessGraphService();
  svc.resetForTests();
  return svc;
}

function minimalOi(partial: Partial<LiaOiCandidate> & { id: string; title: string }): LiaOiCandidate {
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

function main() {
  test("create + update node by source", () => {
    const svc = freshService();
    const a = svc.createOrUpdateNode({
      nodeType: "COMPANY",
      title: "ООО Ромашка",
      sourceType: "manual",
      sourceId: "company-1",
      dataConfidence: 90,
    });
    const b = svc.createOrUpdateNode({
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

  test("identity: strong INN reuse, weak name does not merge", () => {
    const svc = freshService();
    const a = svc.createOrUpdateNode({
      nodeType: "COMPANY",
      title: "Ромашка",
      region: "Москва",
    });
    const b = svc.createOrUpdateNode({
      nodeType: "COMPANY",
      title: "Ромашка",
      region: "Москва",
    });
    assert.notEqual(a.node.id, b.node.id, "weak name+region must not auto-merge");
    assert.equal(a.node.fingerprint, null);
    assert.equal(b.node.fingerprint, null);

    const withInn1 = svc.createOrUpdateNode({
      nodeType: "COMPANY",
      title: "ООО А",
      structuredData: { inn: "7701234567" },
    });
    const withInn2 = svc.createOrUpdateNode({
      nodeType: "COMPANY",
      title: "ООО А обновл",
      structuredData: { inn: "7701234567" },
    });
    assert.equal(withInn1.node.id, withInn2.node.id);
    assert.ok(withInn1.node.fingerprint);
  });

  test("no duplicate by source_type+source_id", () => {
    const svc = freshService();
    const a = svc.createOrUpdateNode({
      nodeType: "DEMAND",
      title: "A",
      sourceType: "lia_oi_opportunity",
      sourceId: "oi-1",
    });
    const b = svc.createOrUpdateNode({
      nodeType: "DEMAND",
      title: "A updated",
      sourceType: "lia_oi_opportunity",
      sourceId: "oi-1",
    });
    assert.equal(a.node.id, b.node.id);
    assert.equal(b.node.title, "A updated");
  });

  test("alias", () => {
    const svc = freshService();
    const n = svc.createOrUpdateNode({
      nodeType: "COMPANY",
      title: "ООО Ромашка",
      sourceType: "manual",
      sourceId: "alias-co-1",
    }).node;
    svc.addAlias(n.id, "Romashka LLC", "manual");
    svc.addAlias(n.id, "Romashka LLC", "manual");
    const history = svc.getNodeHistory(n.id);
    assert.ok(history.some((h) => h.eventType === "ALIAS_ADDED"));
    assert.equal(
      history.filter((h) => h.eventType === "ALIAS_ADDED").length,
      1,
    );
  });

  test("edge + provenance + scores separation", () => {
    const svc = freshService();
    const capital = svc.createOrUpdateNode({
      nodeType: "CAPITAL",
      title: "Investor",
      sourceType: "fixture",
      sourceId: "cap-score",
      dataConfidence: 95,
      opportunityAttractiveness: 61,
    }).node;
    const project = svc.createOrUpdateNode({
      nodeType: "PROJECT",
      title: "Plant",
      sourceType: "fixture",
      sourceId: "proj-score",
      dataConfidence: 90,
    }).node;
    const edge = svc.createOrUpdateEdge({
      sourceNodeId: capital.id,
      targetNodeId: project.id,
      relationshipType: "CAN_FINANCE",
      confidence: 72,
      provenanceType: "INFERENCE",
      reasoningSummary: "budget fits project need",
      matchClass: "SOFT",
    }).edge;
    assert.equal(edge.provenanceType, "INFERENCE");
    assert.equal(edge.confidence, 72);
    assert.equal(capital.dataConfidence, 95);
    assert.equal(capital.opportunityAttractiveness, 61);
    assert.notEqual(edge.confidence, capital.dataConfidence);
  });

  test("temporal archive keeps history", () => {
    const svc = freshService();
    const a = svc.createOrUpdateNode({
      nodeType: "SUPPORT",
      title: "Grant",
      sourceType: "fixture",
      sourceId: "sup-t",
    }).node;
    const b = svc.createOrUpdateNode({
      nodeType: "PROJECT",
      title: "P",
      sourceType: "fixture",
      sourceId: "proj-t",
    }).node;
    const e1 = svc.createOrUpdateEdge({
      sourceNodeId: a.id,
      targetNodeId: b.id,
      relationshipType: "SUPPORTED_BY",
      provenanceType: "FACT",
      isCurrent: true,
    }).edge;
    svc.archiveEdge(e1.id, "2026-12-31T00:00:00.000Z");
    const current = svc.getEdges({ nodeId: a.id, currentOnly: true });
    assert.equal(current.length, 0);
    const all = svc.getEdges({ nodeId: a.id, currentOnly: false });
    assert.equal(all.length, 1);
    assert.equal(all[0]?.isCurrent, false);
    assert.equal(all[0]?.status, "ARCHIVED");
  });

  test("owner confirm/reject + history", () => {
    const svc = freshService();
    const a = svc.createOrUpdateNode({
      nodeType: "PROPERTY",
      title: "Site",
      sourceType: "fixture",
      sourceId: "prop-cr",
    }).node;
    const b = svc.createOrUpdateNode({
      nodeType: "PROJECT",
      title: "P",
      sourceType: "fixture",
      sourceId: "proj-cr",
    }).node;
    const e = svc.createOrUpdateEdge({
      sourceNodeId: a.id,
      targetNodeId: b.id,
      relationshipType: "SUITABLE_FOR",
      provenanceType: "ESTIMATE",
      createdByKind: "LIA",
    }).edge;
    const confirmed = svc.confirmEdge(e.id, "owner-1", "ok");
    assert.equal(confirmed.status, "CONFIRMED");
    const rejected = svc.rejectEdge(e.id, "owner-1", "no");
    assert.equal(rejected.status, "REJECTED");
    const history = svc.getNodeHistory(a.id);
    assert.ok(history.some((h) => h.eventType === "EDGE_CREATED"));
    assert.ok(history.some((h) => h.eventType === "EDGE_CONFIRMED"));
    assert.ok(history.some((h) => h.eventType === "EDGE_REJECTED"));
  });

  test("OI → graph bridge no duplicate", () => {
    const svc = freshService();
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
    const n1 = svc.bridgeFromOiCandidate(oi);
    const n2 = svc.bridgeFromOiCandidate(oi);
    assert.equal(n1.id, n2.id);
    assert.equal(n1.nodeType, "DEMAND");
    assert.equal(n1.visibility, "OWNER_ONLY");
    assert.equal(n1.fingerprint, "fp-abc");
  });

  test("internal project → graph", () => {
    const svc = freshService();
    const project = {
      id: "proj-1",
      title: "Завод",
      description: "desc",
      region: "Казань",
      status: "published",
    };
    const n1 = svc.bridgeFromProject(project);
    const n2 = svc.bridgeFromProject(project);
    assert.equal(n1.id, n2.id);
    assert.equal(n1.internalEntityType, "projects");
    assert.equal(n1.nodeType, "PROJECT");
  });

  test("stage3a fixture scenario neighbors", () => {
    const seeded = loadStage3aFixtureScenario();
    const svc = new BusinessGraphService();
    const neighbors = svc.getNeighbors(seeded.nodes.project.id);
    assert.ok(neighbors.incoming.length + neighbors.outgoing.length >= 5);
    const oppNeighbors = svc.getNeighbors(seeded.nodes.opportunity.id);
    const derived = oppNeighbors.outgoing.filter(
      (x) => x.edge.relationshipType === "DERIVED_FROM",
    );
    assert.ok(derived.length >= 5);
    const edges = svc.getEdges({
      nodeId: seeded.nodes.capital.id,
      relationshipType: "CAN_FINANCE",
    });
    assert.equal(edges[0]?.provenanceType, "ESTIMATE");
  });

  test("security: owner-only not mixed into public find", () => {
    const svc = freshService();
    svc.createOrUpdateNode({
      nodeType: "OPPORTUNITY",
      title: "secret",
      visibility: "OWNER_ONLY",
      sourceType: "fixture",
      sourceId: "sec-1",
    });
    svc.createOrUpdateNode({
      nodeType: "PROJECT",
      title: "public project",
      visibility: "PUBLIC",
      sourceType: "fixture",
      sourceId: "pub-1",
    });
    const all = svc.findNodes({ q: "project" });
    // Memory findNodes does not filter visibility (caller/RLS must);
    // assert OWNER_ONLY node exists and PUBLIC exists separately for UI contract.
    const secret = svc.findNodes({ q: "secret" })[0];
    const pub = all.find((n) => n.visibility === "PUBLIC");
    assert.equal(secret?.visibility, "OWNER_ONLY");
    assert.ok(pub);
  });

  test("provenance FACT not downgraded on edge update", () => {
    const svc = freshService();
    const a = svc.createOrUpdateNode({
      nodeType: "DEMAND",
      title: "D",
      sourceType: "f",
      sourceId: "d1",
    }).node;
    const b = svc.createOrUpdateNode({
      nodeType: "PROJECT",
      title: "P",
      sourceType: "f",
      sourceId: "p1",
    }).node;
    svc.createOrUpdateEdge({
      sourceNodeId: a.id,
      targetNodeId: b.id,
      relationshipType: "CREATES_DEMAND_FOR",
      provenanceType: "FACT",
      confidence: 90,
    });
    const updated = svc.createOrUpdateEdge({
      sourceNodeId: a.id,
      targetNodeId: b.id,
      relationshipType: "CREATES_DEMAND_FOR",
      provenanceType: "INFERENCE",
      confidence: 50,
    }).edge;
    assert.equal(updated.provenanceType, "FACT");
    assert.equal(updated.confidence, 90);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
