/**
 * Stage 4O — read-only / dry-run POC helpers (no production writes by default).
 *
 * Usage:
 *   npx tsx scripts/dryrun-ckr-opportunity-discovery-stage4o.ts
 *
 * Live external PASS requires env + explicit EXPAND_EXTERNAL=1.
 * Never mutates TINDA request / Need / Company.
 */
import {
  buildContextFromManual,
  buildContextFromNeed,
  formatDiscoveryRunRu,
  runDiscoverySync,
  type InternalCatalogRow,
} from "../src/lib/opportunity-discovery";
import type { NeedProfile } from "../src/types/need-profile";

const TINDA_FIXTURE: InternalCatalogRow[] = [
  {
    entityType: "opportunity",
    id: "172afcb4-published-tea",
    title: "Закупка чая 0303300143726000006",
    summary: "Чай / напитки · Дагестан",
    region: "Дагестан",
    amount: 26000,
    sourceType: "procurement",
    noticeId: "0303300143726000006",
    href: "/opportunity/172afcb4-published-tea",
    status: "published",
  },
  {
    entityType: "opportunity",
    id: "dairy-lot",
    title: "Молочная продукция для детского дома",
    summary: "Молоко · Дагестан",
    region: "Дагестан",
    amount: 906000,
    sourceType: "procurement",
    href: "/opportunity/dairy-lot",
    status: "published",
  },
  {
    entityType: "project",
    id: "seed-demo-project",
    title: "[SEED] Demo hotel project",
    summary: "seed-demo",
    region: "Дагестан",
    amount: 20_000_000,
    href: "/project/seed-demo-project",
    status: "published",
  },
  {
    entityType: "project",
    id: "real-ish-project",
    title: "Производственный проект СКФО",
    summary: "Инвестиционный проект до 28 млн",
    region: "Дагестан",
    amount: 28_000_000,
    href: "/project/real-ish-project",
    status: "published",
  },
];

function tindaNeed(): NeedProfile {
  return {
    id: "15e85d03-2dd9-4c99-8d28-4c66e03d29d5",
    intentType: "SEEK_BUYER",
    title: "TINDA SEEK_BUYER",
    description: "food / beverage",
    ownerType: "organization",
    ownerId: "fb5843fb-ab25-43bc-9af7-d74c6ef66176",
    status: "ACTIVE",
    budgetMin: null,
    budgetMax: null,
    currency: "RUB",
    regions: ["Дагестан"],
    industries: ["food", "beverage"],
    keywords: ["напитки", "чай", "продукты"],
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
    createdBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function main() {
  console.log("\n=== Stage 4O dry-run (fixture catalog, no writes) ===\n");

  // A. REQUEST_DRIVEN — TINDA
  const tindaCtx = buildContextFromNeed({
    mode: "REQUEST_DRIVEN",
    need: tindaNeed(),
    requestId: "223decd8-c99a-4d24-ba25-2cb5d91749d3",
  });
  const tindaInternal = runDiscoverySync({
    context: tindaCtx,
    catalog: TINDA_FIXTURE,
    expandExternal: false,
  });
  console.log("--- TINDA REQUEST_DRIVEN / INTERNAL ---");
  console.log(formatDiscoveryRunRu(tindaInternal));
  console.log(
    "TOP internal:",
    tindaInternal.candidates.slice(0, 5).map((c) => ({
      title: c.title,
      suitability: c.suitabilityLabelRu,
      realness: c.realness,
      origin: c.provenance.origin,
    })),
  );

  // B. INVESTOR POC
  const invCtx = buildContextFromManual({
    mode: "REQUEST_DRIVEN",
    freeText:
      "Найти варианты для инвестирования до 30 млн ₽ в Дагестане и СКФО. Действующий бизнес или понятный инвестиционный проект.",
    intent: "INVEST",
    region: "Дагестан",
    budgetMax: 30_000_000,
    categories: ["INVESTMENT_PROJECT", "BUSINESS_FOR_SALE", "CAPITAL"],
  });
  const invInternal = runDiscoverySync({
    context: invCtx,
    catalog: TINDA_FIXTURE,
    expandExternal: false,
  });
  console.log("\n--- INVESTOR POC / INTERNAL ---");
  console.log(formatDiscoveryRunRu(invInternal));
  console.log(
    "TOP:",
    invInternal.candidates.slice(0, 5).map((c) => ({
      title: c.title,
      realness: c.realness,
      amount: c.amount,
    })),
  );

  // C. MARKET_DRIVEN
  const marketCtx = buildContextFromManual({
    mode: "MARKET_DRIVEN",
    freeText: "Перспективные инвестиционные возможности Дагестан/СКФО до 30 млн ₽",
    intent: "INVEST",
    region: "Дагестан",
    budgetMax: 30_000_000,
  });
  const market = runDiscoverySync({
    context: marketCtx,
    catalog: TINDA_FIXTURE,
    expandExternal: false,
  });
  console.log("\n--- MARKET_DRIVEN / INTERNAL BANK ---");
  console.log(formatDiscoveryRunRu(market));

  console.log("\nNOTES:");
  console.log("- SEED excluded from kept real working set when classified.");
  console.log("- External PASS not run here (set live path + owner action separately).");
  console.log("- Production untouched. No migration. No Matching/Scheduler.");
  console.log("\nSTOP dry-run.\n");
}

main();
