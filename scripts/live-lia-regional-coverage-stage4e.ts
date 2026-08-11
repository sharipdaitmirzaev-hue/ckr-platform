/**
 * Stage 4E — limited live targeted discovery on production (owner-triggered path).
 *
 * Usage on server (with /etc/ckr/ckr.env sourced):
 *   npx tsx scripts/live-lia-regional-coverage-stage4e.ts
 *   npx tsx scripts/live-lia-regional-coverage-stage4e.ts --publish-max=5
 *
 * Does NOT: Matching, Scheduler, auto-publish (publish only with --publish-max and manual gate),
 * cleanup, EIS setup.
 */
import { buildSearchPlanV2 } from "../src/lib/lia/oi/planner-v2";
import { buildTargetedDiscoveryQuery, DEFAULT_GAP_SCENARIOS, strategiesForGapScenario } from "../src/lib/lia/oi/content-gap";
import { runOwnerSearchPipeline } from "../src/lib/lia/oi/pipeline";
import { computePublishability } from "../src/lib/lia/oi/publishability";
import { computeDataQualityV2 } from "../src/lib/lia/oi/quality-v2";
import { classifyDemandSignal } from "../src/lib/lia/oi/regional/demand-classify";
import { computeSupportApplicability } from "../src/lib/lia/oi/regional/support-applicability";
import { normalizeRegionLabel } from "../src/lib/geo/region-normalize";
import { getControlledPublishService } from "../src/lib/lia/oi/publish";
import { listCandidates } from "../src/lib/lia/oi/store";
import type { LiaOiCandidate } from "../src/types/lia-oi";
import { LIA_OI_BUDGETS } from "../src/config/lia-oi";

const OWNER_ID =
  process.env.CKR_OWNER_USER_ID || "0ae8067d-73e5-438e-bcfc-98e96d2c3001";

const publishMax = (() => {
  const a = process.argv.find((x) => x.startsWith("--publish-max="));
  return a ? Math.min(5, Math.max(0, Number(a.split("=")[1]) || 0)) : 0;
})();

const SCENARIOS = [
  {
    key: "A_CONTRACT",
    scenarioId: "a_contract_food_dag",
    intentType: "SEEK_CONTRACT" as const,
    regions: ["Дагестан"],
    industries: ["food", "beverage"],
    budgetMax: null as number | null,
    label: "SEEK_CONTRACT food/beverage Dagestan",
  },
  {
    key: "B_SUPPORT",
    scenarioId: "c_support_mfg_dag",
    intentType: "SEEK_SUPPORT" as const,
    regions: ["Дагестан"],
    industries: ["manufacturing"],
    budgetMax: null as number | null,
    label: "SEEK_SUPPORT manufacturing Dagestan",
  },
  {
    key: "C_BUYER",
    scenarioId: "b_buyer_food_nc",
    intentType: "SEEK_BUYER" as const,
    regions: ["Дагестан"],
    industries: ["food", "beverage"],
    budgetMax: null as number | null,
    label: "SEEK_BUYER food/beverage Dagestan",
  },
  {
    key: "D_INVEST",
    scenarioId: "d_invest_30_nc",
    intentType: "INVEST" as const,
    regions: ["Дагестан"],
    industries: [] as string[],
    budgetMax: 30_000_000,
    label: "INVEST <=30m Dagestan",
  },
  {
    key: "E_PROJECT",
    scenarioId: "e_project_30_nc",
    intentType: "SEEK_PROJECT" as const,
    regions: ["Дагестан"],
    industries: [] as string[],
    budgetMax: 30_000_000,
    label: "SEEK_PROJECT <=30m Dagestan",
  },
];

function moneyOf(c: LiaOiCandidate) {
  return c.nmck ?? c.supportAmount ?? c.askingPrice ?? c.startingPrice ?? null;
}

function isRegionalSiteQuery(q: string) {
  return /site:(zakupki\.gov\.ru|e-dag\.ru|minec\.|minprom\.|mcxrd\.ru|mb05\.ru|cppdag\.ru|dagestaninvest\.ru|mspinvestrd\.ru|corpmsp\.ru)/i.test(
    q,
  );
}

