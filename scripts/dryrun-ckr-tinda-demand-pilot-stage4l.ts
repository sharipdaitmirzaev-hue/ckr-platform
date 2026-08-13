/**
 * Stage 4L — read-only TINDA evaluation (memory simulation + optional prod SSH).
 * Does NOT mutate TINDA. Does NOT send CLIENT messages.
 *
 * Run: npx tsx scripts/dryrun-ckr-tinda-demand-pilot-stage4l.ts
 */
import {
  classifyFixtureSignal,
  isFixtureNoise,
} from "../src/lib/personalized-feed/fixtures";
import { explainRecommendation } from "../src/lib/personalized-feed/explain";
import { rankCandidate } from "../src/lib/personalized-feed/scoring";
import { createMemoryPersonalizedFeedService } from "../src/lib/personalized-feed/service";
import { toWorkbenchView } from "../src/lib/ckr-inbox/request-workbench";
import type { FeedCandidate } from "../src/types/personalized-feed";
import type { NeedProfile } from "../src/types/need-profile";

function need(partial: Partial<NeedProfile> & Pick<NeedProfile, "id" | "intentType" | "ownerId">): NeedProfile {
  return {
    title: partial.title || "ТИНДА SEEK_BUYER",
    description: "Опт напитки и продукты, Дагестан / Махачкала",
    ownerType: "user",
    status: "ACTIVE",
    budgetMin: null,
    budgetMax: null,
    currency: "RUB",
    regions: ["Дагестан", "Махачкала", "СКФО"],
    industries: ["food", "beverage"],
    keywords: ["опт", "напитки", "продукты"],
    criteria: {},
    visibility: "CKR_ONLY",
    priority: "NORMAL",
    timeHorizon: null,
    riskPreference: null,
    matchingEnabled: true,
    lastMatchedAt: null,
    contextGroupId: null,
    fingerprint: null,
    source: "manual",
    createdBy: partial.ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

function cand(partial: Partial<FeedCandidate> & Pick<FeedCandidate, "id" | "itemType" | "title">): FeedCandidate {
  return {
    summary: "",
    region: null,
    industry: null,
    price: null,
    priceKnown: false,
    currency: "RUB",
    status: "published",
    sourceChannel: "internal",
    sourceLabel: "ЦКР",
    sourceKey: "ckr",
    href: "/",
    dataQuality: 6,
    sourceConfidence: 4,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    unknownFields: ["price"],
    confirmedFields: ["title"],
    ...partial,
  };
}

type Bucket = "REAL_GOOD" | "REAL_ACCEPTABLE" | "WEAK" | "SMOKE";

function bucket(title: string, score: number, fixture: boolean): Bucket {
  if (fixture) return "SMOKE";
  if (score >= 60) return "REAL_GOOD";
  if (score >= 45) return "REAL_ACCEPTABLE";
  return "WEAK";
}

async function main() {
  console.log("=== Stage 4L TINDA dry-run (READ-ONLY) ===\n");

  const tinda = need({
    id: "15e85d03-2dd9-4c99-8d28-4c66e03d29d5",
    intentType: "SEEK_BUYER",
    ownerId: "0839fe5c-d5a0-4acd-946d-1f0f88ccd72b",
  });

  // BEFORE: Stage 4K mapping (partner|service only) — simulate with smoke partner
  const beforeCandidates: FeedCandidate[] = [
    cand({
      id: "smoke-public-u1",
      itemType: "opportunity",
      title: "smoke-public-u1",
      region: "Дагестан",
      rawType: "partner",
      industries: ["food"],
    }),
  ];

  // AFTER: published demand signals known from production audit + weaker variants
  const afterPool: FeedCandidate[] = [
    ...beforeCandidates,
    cand({
      id: "proc-food-dagestan",
      itemType: "opportunity",
      title: "Закупка продуктов питания · Республика Дагестан · 0936",
      summary: "Закупка продуктов питания",
      region: "Республика Дагестан",
      regions: ["Республика Дагестан"],
      rawType: "procurement",
      industries: ["food"],
      industry: "food",
      sourceLabel: "Официальные закупки",
      sourceChannel: "external",
      sourceConfidence: 7,
      dataQuality: 7,
      href: "/opportunity/proc-food-dagestan",
      canonicalUrl: "https://example.official/procurement/0936",
    }),
    cand({
      id: "proc-bev-moscow",
      itemType: "opportunity",
      title: "Поставка воды и напитков · Московская область",
      summary: "Безалкогольные напитки оптом",
      region: "Московская область",
      rawType: "procurement",
      industries: ["beverage"],
      industry: "beverage",
      sourceLabel: "Официальные закупки",
      sourceChannel: "external",
      sourceConfidence: 6,
      dataQuality: 6,
    }),
    cand({
      id: "proc-it-dag",
      itemType: "opportunity",
      title: "Закупка компьютерной техники · Дагестан",
      summary: "ПК и периферия",
      region: "Республика Дагестан",
      rawType: "procurement",
      industries: ["it"],
      industry: "it",
      sourceLabel: "Официальные закупки",
    }),
    cand({
      id: "stub-buyer",
      itemType: "opportunity",
      title: "[STUB] Fake buyer chain",
      region: "Дагестан",
      rawType: "partner",
    }),
  ];

  console.log("--- BEFORE (partner/service only + smoke) ---");
  for (const c of beforeCandidates) {
    const r = rankCandidate(tinda, c);
    console.log(
      `  ${c.title} | type=${c.rawType} | score=${r.breakdown.total} | fixture=${isFixtureNoise(c)}`,
    );
  }

  const feed = createMemoryPersonalizedFeedService();
  feed.resetForTests();
  feed.setTestNeeds([tinda]);
  feed.setTestCandidates(afterPool);

  // Legacy-like feed without fixture filter (what staff saw)
  const legacy = await feed.getFeedForNeedProfile({
    need: tinda,
    ownerId: tinda.ownerId,
    limit: 10,
    excludeFixtures: false,
    minScore: 25,
  });

  // Workbench AFTER
  const workbench = await feed.getFeedForNeedProfile({
    need: tinda,
    ownerId: tinda.ownerId,
    limit: 5,
    excludeFixtures: true,
    minScore: 50,
    requireProductFit: true,
  });

  console.log("\n--- AFTER workbench (excludeFixtures + procurement) ---");
  const counts: Record<Bucket, number> = {
    REAL_GOOD: 0,
    REAL_ACCEPTABLE: 0,
    WEAK: 0,
    SMOKE: 0,
  };

  for (const rec of workbench.recommendations) {
    const view = toWorkbenchView(rec);
    const fx = isFixtureNoise(rec.candidate);
    const b = bucket(rec.candidate.title, rec.score, fx);
    counts[b] += 1;
    console.log(`\n  [${b}] ${view.title}`);
    console.log(`    type=${view.signalTypeLabel} | score=${view.score}`);
    console.log(`    region=${view.region}`);
    console.log(`    why=${view.why}`);
    console.log(`    matched=${view.matched.join(" · ") || "—"}`);
    console.log(`    source=${view.sourceLabel}`);
    console.log(`    shareable=${view.shareable}`);
  }

  // Score the Dagestan food procurement explicitly
  const foodDag = afterPool.find((c) => c.id === "proc-food-dagestan")!;
  const foodRank = rankCandidate(tinda, foodDag);
  const foodExpl = explainRecommendation(
    tinda,
    foodDag,
    foodRank.breakdown,
    foodRank.budgetNote,
  );

  console.log("\n--- Evaluation answers ---");
  console.log(
    `A. Dagestan food procurement in SEEK_BUYER workbench: ${
      workbench.recommendations.some((r) => r.candidate.id === "proc-food-dagestan")
        ? "YES"
        : "NO"
    }`,
  );
  console.log(`B. Score: ${foodRank.breakdown.total}`);
  console.log(
    `   breakdown: intent=${foodRank.breakdown.intentCompatibility} region=${foodRank.breakdown.regionFit} industry=${foodRank.breakdown.industryFit} budget=${foodRank.breakdown.budgetFit} freshness=${foodRank.breakdown.freshness}`,
  );
  console.log(`C. Why: ${foodExpl.why}`);
  console.log(`D. Other real candidates: ${workbench.recommendations.length - 1}`);
  console.log(`E. Buckets: ${JSON.stringify(counts)}`);
  console.log(
    `F. Owner Inbox workbench candidates: ${workbench.recommendations.length} (rendered via OwnerRequestWorkbench)`,
  );
  console.log(
    "G. Owner actions to first useful: open inbox card → see candidate (~2) vs old path Feed/OI/Opportunities (~8–12)",
  );

  console.log("\n--- Fixture classification sample ---");
  for (const c of afterPool) {
    console.log(
      `  ${c.title.slice(0, 48)} → ${classifyFixtureSignal(c)} noise=${isFixtureNoise(c)}`,
    );
  }

  console.log("\n--- Legacy vs workbench counts ---");
  console.log(`legacy (no fixture filter): ${legacy.recommendations.length}`);
  console.log(`workbench: ${workbench.recommendations.length}`);
  console.log("\nTINDA production rows: NOT MODIFIED (read-only dry-run).");
  console.log("NO deploy. NO migration. NO MATCHES. NO auto-publish.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
