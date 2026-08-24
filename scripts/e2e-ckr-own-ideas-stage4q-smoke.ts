/**
 * Stage 4Q / 4Q.1 — staging-only E2E for Собственные идеи ЦКР.
 * Persistence + restart + locks. Exact-ID cleanup. Production refused.
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
  const store = createSupabaseOwnIdeaStore(admin);
  let residual = 0;
  for (const id of m.ideaIds) {
    if (await store.get(id)) residual += 1;
  }
  if (m.runId) {
    const runStillThere = (await store.listRuns()).some((run) => run.runId === m.runId);
    if (runStillThere) residual += 1;
  }
  console.log("RESIDUAL_SMOKE_ROWS", residual);
  if (residual !== 0) process.exit(1);
  console.log("CLEANUP_OK");
}

async function runSmoke() {
  const target = assertCkrStagingTarget();
  console.log("STAGING_TARGET_OK", JSON.stringify(target));
  const admin = ownIdeasAdminClient();

  const built = runOwnIdeaBuilder({
    catalog: tractorEarthworksCatalog(),
    marker: CKR_OWN_IDEAS_SEED_MARKER,
  });
  if (built.ideas.length === 0) throw new Error("builder produced no ideas");
  if (built.metrics.autoPublish || built.metrics.autoOutreach) {
    throw new Error("auto action leaked");
  }

  const store1 = createSupabaseOwnIdeaStore(admin);
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

  const dbRow = await store1.get(built.ideas[0].id);
  if (!dbRow) throw new Error("DB row missing after create");
  if (dbRow.visibility !== "OWNER_ONLY") throw new Error("privacy leak");

  const store2 = createSupabaseOwnIdeaStore(admin);
  const afterRestart = await store2.get(built.ideas[0].id);
  if (!afterRestart || afterRestart.id !== built.ideas[0].id) {
    throw new Error("idea not visible after store recreate");
  }
  const runAfterRestart = (await store2.listRuns()).find((run) => run.runId === built.metrics.runId);
  if (!runAfterRestart || runAfterRestart.persistStatus !== "ok") {
    throw new Error("run not visible after store recreate");
  }
  console.log("RESTART_PERSISTENCE PASS");

  const accepted = applyOwnerAction(afterRestart, "accept");
  if (!accepted.ownerLockedFields.includes("economics") || !accepted.ownerLockedFields.includes("rating")) {
    throw new Error("owner action did not lock economics/rating");
  }
  await store2.upsert(accepted);

  const store3 = createSupabaseOwnIdeaStore(admin);
  const afterAction = await store3.get(accepted.id);
  if (!afterAction || afterAction.ownerState !== "ACCEPTED") {
    throw new Error("owner action did not persist across restart");
  }

  const locked = {
    ...afterAction,
    title: "OWNER LOCKED TITLE",
    economics: { ...afterAction.economics, disclaimer: "OWNER LOCKED ECONOMICS" },
    ownerLockedFields: Array.from(
      new Set([...afterAction.ownerLockedFields, "title", "essence", "economics", "rating"]),
    ),
  };
  await store3.upsert(locked);
  const existing = await store3.list();
  const rediscovered = runOwnIdeaBuilder({
    catalog: tractorEarthworksCatalog(),
    existing,
    marker: CKR_OWN_IDEAS_SEED_MARKER,
  });
  for (const idea of rediscovered.ideas) await store3.upsert(idea);

  const store4 = createSupabaseOwnIdeaStore(admin);
  const afterRediscovery = await store4.getByFingerprint(locked.fingerprint);
  if (!afterRediscovery) throw new Error("rediscovery row missing");
  if (afterRediscovery.title !== "OWNER LOCKED TITLE") {
    throw new Error("owner lock lost after rediscovery/restart");
  }
  if (afterRediscovery.economics.disclaimer !== "OWNER LOCKED ECONOMICS") {
    throw new Error("economics lock lost after rediscovery/restart");
  }
  if (afterRediscovery.ownerState !== "ACCEPTED") {
    throw new Error("owner state overwritten by rediscovery");
  }
  if (!afterRediscovery.events.some((e) => e.type === "rediscovery_updated")) {
    throw new Error("rediscovery event missing");
  }
  console.log("REDISCOVERY_PERSISTENCE PASS");

  const last = (await store4.listRuns()).find((run) => run.runId === built.metrics.runId);
  if (!last || last.persistStatus !== "ok") throw new Error("run metrics not persisted");

  save({
    marker: CKR_OWN_IDEAS_SEED_MARKER,
    ideaIds: built.ideas.map((i) => i.id),
    runId: built.metrics.runId,
  });
  console.log("SMOKE_OK", {
    ideaId: afterRediscovery.id,
    runId: built.metrics.runId,
    rating: afterRediscovery.rating,
    ownerState: afterRediscovery.ownerState,
    restartPersisted: true,
    lockPersisted: afterRediscovery.title === "OWNER LOCKED TITLE",
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
