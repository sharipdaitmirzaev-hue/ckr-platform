/**
 * Stage 4Q — staging-only E2E for Собственные идеи ЦКР.
 * Exact-ID cleanup. Production refused by staging guard.
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
  persistOwnIdea,
  persistOwnIdeaRun,
} from "../src/lib/ckr-own-ideas/persist";
import {
  assertCkrStagingTarget,
  CkrStagingGuardError,
} from "../src/lib/ckr-staging-guard";

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
  const reviewed = applyOwnerAction(built.ideas[0], "accept");
  await persistOwnIdeaRun(admin, built.metrics);
  for (const idea of built.ideas) {
    await persistOwnIdea(admin, idea.id === reviewed.id ? reviewed : idea);
  }
  const { data: row, error } = await admin
    .from("ckr_own_ideas")
    .select("id, visibility, owner_state, marker")
    .eq("id", reviewed.id)
    .maybeSingle();
  if (error || !row) throw new Error("persist failed");
  if (row.visibility !== "OWNER_ONLY") throw new Error("privacy leak");
  save({
    marker: CKR_OWN_IDEAS_SEED_MARKER,
    ideaIds: built.ideas.map((i) => i.id),
    runId: built.metrics.runId,
  });
  console.log("SMOKE_OK", {
    ideaId: reviewed.id,
    runId: built.metrics.runId,
    rating: reviewed.rating,
    missing: reviewed.missing.map((m) => m.kind),
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
