/**
 * Stage 4Q.1 — staging persistence E2E.
 * Recreate store (simulated restart). Exact-ID cleanup. Production refused.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CKR_OWN_IDEAS_SEED_MARKER } from "../src/config/ckr-own-ideas";
import {
  applyOwnerAction,
  runOwnIdeaBuilder,
  tractorEarthworksCatalog,
} from "../src/lib/ckr-own-ideas";
import {
  deleteOwnIdeaExact,
  deleteOwnIdeaRunExact,
  ownIdeasAdminClient,
} from "../src/lib/ckr-own-ideas/persist";
import { createSupabaseOwnIdeaStore } from "../src/lib/ckr-own-ideas/supabase-store";
import {
  assertCkrStagingTarget,
  CkrStagingGuardError,
} from "./lib/ckr-staging-guard";

const MANIFEST_PATH = resolve(
  process.env.CKR_E2E_MANIFEST_PATH ||
    "/tmp/cursor/artifacts/e2e-ckr-own-ideas-manifest.json",
);

type Manifest = {
  marker: string;
  ideaIds: string[];
  runId: string | null;
};

function save(m: Manifest) {
  mkdirSync(resolve("/tmp/cursor/artifacts"), { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2));
}

function load(): Manifest | null {
  if (!existsSync(MANIFEST_PATH)) return null;
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
}

function newStore() {
  return createSupabaseOwnIdeaStore(ownIdeasAdminClient());
}

async function cleanup(dryRun: boolean) {
  assertCkrStagingTarget();
  const m = load();
  if (!m) {
    console.log("CLEANUP_SKIPPED_NO_MANIFEST");
    console.log("RESIDUAL_SMOKE_ROWS", 0);
    return;
  }
  const admin = ownIdeasAdminClient();
  console.log("CLEANUP_PLAN", JSON.stringify(m, null, 2));
  if (dryRun) return;
  for (const id of m.ideaIds) await deleteOwnIdeaExact(admin, id);
  if (m.runId) await deleteOwnIdeaRunExact(admin, m.runId);
  let residual = 0;
  for (const id of m.ideaIds) {
    const { data } = await admin
      .from("ckr_own_ideas")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (data) residual += 1;
  }
  if (m.runId) {
    const { data } = await admin
      .from("ckr_own_idea_runs")
      .select("id")
      .eq("id", m.runId)
      .maybeSingle();
    if (data) residual += 1;
  }
  console.log("RESIDUAL_SMOKE_ROWS", residual);
  if (residual !== 0) process.exit(1);
  console.log("CLEANUP_OK");
}

async function runSmoke() {
  const target = assertCkrStagingTarget();
  console.log("STAGING_TARGET_OK", JSON.stringify(target));
  const catalog = tractorEarthworksCatalog();
  const built = runOwnIdeaBuilder({
    catalog,
    marker: CKR_OWN_IDEAS_SEED_MARKER,
  });
  if (built.ideas.length === 0) throw new Error("builder produced no ideas");
  if (built.metrics.autoPublish || built.metrics.autoOutreach || built.metrics.scheduler) {
    throw new Error("auto action leaked");
  }

  const store1 = newStore();
  await store1.saveRun({
    ...built.metrics,
    persistStatus: "running",
    ideasPersisted: 0,
  });
  for (const idea of built.ideas) await store1.upsert(idea);
  await store1.saveRun({
    ...built.metrics,
    persistStatus: "ok",
    ideasPersisted: built.ideas.length,
  });

  const created = built.ideas[0];
  const admin = ownIdeasAdminClient();
  const { data: dbRow, error } = await admin
    .from("ckr_own_ideas")
    .select("id, visibility, owner_state, marker")
    .eq("id", created.id)
    .maybeSingle();
  if (error || !dbRow) throw new Error("persist failed: no DB row");
  if (dbRow.visibility !== "OWNER_ONLY") throw new Error("privacy leak");

  const { data: runRow, error: runErr } = await admin
    .from("ckr_own_idea_runs")
    .select("id, metrics")
    .eq("id", built.metrics.runId)
    .maybeSingle();
  if (runErr || !runRow) throw new Error("persist failed: no run DB row");

  const store2 = newStore();
  const afterRestart = await store2.get(created.id);
  if (!afterRestart) throw new Error("RESTART_PERSISTENCE fail: idea missing");
  if (afterRestart.title !== created.title) throw new Error("restart title mismatch");
  const byFingerprint = await store2.findByFingerprint(created.fingerprint);
  if (!byFingerprint || byFingerprint.id !== created.id) {
    throw new Error("RESTART_PERSISTENCE fail: fingerprint lookup");
  }
  const runAfterRestart = (await store2.listRuns()).find((run) => run.runId === built.metrics.runId);
  if (!runAfterRestart) throw new Error("RESTART_PERSISTENCE fail: run missing");
  if (runAfterRestart.persistStatus !== "ok") {
    throw new Error(`RESTART_PERSISTENCE fail: persistStatus=${runAfterRestart.persistStatus}`);
  }

  const reviewed = applyOwnerAction(afterRestart, "accept");
  await store2.upsert(reviewed);

  const store3 = newStore();
  const afterAction = await store3.get(created.id);
  if (!afterAction) throw new Error("owner action not persisted");
  if (afterAction.ownerState !== "ACCEPTED") {
    throw new Error(`expected ACCEPTED, got ${afterAction.ownerState}`);
  }
  if (!afterAction.ownerLockedFields.includes("title")) {
    throw new Error("locks missing after owner action");
  }
  if (!afterAction.ownerLockedFields.includes("economics")) {
    throw new Error("economics lock missing");
  }

  const lockedTitle = afterAction.title;
  const lockedEconomics = afterAction.economics.disclaimer;
  const rediscovery = runOwnIdeaBuilder({
    catalog,
    existing: [afterAction],
    marker: CKR_OWN_IDEAS_SEED_MARKER,
  });
  const updated = rediscovery.ideas.find((i) => i.fingerprint === afterAction.fingerprint);
  if (!updated) throw new Error("rediscovery did not match fingerprint");
  if (updated.title !== lockedTitle) throw new Error("REDISCOVERY_PERSISTENCE fail: title lock");
  if (updated.economics.disclaimer !== lockedEconomics) {
    throw new Error("REDISCOVERY_PERSISTENCE fail: economics lock");
  }
  await store3.upsert(updated);

  const store4 = newStore();
  const afterRediscovery = await store4.get(created.id);
  if (!afterRediscovery) throw new Error("rediscovery persist missing");
  if (afterRediscovery.title !== lockedTitle) throw new Error("lock lost after rediscovery persist");
  if (afterRediscovery.ownerState !== "ACCEPTED") {
    throw new Error("owner state overwritten by rediscovery");
  }

  save({
    marker: CKR_OWN_IDEAS_SEED_MARKER,
    ideaIds: built.ideas.map((i) => i.id),
    runId: built.metrics.runId,
  });
  console.log("RESTART_PERSISTENCE PASS");
  console.log("REDISCOVERY_PERSISTENCE PASS");
  console.log("SMOKE_OK", {
    ideaId: created.id,
    runId: built.metrics.runId,
    rating: afterRediscovery.rating,
    ownerState: afterRediscovery.ownerState,
    missing: afterRediscovery.missing.map((m) => m.kind),
  });
}

async function main() {
  if (process.env.CKR_E2E_SMOKE !== "1") {
    console.error("SKIP: set CKR_E2E_SMOKE=1");
    process.exit(2);
  }
  try {
    if (process.env.CKR_E2E_CLEANUP_ONLY === "1") {
      await cleanup(process.env.CKR_E2E_DRY_RUN_CLEANUP === "1");
      return;
    }
    await runSmoke();
    await cleanup(false);
  } catch (e) {
    if (e instanceof CkrStagingGuardError) {
      console.error("STAGING_TARGET_REFUSED", e.code, e.message);
      process.exit(2);
    }
    try {
      await cleanup(false);
    } catch (cleanupErr) {
      console.error("CLEANUP_AFTER_FAILURE", cleanupErr);
    }
    console.error(e);
    process.exit(1);
  }
}

main();