function manualQuality(
  c: LiaOiCandidate,
  intent: string,
): "GOOD" | "ACCEPTABLE" | "WEAK" | "IRRELEVANT" {
  const region = normalizeRegionLabel(c.region);
  const dem = classifyDemandSignal({
    title: c.title,
    description: c.description,
    url: c.canonicalUrl,
    pageType: c.pageType,
    opportunityType: c.opportunityType,
  });
  const pub = computePublishability({
    ...c,
    dataQualityScore: computeDataQualityV2({ candidate: c }).dataQualityScore,
  });

  if (
    c.pageType === "NEWS" ||
    c.pageType === "GUIDE" ||
    c.contentIntent === "NEWS" ||
    c.contentIntent === "GUIDE" ||
    c.contentIntent === "ARTICLE" ||
    c.isCatalogSource ||
    c.pageType === "LIST"
  ) {
    return "IRRELEVANT";
  }

  const dagOk = region === "Дагестан";
  const money = moneyOf(c);

  if (intent === "SEEK_CONTRACT") {
    if (!dagOk) return "IRRELEVANT";
    if (
      c.opportunityType === "PROCUREMENT" &&
      c.pageType === "DETAIL" &&
      dem.classification === "CONFIRMED_DEMAND" &&
      (money != null || c.deadlineAt || c.sourceObjectId)
    ) {
      return pub.tier === "READY_TO_REVIEW" ? "GOOD" : "ACCEPTABLE";
    }
    return "WEAK";
  }

  if (intent === "SEEK_SUPPORT") {
    const app = computeSupportApplicability({
      title: c.title,
      description: c.description,
      url: c.canonicalUrl,
      region: c.region,
      opportunityType: c.opportunityType,
    });
    if (/стать[ьяи]|новост|как получить поддерж/i.test(`${c.title} ${c.description}`)) {
      return "IRRELEVANT";
    }
    if (
      c.opportunityType === "SUPPORT_PROGRAM" &&
      c.pageType === "DETAIL" &&
      (app.regionApplicability.includes("Dagestan") ||
        app.regionApplicability.includes("Russia"))
    ) {
      return pub.tier === "READY_TO_REVIEW" || money != null ? "GOOD" : "ACCEPTABLE";
    }
    if (app.isFederal && c.pageType === "DETAIL") return "ACCEPTABLE";
    return "WEAK";
  }

  if (intent === "SEEK_BUYER") {
    if (dem.classification === "CONFIRMED_DEMAND" && dagOk && c.pageType === "DETAIL") {
      return "GOOD";
    }
    if (dem.classification === "POTENTIAL_BUYER") return "ACCEPTABLE";
    return "WEAK";
  }

  if (intent === "INVEST" || intent === "SEEK_PROJECT") {
    if (/новост|открыл[аи]|торжественн/i.test(c.title) && c.pageType !== "DETAIL") {
      return "IRRELEVANT";
    }
    if (
      dagOk &&
      c.pageType === "DETAIL" &&
      !c.isCatalogSource &&
      (money == null || money <= 30_000_000 * 1.15)
    ) {
      return pub.tier === "READY_TO_REVIEW" ? "GOOD" : "ACCEPTABLE";
    }
    return "WEAK";
  }

  return "WEAK";
}

