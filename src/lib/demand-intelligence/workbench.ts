/**
 * Stage 4M — Demand Workbench: published Feed + staff-only OI candidates.
 * No new tables. No Matching. Client never sees raw OI.
 */

import {
  demandTierLabelRu,
  evaluateDemandQuality,
  type DemandQualityTier,
} from "@/lib/demand-intelligence/quality";
import { buildDemandQueryPlan } from "@/lib/demand-intelligence/query-planner";
import {
  getRequestWorkbench,
  toWorkbenchView,
  type RequestWorkbenchResult,
  type WorkbenchCandidateView,
} from "@/lib/ckr-inbox/request-workbench";
import { classifyDemandSignal } from "@/lib/lia/oi/regional/demand-classify";
import { listCandidates } from "@/lib/lia/oi/store";
import { isFixtureNoise } from "@/lib/personalized-feed/fixtures";
import { rowToNeed, type NeedProfileRow } from "@/lib/need-profile/mappers";
import { createClient } from "@/lib/supabase/server";

export type DemandWorkbenchItem = WorkbenchCandidateView & {
  tier: DemandQualityTier;
  tierLabel: string;
  section: "confirmed" | "potential" | "review";
  staffOnly: boolean;
  customer: string | null;
  amountLabel: string | null;
  deadlineLabel: string | null;
  discoveredAt: string | null;
};

export type DemandWorkbenchResult = RequestWorkbenchResult & {
  confirmed: DemandWorkbenchItem[];
  potential: DemandWorkbenchItem[];
  review: DemandWorkbenchItem[];
  oiReviewCount: number;
  queryPlanSamples: string[];
};

