/**
 * Minimal production smoke for Business Graph persistence.
 * Uses 1 project + 1 investment + 1 OI candidate. No Matching / mass import.
 *
 * Run on server:
 *   set -a && source /etc/ckr/ckr.env && set +a
 *   BUSINESS_GRAPH_STORE=supabase LIA_OI_STORE=supabase \
 *     npx --yes tsx scripts/smoke-business-graph-production.ts
 */
import assert from "node:assert/strict";
import { createBusinessGraphAdminClient } from "../src/lib/business-graph/supabase-client";
import {
  getBusinessGraphService,
  setBusinessGraphServiceForTests,
} from "../src/lib/business-graph/service";
import { createOiAdminClient } from "../src/lib/lia/oi/store/supabase-client";
import { rowToCandidate } from "../src/lib/lia/oi/store/mappers";

function log(msg: string) {
  console.log(`[bg-smoke] ${msg}`);
}

async function countNodes(db: ReturnType<typeof createBusinessGraphAdminClient>) {
  const { count, error } = await db
    .from("business_graph_nodes")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countEdges(db: ReturnType<typeof createBusinessGraphAdminClient>) {
  const { count, error } = await db
    .from("business_graph_edges")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function main() {
  process.env.BUSINESS_GRAPH_STORE = "supabase";
  setBusinessGraphServiceForTests(null);

  const db = createBusinessGraphAdminClient();
  const oiDb = createOiAdminClient();
  const graph = getBusinessGraphService("supabase");

  const beforeNodes = await countNodes(db);
  const beforeEdges = await countEdges(db);
  log(`before nodes=${beforeNodes} edges=${beforeEdges}`);

  const { data: projects, error: pErr } = await db
    .from("projects")
    .select("id,title,summary,description,region,status")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1);
  if (pErr) throw new Error(`projects:${pErr.message}`);
  const project = projects?.[0];
  assert.ok(project, "need 1 published project");

  const { data: offers, error: iErr } = await db
    .from("investment_offers")
    .select("id,title,description,amount_max,regions,status")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1);
  if (iErr) throw new Error(`investment_offers:${iErr.message}`);
  const offer = offers?.[0];

  const { data: oiRows, error: oErr } = await oiDb
    .from("lia_oi_opportunities")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1);
  if (oErr) throw new Error(`lia_oi_opportunities:${oErr.message}`);
  assert.ok(oiRows?.[0], "need 1 OI opportunity");
  const oi = rowToCandidate(oiRows[0] as never);

  // PROJECT bridge + no-duplicate
  const p1 = await graph.bridgeFromProject(project);
  const p2 = await graph.bridgeFromProject(project);
  assert.equal(p1.id, p2.id, "project bridge must not duplicate");
  assert.equal(p1.internalEntityType, "projects");
  assert.equal(p1.internalEntityId, project.id);
  assert.equal(p1.nodeType, "PROJECT");
  log(`PROJECT node=${p1.id} title=${p1.title.slice(0, 60)}`);

  // CAPITAL bridge
  let capitalId: string | null = null;
  if (offer) {
    const c1 = await graph.bridgeFromInvestmentOffer({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      budgetMax: offer.amount_max ?? null,
      regions: offer.regions ?? null,
    });
    const c2 = await graph.bridgeFromInvestmentOffer({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      budgetMax: offer.amount_max ?? null,
      regions: offer.regions ?? null,
    });
    assert.equal(c1.id, c2.id, "capital bridge must not duplicate");
    assert.equal(c1.nodeType, "CAPITAL");
    assert.equal(c1.internalEntityType, "investment_offers");
    capitalId = c1.id;
    log(`CAPITAL node=${c1.id} title=${c1.title.slice(0, 60)}`);
  } else {
    log("CAPITAL skipped — no published investment_offers");
  }

  // OI bridge + sources
  const o1 = await graph.bridgeFromOiCandidate(oi);
  const o2 = await graph.bridgeFromOiCandidate(oi);
  assert.equal(o1.id, o2.id, "OI bridge must not duplicate");
  assert.equal(o1.sourceType, "lia_oi_opportunity");
  assert.equal(o1.sourceId, oi.id);
  assert.equal(o1.visibility, "OWNER_ONLY");
  const sources = await graph.listNodeSources(o1.id);
  log(
    `OI node=${o1.id} type=${o1.nodeType} sources=${sources.length} visibility=${o1.visibility}`,
  );

  await graph.addAlias(p1.id, `smoke-alias-${project.id.slice(0, 8)}`, "smoke");

  // Explicit smoke edges (no Matching)
  const edgeUseful = (
    await graph.createOrUpdateEdge({
      sourceNodeId: capitalId || o1.id,
      targetNodeId: p1.id,
      relationshipType: capitalId ? "CAN_FINANCE" : "RELATED_TO",
      confidence: 55,
      provenanceType: "ESTIMATE",
      reasoningSummary:
        "Smoke Stage 3A: explicit test relation (not Matching Engine).",
      status: "ACTIVE",
      matchClass: "HYPOTHESIS",
      createdByKind: "SYSTEM",
      source: "smoke-stage3a-production",
    })
  ).edge;
  assert.equal(edgeUseful.provenanceType, "ESTIMATE");
  log(`edge useful=${edgeUseful.id} ${edgeUseful.relationshipType}`);

  const edgeReject = (
    await graph.createOrUpdateEdge({
      sourceNodeId: o1.id,
      targetNodeId: p1.id,
      relationshipType: "RELATED_TO",
      confidence: 40,
      provenanceType: "INFERENCE",
      reasoningSummary: "Smoke Stage 3A: disposable edge for reject test.",
      status: "PROPOSED",
      matchClass: "HYPOTHESIS",
      createdByKind: "LIA",
      source: "smoke-stage3a-production",
    })
  ).edge;

  const { data: adminRole } = await db
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();
  const adminUserId = (adminRole?.user_id as string | undefined) || undefined;

  const confirmed = await graph.confirmEdge(
    edgeUseful.id,
    adminUserId,
    "smoke confirm ok",
  );
  assert.equal(confirmed.status, "CONFIRMED");
  const rejected = await graph.rejectEdge(
    edgeReject.id,
    adminUserId,
    "smoke reject ok",
  );
  assert.equal(rejected.status, "REJECTED");
  const commented = await graph.commentEdge(
    edgeUseful.id,
    adminUserId || "",
    "smoke owner comment",
  );
  assert.equal(commented.ownerComment, "smoke owner comment");

  const neighbors = await graph.getNeighbors(p1.id);
  assert.ok(
    neighbors.incoming.length + neighbors.outgoing.length >= 1,
    "neighbors expected",
  );
  const projectHistory = await graph.getNodeHistory(p1.id);
  assert.ok(
    projectHistory.some(
      (h) => h.eventType === "NODE_CREATED" || h.eventType === "NODE_UPDATED",
    ),
    "project node history",
  );
  assert.ok(
    projectHistory.some((h) => h.eventType === "ALIAS_ADDED"),
    "alias history on project",
  );

  // Edge events are recorded on source_node_id
  const usefulHistory = await graph.getNodeHistory(edgeUseful.sourceNodeId);
  assert.ok(
    usefulHistory.some((h) => h.eventType === "EDGE_CONFIRMED"),
    "confirm history",
  );
  assert.ok(
    usefulHistory.some((h) => h.eventType === "OWNER_COMMENT"),
    "comment history",
  );
  const rejectHistory = await graph.getNodeHistory(edgeReject.sourceNodeId);
  assert.ok(
    rejectHistory.some((h) => h.eventType === "EDGE_REJECTED"),
    "reject history",
  );

  const aliases = await graph.listAliases(p1.id);
  assert.ok(aliases.length >= 1, "alias expected");

  const afterNodes = await countNodes(db);
  const afterEdges = await countEdges(db);
  log(`after nodes=${afterNodes} edges=${afterEdges}`);

  // RLS: anon must not see OWNER_ONLY / admin-only graph
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";
  assert.ok(url && anon, "anon key required for RLS check");
  const anonRes = await fetch(
    `${url}/rest/v1/business_graph_nodes?select=id,title&limit=5`,
    {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        Accept: "application/json",
      },
    },
  );
  const anonBody = await anonRes.text();
  log(`RLS anon status=${anonRes.status} body=${anonBody.slice(0, 120)}`);
  assert.ok(anonRes.status === 200 || anonRes.status === 401 || anonRes.status === 403);
  if (anonRes.status === 200) {
    const parsed = JSON.parse(anonBody);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed.length, 0, "anon must not receive graph rows");
  }

  // service role sees rows
  const { data: svcRows, error: svcErr } = await db
    .from("business_graph_nodes")
    .select("id,node_type")
    .limit(10);
  if (svcErr) throw new Error(svcErr.message);
  assert.ok((svcRows?.length || 0) >= 2);

  console.log(
    JSON.stringify(
      {
        ok: true,
        beforeNodes,
        afterNodes,
        beforeEdges,
        afterEdges,
        projectNodeId: p1.id,
        capitalNodeId: capitalId,
        oiNodeId: o1.id,
        oiNodeType: o1.nodeType,
        usefulEdgeId: edgeUseful.id,
        rejectEdgeId: edgeReject.id,
        neighborIn: neighbors.incoming.length,
        neighborOut: neighbors.outgoing.length,
        historyEvents: history.length,
        aliases: aliases.length,
        oiSources: sources.length,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error("[bg-smoke] FAIL", e instanceof Error ? e.message : e);
  process.exit(1);
});