async function main() {
  console.log("\n=== Stage 4E LIVE targeted discovery ===");
  console.log("budgets", {
    maxQueriesPass1: LIA_OI_BUDGETS.maxQueriesPass1,
    maxQueriesPerRun: LIA_OI_BUDGETS.maxQueriesPerRun,
    maxResultsPerQuery: LIA_OI_BUDGETS.maxResultsPerQuery,
    maxFetchesPerRun: LIA_OI_BUDGETS.maxFetchesPerRun,
  });
  console.log("publishMax", publishMax, "owner", OWNER_ID.slice(0, 8));

  const beforeIds = new Set((await listCandidates({ pageSize: 100 })).map((c) => c.id));
  console.log("oi_before_sample_page", beforeIds.size);

  const totals = {
    queries: 0,
    raw: 0,
    afterDedup: 0,
    detail: 0,
    ready: 0,
    goodManual: 0,
    acceptable: 0,
    weak: 0,
    irrelevant: 0,
    confirmedRegion: 0,
    confirmedMoney: 0,
    confirmedDeadline: 0,
    confirmedDemand: 0,
    potentialBuyer: 0,
  };

  const allNew: Array<{
    c: LiaOiCandidate;
    intent: string;
    mq: ReturnType<typeof manualQuality>;
    scenario: string;
  }> = [];
  const queryReports: unknown[] = [];

  for (const s of SCENARIOS) {
    const gap =
      DEFAULT_GAP_SCENARIOS.find((g) => g.id === s.scenarioId) || {
        id: s.scenarioId,
        label: s.label,
        intentType: s.intentType,
        regions: s.regions,
        industries: s.industries,
        budgetMax: s.budgetMax,
      };
    const strategies = strategiesForGapScenario(gap, LIA_OI_BUDGETS.maxQueriesPass1);
    const seed = buildTargetedDiscoveryQuery(gap);
    const plan = buildSearchPlanV2({
      rawQuery: seed,
      need: {
        intentType: s.intentType,
        regions: s.regions,
        industries: s.industries,
        budgetMax: s.budgetMax,
        budgetMin: null,
        title: s.label,
      },
      regionalFirst: true,
    });

    const regionalQ = plan.queries.filter(isRegionalSiteQuery);
    const generalQ = plan.queries.filter((q) => !isRegionalSiteQuery(q));
    console.log(`\n--- ${s.key}: ${s.label} ---`);
    console.log("planner", plan.plannerVersion, "queries", plan.queries.length);
    console.log("regional_site", regionalQ.length, "fallback/general", generalQ.length);
    for (const q of plan.queries) {
      console.log("  Q:", isRegionalSiteQuery(q) ? "[SITE]" : "[GEN]", q);
    }

    const result = await runOwnerSearchPipeline({
      query: seed,
      userId: OWNER_ID,
      need: {
        intentType: s.intentType,
        regions: s.regions,
        industries: s.industries,
        budgetMax: s.budgetMax,
        budgetMin: null,
        title: s.label,
      },
      regionalFirst: true,
    });

    const queriesUsed =
      result.stats?.queriesRun ?? result.request?.plan?.queries?.length ?? plan.queries.length;
    totals.queries += queriesUsed;
    totals.raw += result.signalsScanned || 0;
    totals.afterDedup += result.afterDedup || 0;

    let detail = 0;
    let ready = 0;
    let good = 0;
    let acc = 0;
    let weak = 0;
    let irr = 0;
    let confDem = 0;
    let potBuy = 0;

    for (const c of result.candidates) {
      if (c.pageType === "DETAIL" && !c.isCatalogSource) detail += 1;
      const q = computeDataQualityV2({ candidate: c });
      const pub = computePublishability({
        ...c,
        dataQualityScore: q.dataQualityScore,
      });
      if (pub.tier === "READY_TO_REVIEW") ready += 1;
      if (normalizeRegionLabel(c.region)) totals.confirmedRegion += 1;
      if (moneyOf(c) != null) totals.confirmedMoney += 1;
      if (c.deadlineAt) totals.confirmedDeadline += 1;
      const dem = classifyDemandSignal({
        title: c.title,
        description: c.description,
        url: c.canonicalUrl,
        pageType: c.pageType,
        opportunityType: c.opportunityType,
      });
      if (dem.classification === "CONFIRMED_DEMAND") confDem += 1;
      if (dem.classification === "POTENTIAL_BUYER") potBuy += 1;

      const mq = manualQuality(c, s.intentType);
      if (mq === "GOOD") good += 1;
      else if (mq === "ACCEPTABLE") acc += 1;
      else if (mq === "IRRELEVANT") irr += 1;
      else weak += 1;

      if (!beforeIds.has(c.id)) {
        allNew.push({ c, intent: s.intentType, mq, scenario: s.key });
        beforeIds.add(c.id);
      }
    }

    totals.detail += detail;
    totals.ready += ready;
    totals.goodManual += good;
    totals.acceptable += acc;
    totals.weak += weak;
    totals.irrelevant += irr;
    totals.confirmedDemand += confDem;
    totals.potentialBuyer += potBuy;

    const report = {
      scenario: s.key,
      label: s.label,
      plannerVersion: plan.plannerVersion,
      strategiesPreview: strategies.map((x) => ({ id: x.id, domain: x.domain, query: x.query })),
      queries: plan.queries,
      regionalSiteQueries: regionalQ.length,
      generalQueries: generalQ.length,
      queriesUsed,
      raw: result.signalsScanned,
      afterDedup: result.afterDedup,
      enriched: result.candidates.filter((c) => c.enrichedFromFetch).length,
      detail,
      ready,
      goodManual: good,
      acceptable: acc,
      weak,
      irrelevant: irr,
      confirmedDemand: confDem,
      potentialBuyer: potBuy,
      searchMode: result.searchMode,
      providerUnavailable: result.providerUnavailable,
    };
    queryReports.push(report);
    console.log("RESULT", JSON.stringify({
      queriesUsed,
      raw: result.signalsScanned,
      afterDedup: result.afterDedup,
      detail,
      ready,
      goodManual: good,
      acceptable: acc,
      weak,
      irrelevant: irr,
      confirmedDemand: confDem,
      potentialBuyer: potBuy,
    }));
  }

  // Rank new candidates for owner review
  const rank = { GOOD: 0, ACCEPTABLE: 1, WEAK: 2, IRRELEVANT: 3 } as const;
  allNew.sort(
    (a, b) =>
      rank[a.mq] - rank[b.mq] ||
      (b.c.score?.overall || 0) - (a.c.score?.overall || 0),
  );
  const top10 = allNew.slice(0, 10);
  console.log("\n=== TOP-10 OWNER REVIEW (new) ===");
  for (const row of top10) {
    const c = row.c;
    const dq = computeDataQualityV2({ candidate: c });
    const pub = computePublishability({
      ...c,
      dataQualityScore: dq.dataQualityScore,
    });
    console.log(
      JSON.stringify({
        id: c.id,
        title: c.title.slice(0, 120),
        intent: row.intent,
        type: c.opportunityType,
        region: c.region,
        money: moneyOf(c),
        deadline: c.deadlineAt,
        source: c.sourceAdapterId,
        url: (c.canonicalUrl || "").slice(0, 100),
        dq: dq.dataQualityScore,
        publishability: pub.tier,
        manual: row.mq,
        scenario: row.scenario,
      }),
    );
  }

  let published = 0;
  if (publishMax > 0) {
    const svc = getControlledPublishService();
    const publishable = allNew.filter(
      (x) => x.mq === "GOOD" || x.mq === "ACCEPTABLE",
    ).slice(0, publishMax);
    console.log("\n=== CONTROLLED PUBLISH candidates ===", publishable.length);
    for (const row of publishable) {
      if (row.mq !== "GOOD" && row.mq !== "ACCEPTABLE") continue;
      // Only publish GOOD; strong ACCEPTABLE only if READY
      const dq = computeDataQualityV2({ candidate: row.c });
      const pub = computePublishability({
        ...row.c,
        dataQualityScore: dq.dataQualityScore,
      });
      if (row.mq !== "GOOD" && pub.tier !== "READY_TO_REVIEW") {
        console.log("skip_not_strong", row.c.id, row.mq, pub.tier);
        continue;
      }
      try {
        const q1 = await svc.queueOne(row.c.id, OWNER_ID);
        console.log("queueOne", row.c.id, q1);
        if (!q1.queued && q1.reason !== "already_published") {
          console.log("skip_gate", row.c.id, q1.reason);
          continue;
        }
        const approved = await svc.approve(row.c.id, OWNER_ID);
        console.log(
          "PUBLISHED",
          row.c.id,
          approved.opportunity?.id,
          approved.opportunity?.status,
        );
        published += 1;
      } catch (e) {
        console.log(
          "publish_fail",
          row.c.id,
          e instanceof Error ? e.message : e,
        );
      }
      if (published >= publishMax) break;
    }
  }

  console.log("\n=== TOTALS ===");
  console.log(
    JSON.stringify(
      {
        ...totals,
        goodPerQuery: totals.queries
          ? Number((totals.goodManual / totals.queries).toFixed(3))
          : 0,
        before4d: { queries: 40, results: 328, strong: 1, goodPerQuery: 0.025 },
        top10Count: top10.length,
        published,
        queryReports,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
