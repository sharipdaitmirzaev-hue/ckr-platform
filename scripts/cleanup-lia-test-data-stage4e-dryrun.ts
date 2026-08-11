/**
 * Stage 4E — controlled cleanup PLAN (dry-run only).
 *
 * Rules:
 * - dry-run by default
 * - exact IDs only (no pattern-delete)
 * - backup list printed
 * - does NOT delete audit history
 * - production cleanup NEVER runs without separate owner confirmation
 *
 * Usage:
 *   npx tsx scripts/cleanup-lia-test-data-stage4e-dryrun.ts
 *   npx tsx scripts/cleanup-lia-test-data-stage4e-dryrun.ts --ids=id1,id2
 *
 * Destructive apply is intentionally NOT implemented in Stage 4E.
 */
import {
  KNOWN_TEST_DATA_INVENTORY,
  summarizeInventory,
  type CleanupClass,
} from "../src/lib/lia/oi/regional/test-data-inventory";

const APPLY = process.argv.includes("--apply");
const idsArg = process.argv.find((a) => a.startsWith("--ids="));
const exactIds = idsArg
  ? idsArg
      .slice("--ids=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : [];

function main() {
  console.log("\nStage 4E — Test/smoke data cleanup DRY-RUN\n");
  const summary = summarizeInventory();
  console.log("Inventory summary:", JSON.stringify(summary, null, 2));

  console.log("\nKnown categories:");
  for (const item of KNOWN_TEST_DATA_INVENTORY) {
    console.log(
      `- [${item.cleanupClass}] ${item.id} (${item.label}) — ${item.description}`,
    );
    console.log(`  hints: ${item.exactIdsHint.join(", ") || "—"}`);
    console.log(`  notes: ${item.notes}`);
  }

  console.log("\nExact IDs provided for potential delete:", exactIds.length ? exactIds : "(none)");
  if (!exactIds.length) {
    console.log(
      "No exact IDs — nothing would be deleted. Collect IDs from production audit first.",
    );
  }

  const plan = {
    mode: "dry-run",
    wouldDelete: exactIds.map((id) => ({
      id,
      cleanupClass: "UNCERTAIN" as CleanupClass,
      requiresOwnerConfirm: true,
      backup: `backup/lia-cleanup/${id}.json`,
    })),
    wouldKeepAudit: true,
    patternDelete: false,
    applyImplemented: false,
  };
  console.log("\nCleanup plan:", JSON.stringify(plan, null, 2));

  if (APPLY) {
    console.error(
      "\nREFUSED: --apply is not implemented in Stage 4E. Owner confirmation + separate script required.",
    );
    process.exit(2);
  }

  console.log(
    "\nSTOP: dry-run only. Production cleanup requires separate owner confirmation.",
  );
}

main();
