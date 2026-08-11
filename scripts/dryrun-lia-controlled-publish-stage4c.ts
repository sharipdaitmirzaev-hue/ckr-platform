/**
 * Stage 4C dry-run — no production writes.
 * Recommends 5–10 smoke publish candidates from in-memory / available OI store.
 */
import {
  ensureLiaOiSeed,
  getRecommendedCandidates,
} from "../src/lib/lia/oi/pipeline";
import { listCandidates } from "../src/lib/lia/oi/store";
import {
  getControlledPublishService,
  passesPublicationQualityGate,
  projectLiaOiToPublicDraft,
  resetControlledPublishForTests,
} from "../src/lib/lia/oi/publish";
import { getIntentMapping } from "../src/lib/personalized-feed/mapping";

async function main() {
  resetControlledPublishForTests();
  await ensureLiaOiSeed("dryrun-owner");
  const all = await listCandidates();
  const svc = getControlledPublishService("memory");
  const gate = await svc.queueEligible("dryrun-owner");

  const support: typeof all = [];
  const procurement: typeof all = [];
  const other: typeof all = [];

  for (const c of all) {
    const g = passesPublicationQualityGate(c);
    if (!g.ok) continue;
    const draft = projectLiaOiToPublicDraft(c);
    if (draft.lifecycleHint !== "active" && draft.lifecycleHint !== "unknown") {
      continue;
    }
    if (c.opportunityType === "SUPPORT_PROGRAM") support.push(c);
    else if (c.opportunityType === "PROCUREMENT") procurement.push(c);
    else other.push(c);
  }

  const pick = [
    ...support.slice(0, 3),
    ...procurement.slice(0, 3),
    ...other.slice(0, 2),
  ].slice(0, 10);

  console.log("=== Stage 4C Controlled Publish Dry-run ===");
  console.log(`OI candidates total: ${all.length}`);
  console.log(`Quality-gate queued: ${gate.queued}, skipped: ${gate.skipped}`);
  console.log(`SEEK_SUPPORT coverage: ${getIntentMapping("SEEK_SUPPORT").coverage}`);
  console.log(`SEEK_CONTRACT coverage: ${getIntentMapping("SEEK_CONTRACT").coverage}`);
  console.log("\nRecommended first smoke publish (max 5–10):");
  for (const c of pick) {
    const d = projectLiaOiToPublicDraft(c);
    console.log(
      `- [${d.type}] ${d.title.slice(0, 80)} | ${d.region} | price=${d.price ?? "UNKNOWN"} | ${d.sourceLabel} | dq=${d.dataQualityScore ?? "—"} | ${c.id}`,
    );
  }
  if (!pick.length) {
    console.log("(no eligible candidates in current store — seed/demo only)");
    const rec = await getRecommendedCandidates(5);
    for (const c of rec) {
      const d = projectLiaOiToPublicDraft(c);
      console.log(
        `  fallback recommend: [${d.type}] ${d.title.slice(0, 70)} | gate=${passesPublicationQualityGate(c).ok}`,
      );
    }
  }
  console.log("\nNO production apply. NO mass publish. Owner approval required.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