function moneyLabel(n: number | null | undefined): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)} млн ₽`;
  }
  return `${Math.round(n).toLocaleString("ru-RU")} ₽`;
}

function mapPublished(
  base: RequestWorkbenchResult,
  needRegions: string[],
  needIndustries: string[],
  needKeywords: string[],
): DemandWorkbenchItem[] {
  return base.candidates.map((c) => {
    const q = evaluateDemandQuality({
      candidate: {
        id: c.itemId,
        title: c.title,
        summary: c.summary,
        region: c.region,
        rawType: c.rawType,
        opportunityType:
          c.rawType === "procurement" ? "PROCUREMENT" : c.rawType,
        url: c.canonicalUrl || undefined,
        sourceLabel: c.sourceLabel,
      },
      needRegions,
      needIndustries,
      needKeywords,
      feedScore: c.score,
      published: c.shareable,
    });
    const section: DemandWorkbenchItem["section"] =
      q.classification === "CONFIRMED_DEMAND" &&
      (q.bucket === "REAL_GOOD" || q.bucket === "REAL_ACCEPTABLE")
        ? "confirmed"
        : q.classification === "POTENTIAL_BUYER"
          ? "potential"
          : "review";
    return {
      ...c,
      tier: q.tier,
      tierLabel: demandTierLabelRu(q.tier),
      section,
      staffOnly: false,
      customer: null,
      amountLabel: null,
      deadlineLabel: null,
      discoveredAt: null,
      signalTypeLabel:
        q.classification === "POTENTIAL_BUYER"
          ? "Потенциальный покупатель"
          : c.signalTypeLabel,
      signalStatusLabel: demandTierLabelRu(q.tier),
    };
  });
}

/** Staff-only unpublished OI candidates relevant to the need. */
async function loadOiReviewItems(input: {
  needId: string;
  needRegions: string[];
  needIndustries: string[];
  needKeywords: string[];
  limit: number;
}): Promise<DemandWorkbenchItem[]> {
  let candidates;
  try {
    candidates = await listCandidates();
  } catch {
    return [];
  }

  const out: DemandWorkbenchItem[] = [];
  for (const c of candidates) {
    if (
      c.isStub ||
      isFixtureNoise({
        id: c.id,
        title: c.title,
        summary: c.description,
        fingerprint: c.fingerprint,
      })
    ) {
      continue;
    }

    // Attach classification if missing
    const classified =
      c.demandClassification ||
      classifyDemandSignal({
        title: c.title,
        description: c.description,
        url: c.canonicalUrl,
        pageType: c.pageType,
        opportunityType: c.opportunityType,
      }).classification;

    const q = evaluateDemandQuality({
      candidate: {
        id: c.id,
        title: c.title,
        summary: c.description,
        region: c.region,
        opportunityType: c.opportunityType,
        pageType: c.pageType,
        url: c.canonicalUrl,
        deadlineAt: c.deadlineAt,
        amountKnown: c.nmck != null,
        customer: c.customer,
        officialId: c.sourceObjectId,
        isStub: c.isStub,
      },
      needRegions: input.needRegions,
      needIndustries: input.needIndustries,
      needKeywords: input.needKeywords,
      published: false,
    });

    if (
      q.tier === "WEAK" ||
      q.tier === "REJECTED" ||
      q.tier === "EXPIRED" ||
      q.bucket === "SMOKE"
    ) {
      continue;
    }
    if (q.productFit < 8 && classified === "UNKNOWN") continue;
    if (q.productFit < 10 && classified === "POTENTIAL_BUYER") continue;

    const section: DemandWorkbenchItem["section"] =
      classified === "POTENTIAL_BUYER"
        ? "potential"
        : classified === "CONFIRMED_DEMAND"
          ? "confirmed"
          : "review";

    out.push({
      recommendationId: `oi:${c.id}`,
      itemType: "lia_oi",
      itemId: c.id,
      title: c.title,
      summary: (c.description || "").slice(0, 220),
      region: c.region ?? null,
      signalTypeLabel:
        classified === "POTENTIAL_BUYER"
          ? "Потенциальный покупатель"
          : classified === "CONFIRMED_DEMAND"
            ? "Закупка / спрос"
            : "Сигнал спроса",
      signalStatusLabel: demandTierLabelRu(q.tier),
      sourceLabel: "Найдено Лией · требует проверки",
      why: q.productMatched.length
        ? `Совпало: ${q.productMatched.join(", ")}`
        : "Внутренний кандидат OI — не опубликован",
      matched: q.productMatched,
      toVerify: ["Controlled Publish", "условия", "актуальность"],
      score: Math.min(100, 40 + q.productFit * 2),
      qualityHint: demandTierLabelRu(q.tier),
      href: `/admin/owner/lia/opportunities/${c.id}`,
      canonicalUrl: c.canonicalUrl || null,
      rawType: c.opportunityType || null,
      shareable: false,
      tier: q.tier,
      tierLabel: demandTierLabelRu(q.tier),
      section,
      staffOnly: true,
      customer: c.customer || null,
      amountLabel: moneyLabel(c.nmck ?? c.askingPrice ?? null),
      deadlineLabel: c.deadlineAt
        ? new Date(c.deadlineAt).toLocaleDateString("ru-RU")
        : null,
      discoveredAt: c.firstSeenAt || null,
    });
  }

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, input.limit);
}

export async function getDemandWorkbench(input: {
  requestId: string;
  needProfileId: string | null;
  ownerUserId: string;
  limit?: number;
}): Promise<DemandWorkbenchResult> {
  const base = await getRequestWorkbench(input);
  if (!input.needProfileId || !base.needProfileId) {
    return {
      ...base,
      confirmed: [],
      potential: [],
      review: [],
      oiReviewCount: 0,
      queryPlanSamples: [],
    };
  }

  const supabase = createClient();
  const { data: needRow } = await supabase
    .from("need_profiles")
    .select("*")
    .eq("id", input.needProfileId)
    .maybeSingle();
  const need = needRow ? rowToNeed(needRow as NeedProfileRow) : null;
  const needRegions = need?.regions || [];
  const needIndustries = need?.industries || [];
  const needKeywords = need?.keywords || [];

  const published = mapPublished(
    base,
    needRegions,
    needIndustries,
    needKeywords,
  );
  const oi = need
    ? await loadOiReviewItems({
        needId: need.id,
        needRegions,
        needIndustries,
        needKeywords,
        limit: 8,
      })
    : [];

  // Dedupe OI that mirrors already published titles
  const publishedTitles = new Set(
    published.map((p) => p.title.toLowerCase().slice(0, 48)),
  );
  const oiFiltered = oi.filter(
    (o) => !publishedTitles.has(o.title.toLowerCase().slice(0, 48)),
  );

  const all = [...published, ...oiFiltered];
  const confirmed = all.filter((x) => x.section === "confirmed");
  const potential = all.filter((x) => x.section === "potential");
  const review = all.filter((x) => x.section === "review");

  const plan = need
    ? buildDemandQueryPlan({ need, maxQueries: 8 })
    : null;

  return {
    ...base,
    total: all.length,
    candidates: all.slice(0, input.limit ?? 8),
    confirmed,
    potential,
    review,
    oiReviewCount: oiFiltered.length,
    queryPlanSamples: plan?.queries.slice(0, 5).map((q) => q.query) || [],
    emptyReason: all.length
      ? null
      : base.emptyReason ||
        "Пока нет сигналов спроса. Нажмите «Найти ещё варианты» или проверьте Controlled Publish.",
  };
}

export { toWorkbenchView };
