/**
 * Local dry smoke for Feed v1 using in-memory fixtures shaped like production.
 * Does not touch production DB.
 */
import { createMemoryPersonalizedFeedService } from "../src/lib/personalized-feed/service";
import type { FeedCandidate } from "../src/types/personalized-feed";
import type { NeedProfile } from "../src/types/need-profile";

function need(p: Partial<NeedProfile> & Pick<NeedProfile, "id" | "intentType" | "ownerId">): NeedProfile {
  return {
    title: p.title || String(p.intentType),
    description: "",
    ownerType: "user",
    status: "ACTIVE",
    budgetMin: null,
    budgetMax: null,
    currency: "RUB",
    regions: [],
    industries: [],
    keywords: [],
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
    createdBy: p.ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...p,
  };
}

const marketplace: FeedCandidate[] = [
  {
    id: "a1000001-0000-4000-8000-000000000002",
    itemType: "project",
    title: "Производство питьевой воды",
    region: "Ставропольский край",
    industry: "production",
    industries: ["production"],
    price: 35_000_000,
    priceKnown: true,
    currency: "RUB",
    status: "published",
    sourceChannel: "internal",
    sourceLabel: "ЦКР · проект",
    sourceKey: "ckr_project",
    href: "/project/x",
    dataQuality: 6,
    sourceConfidence: 5,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    unknownFields: ["profit", "payback"],
    confirmedFields: ["title", "region", "price", "industry"],
  },
  {
    id: "a2000001-0000-4000-8000-000000000003",
    itemType: "opportunity",
    title: "Линия розлива и упаковки",
    region: "Ставропольский край",
    industry: "equipment",
    industries: ["equipment"],
    rawType: "equipment",
    price: 9_500_000,
    priceKnown: true,
    currency: "RUB",
    status: "published",
    sourceChannel: "internal",
    sourceLabel: "ЦКР · возможность",
    sourceKey: "ckr_opportunity",
    href: "/opportunity/x",
    dataQuality: 6,
    sourceConfidence: 5,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    unknownFields: [],
    confirmedFields: ["title", "region", "price"],
  },
  {
    id: "a3000001-0000-4000-8000-000000000001",
    itemType: "investment_offer",
    title: "Инвестиционное предложение 10 млн ₽",
    region: "Москва",
    regions: ["Москва", "Центральный ФО"],
    industry: "production",
    industries: ["it", "production"],
    price: 10_000_000,
    priceMin: 5_000_000,
    priceMax: 10_000_000,
    priceKnown: true,
    currency: "RUB",
    status: "published",
    sourceChannel: "internal",
    sourceLabel: "ЦКР · инвестиции",
    sourceKey: "ckr_investment",
    href: "/investment/x",
    dataQuality: 6,
    sourceConfidence: 5,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    unknownFields: [],
    confirmedFields: ["title", "price"],
  },
  {
    id: "pub-demand",
    itemType: "need_profile",
    title: "Ищем поставщика напитков",
    region: "Дагестан",
    regions: ["Дагестан"],
    industry: "beverage",
    industries: ["beverage"],
    rawType: "DEMAND",
    price: null,
    priceKnown: false,
    currency: "RUB",
    status: "ACTIVE",
    sourceChannel: "internal",
    sourceLabel: "ЦКР · потребность",
    sourceKey: "ckr_need",
    href: "/dashboard/needs/x",
    dataQuality: 4,
    sourceConfidence: 3,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    unknownFields: ["price"],
    confirmedFields: ["title", "region", "industry"],
  },
];

async function main() {
  const svc = createMemoryPersonalizedFeedService();
  svc.resetForTests();
  svc.setTestCandidates(marketplace);

  const invest = need({
    id: "need-invest",
    intentType: "INVEST",
    ownerId: "u1",
    budgetMax: 20_000_000,
    regions: ["Дагестан", "Ставропольский край"],
    industries: ["manufacturing"],
    title: "Вложить деньги",
  });
  const seekBuyer = need({
    id: "need-buyer",
    intentType: "SEEK_BUYER",
    ownerId: "u1",
    regions: ["Дагестан"],
    industries: ["beverage"],
    title: "Найти покупателя",
  });
  const seekSupport = need({
    id: "need-support",
    intentType: "SEEK_SUPPORT",
    ownerId: "u1",
    regions: ["Дагестан"],
    industries: ["manufacturing"],
  });
  const seekPartner = need({
    id: "need-partner",
    intentType: "SEEK_PARTNER",
    ownerId: "u1",
    regions: ["Краснодарский край"],
    industries: ["hospitality"],
  });

  svc.setTestNeeds([invest, seekBuyer, seekSupport, seekPartner]);

  console.log("COVERAGE", svc.getCoverageMap());

  const A = await svc.getFeedForNeedProfile({ need: invest, ownerId: "u1" });
  console.log(
    "SMOKE_A",
    A.recommendations.map((r) => ({
      title: r.candidate.title,
      score: r.score,
      budgetFit: r.breakdown.budgetFit,
      why: r.explanation.why,
    })),
  );

  const B = await svc.getFeedForNeedProfile({ need: seekBuyer, ownerId: "u1" });
  console.log(
    "SMOKE_B",
    B.recommendations.map((r) => ({
      title: r.candidate.title,
      score: r.score,
      type: r.candidate.itemType,
    })),
  );

  const C = await svc.getFeedForNeedProfile({ need: seekSupport, ownerId: "u1" });
  console.log("SMOKE_C", { coverage: C.diagnostics.coverage, n: C.recommendations.length });

  const D = await svc.getFeedForOwner({ ownerId: "u1", limit: 20 });
  console.log(
    "SMOKE_D",
    D.recommendations.map((r) => ({
      need: r.recommendationForNeedProfileId,
      intent: r.needIntentType,
      title: r.candidate.title,
      score: r.score,
    })),
  );

  console.log("SMOKE_OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
