/**
 * Stage 4N production verification:
 * 1) control-notice resolver (read-only DETAIL)
 * 2) tea + false-positive product checks
 * 3) one controlled live discovery for TINDA Need
 * 4) owner review list
 * 5) Controlled Publish only for new REAL GOOD/ACCEPTABLE (max 10)
 * 6) TINDA freeze guard
 *
 * DEMAND_LIVE=1 required. No CLIENT messages. No Matching. No auto-publish.
 */
import { createClient } from "@supabase/supabase-js";
import {
  assessAssortmentSufficiency,
  evaluateDemandQuality,
  isFoodFalsePositiveForBeverageWholesale,
  productFitScore,
  runDemandDiscoveryForNeed,
} from "../src/lib/demand-intelligence";
import { rowToNeed, type NeedProfileRow } from "../src/lib/need-profile/mappers";
import {
  extractNoticeIdFromText,
  extractNoticeIdFromUrl,
  resolveProcurementDetail,
  resetProcurementDetailCache,
  summarizeDetailResolveStats,
} from "../src/lib/lia/oi/procurement";
import { resolveOiSearchMode } from "../src/lib/lia/oi/mode";
import { getControlledPublishService } from "../src/lib/lia/oi/publish";
import { passesPublicationQualityGate } from "../src/lib/lia/oi/publish/quality-gate";
import { buildSpecializedCandidate } from "../src/lib/lia/oi/sources/candidate-factory";
import { getCandidate, getOiStore, listCandidates } from "../src/lib/lia/oi/store";

const ACTOR = "0ae8067d-73e5-438e-bcfc-98e96d2c3001";
const REQ = "223decd8-c99a-4d24-ba25-2cb5d91749d3";
const NEED_ID = "15e85d03-2dd9-4c99-8d28-4c66e03d29d5";

const CONTROL = [
  {
    id: "0303300064726000936",
    mirrors: [
      "https://star-pro.ru/region/respublika-dagestan/l0303300064726000936-1",
    ],
  },
  {
    id: "0103200008426006399",
    mirrors: [
      "https://star-pro.ru/region/respublika-dagestan/l0103200008426006399-1",
    ],
  },
  {
    id: "0103200008426006801",
    mirrors: [
      "https://star-pro.ru/region/respublika-dagestan/l0103200008426006801-1",
    ],
  },
  {
    id: "0103200008426006533",
    mirrors: [
      "https://star-pro.ru/region/respublika-dagestan/l0103200008426006533-1",
    ],
  },
  {
    id: "0303300143726000006",
    mirrors: [
      "https://star-pro.ru/region/respublika-dagestan/l0303300143726000006-1",
      "https://zakupki360.ru/tender/97804165",
    ],
  },
] as const;

const KNOWN_PUBLISHED = new Set([
  "0303300064726000936",
  "0103200008426006399",
  "0103200008426006801",
  "0103200008426006533",
  "0373100043226000123",
]);

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function tindaGuard(label: string) {
  const sb = db();
  const { data: req } = await sb
    .from("ckr_requests")
    .select(
      "id,status,updated_at,next_step_public,public_activity_text,need_profile_id",
    )
    .eq("id", REQ)
    .single();
  const { count: comments } = await sb
    .from("ckr_request_comments")
    .select("*", { count: "exact", head: true })
    .eq("request_id", REQ);
  const { count: events } = await sb
    .from("ckr_request_events")
    .select("*", { count: "exact", head: true })
    .eq("request_id", REQ);
  const { data: need } = await sb
    .from("need_profiles")
    .select("id,regions,industries,keywords,updated_at,status,intent_type")
    .eq("id", NEED_ID)
    .single();
  console.log(label, JSON.stringify({ req, comments, events, need }));
  return { req, comments, events, need };
}

async function ensureFromDetail(detail: {
  noticeId: string;
  title: string | null;
  subject: string | null;
  customer: string | null;
  region: string | null;
  amount: number | null;
  deadlineAt: string | null;
  canonicalUrl: string | null;
  confidence: string;
  sourcesUsed: string[];
  lifecycle: string;
}) {
  const store = getOiStore();
  const page = await store.listCandidates({ pageSize: 250 });
  const found = page.items.find(
    (c) =>
      (c.sourceObjectId && c.sourceObjectId.includes(detail.noticeId)) ||
      (c.canonicalUrl || "").includes(detail.noticeId) ||
      (c.title || "").includes(detail.noticeId),
  );
  if (found) return found.id;

  if (!detail.customer && detail.amount == null && !detail.deadlineAt) {
    return null;
  }

  const sourceHost = detail.sourcesUsed[0] || "trusted_secondary";
  const cand = buildSpecializedCandidate({
    adapterId: "procurement",
    opportunityType: "PROCUREMENT",
    sourceClass: "TENDERS",
    category: "PROCUREMENT",
    sourceName: `${sourceHost} (зеркало ЕИС)`,
    official: detail.confidence === "OFFICIAL_CONFIRMED",
    sourceConfidence: detail.confidence === "OFFICIAL_CONFIRMED" ? 88 : 72,
    title:
      detail.title ||
      detail.subject ||
      `Закупка · ${detail.noticeId}`,
    description: [
      detail.subject || detail.title || "",
      detail.customer ? `Заказчик: ${detail.customer}` : "",
      detail.amount != null ? `НМЦК: ${detail.amount} ₽` : "НМЦК: UNKNOWN",
      detail.deadlineAt ? `Приём заявок до: ${detail.deadlineAt}` : "",
      `Проверка: ${detail.confidence}`,
      `Источники: ${detail.sourcesUsed.join(", ") || "n/a"}`,
    ]
      .filter(Boolean)
      .join(". "),
    url:
      detail.canonicalUrl ||
      `https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=${detail.noticeId}`,
    region: detail.region || "Дагестан",
    industry: "food",
    askingPrice: detail.amount ?? undefined,
    objectId: detail.noticeId,
    deadlineRaw: detail.deadlineAt || undefined,
    isStub: false,
    whyInteresting: [
      "Demand signal via Stage 4N resolver",
      detail.customer ? `Заказчик: ${detail.customer}` : "Заказчик UNKNOWN",
    ],
  });

  const enriched = {
    ...cand,
    pageType: "DETAIL" as const,
    contentIntent: "OPPORTUNITY" as const,
    customer: detail.customer,
    nmck: detail.amount,
    sourceObjectId: detail.noticeId,
    enrichedFromFetch: true,
    detailConfidence:
      detail.confidence === "OFFICIAL_CONFIRMED"
        ? 85
        : detail.confidence === "MULTI_SOURCE_CONFIRMED"
          ? 78
          : 70,
    claims: [
      ...(cand.claims || []),
      {
        field: "detail_confidence",
        value: detail.confidence,
        kind: "FACT" as const,
        sourceUrl: detail.canonicalUrl || undefined,
        note: detail.sourcesUsed.join(", "),
      },
    ],
  };

  await store.upsertCandidates([enriched]);
  return enriched.id;
}

async function main() {
  if (process.env.DEMAND_LIVE !== "1") throw new Error("DEMAND_LIVE=1 required");
  if (resolveOiSearchMode().mode !== "live") {
    throw new Error(`OI mode is ${resolveOiSearchMode().mode}, need live`);
  }

  const before = await tindaGuard("TINDA_BEFORE");

  // --- 1) Control notices ---
  resetProcurementDetailCache();
  const controlResults = [];
  for (const n of CONTROL) {
    const detail = await resolveProcurementDetail({
      noticeId: n.id,
      mirrorUrls: [...n.mirrors],
      allowLiveFetch: true,
      skipCache: true,
    });
    const fit = productFitScore(
      ["food", "beverage"],
      ["напитки", "продукты", "чай", "вода"],
      `${detail.title || ""} ${detail.subject || ""} ${detail.customer || ""}`,
    );
    controlResults.push({ notice: n.id, detail, fit });
    console.log(
      "CONTROL",
      JSON.stringify({
        notice: n.id,
        confidence: detail.confidence,
        sources: detail.sourcesUsed,
        customer: detail.customer,
        subject: detail.subject || detail.title,
        region: detail.region,
        amount: detail.amount,
        deadline: detail.deadlineAt,
        lifecycle: detail.lifecycle,
        productFit: fit.score,
        matched: fit.matched,
        fetchedAt: detail.fetchedAt,
        verifiedAt: detail.verifiedAt,
        facts: detail.facts.slice(0, 8).map((f) => ({
          field: f.field,
          value: f.value,
          kind: f.kind,
          sourceId: f.sourceId,
          trust: f.trust,
        })),
        attempts: detail.attempts.map((a) => ({
          sourceId: a.sourceId,
          ok: a.ok,
          reason: a.reason,
          trust: a.trust,
        })),
      }),
    );
  }
  const stats = summarizeDetailResolveStats(controlResults.map((r) => r.detail));
  console.log(
    "DETAIL_RATE",
    JSON.stringify({
      beforeBaseline: "0/8",
      ...stats,
      rate: `${stats.detailSuccess}/${stats.detailAttempts}`,
    }),
  );

  // provenance conflict demo (offline-ish using two mirrors if available)
  const dairy = controlResults.find((r) => r.notice === "0103200008426006399");
  if (dairy) {
    console.log(
      "PROVENANCE_SAMPLE",
      JSON.stringify(
        dairy.detail.facts.filter((f) =>
          ["customer", "nmck", "deadline_at", "region", "subject", "customer_conflict"].includes(
            f.field,
          ),
        ),
      ),
    );
  }

  // --- tea + false positives ---
  const tea = controlResults.find((r) => r.notice === "0303300143726000006");
  console.log(
    "TEA",
    JSON.stringify({
      notice: "0303300143726000006",
      fit: tea?.fit,
      lifecycle: tea?.detail.lifecycle,
      customer: tea?.detail.customer,
      amount: tea?.detail.amount,
      deadline: tea?.detail.deadlineAt,
      confidence: tea?.detail.confidence,
    }),
  );
  console.log(
    "FALSE_POSITIVE",
    JSON.stringify({
      meat: {
        fp: isFoodFalsePositiveForBeverageWholesale("поставка мяса говядины"),
        fit: productFitScore(["beverage"], ["напитки"], "поставка мяса говядины"),
      },
      medical: {
        fp: isFoodFalsePositiveForBeverageWholesale(
          "специализированное медицинское питание энтеральное",
        ),
        fit: productFitScore(
          ["beverage"],
          ["напитки"],
          "специализированное медицинское питание энтеральное",
        ),
      },
      baby: {
        fp: isFoodFalsePositiveForBeverageWholesale(
          "специализированное детское питание смесь",
        ),
        fit: productFitScore(
          ["beverage"],
          ["напитки"],
          "специализированное детское питание смесь",
        ),
      },
      assortment: assessAssortmentSufficiency({
        industries: ["food", "beverage"],
        keywords: [],
        offerSummary: 'ООО "Тинда"',
      }),
    }),
  );

  // --- 2) One controlled live discovery ---
  const sb = db();
  const { data: needRow } = await sb
    .from("need_profiles")
    .select("*")
    .eq("id", NEED_ID)
    .single();
  if (!needRow) throw new Error("need missing");
  const need = rowToNeed(needRow as NeedProfileRow);
  // Expand keywords for discovery plan without mutating DB need
  need.keywords = [
    ...(need.keywords || []),
    "вода",
    "минеральная вода",
    "напитки",
    "сок",
    "чай",
    "кофе",
    "продукты питания",
    "бакалея",
  ];
  need.industries = [
    ...(need.industries || []),
    "water",
    "grocery",
    "horeca_supply",
  ];

  const beforeIds = new Set((await listCandidates()).map((c) => c.id));
  console.log("\n=== LIVE DISCOVERY ===");
  const discovery = await runDemandDiscoveryForNeed({
    need,
    userId: ACTOR,
    maxQueries: 8,
  });
  console.log("DISCOVERY", JSON.stringify(discovery, null, 2));

  const afterList = await listCandidates();
  const newOnes = afterList.filter((c) => !beforeIds.has(c.id));
  console.log("NEW_CANDIDATES", newOnes.length);

  // Enrich unique notice IDs from discovery via resolver (no invent)
  const noticeMap = new Map<string, (typeof afterList)[0]>();
  for (const c of [...newOnes, ...afterList.filter((x) => x.opportunityType === "PROCUREMENT")]) {
    const nid =
      extractNoticeIdFromText(c.sourceObjectId) ||
      extractNoticeIdFromUrl(c.canonicalUrl) ||
      extractNoticeIdFromText(c.title) ||
      extractNoticeIdFromText(c.description);
    if (!nid) continue;
    if (!noticeMap.has(nid)) noticeMap.set(nid, c);
  }

  const review: Array<Record<string, unknown>> = [];
  const publishedNow: string[] = [];
  let publishBudget = 10;

  // Ensure tea DETAIL candidate exists for owner review if ACTIVE-ish
  if (tea?.detail && tea.fit.score >= 14) {
    const life = tea.detail.lifecycle;
    const expired =
      life === "EXPIRED" ||
      life === "CANCELLED" ||
      (tea.detail.deadlineAt &&
        Date.parse(tea.detail.deadlineAt) < Date.now() - 24 * 3600_000);
    if (!expired && !KNOWN_PUBLISHED.has(tea.detail.noticeId)) {
      const id = await ensureFromDetail(tea.detail);
      if (id) console.log("ENSURED_TEA_OI", id);
    }
  }

  // Also ensure any newly discovered unique notices with strong DETAIL
  for (const [nid, c] of noticeMap) {
    if (KNOWN_PUBLISHED.has(nid)) continue;
    if (CONTROL.some((x) => x.id === nid) && nid !== "0303300143726000006") {
      // already published control set except tea
      continue;
    }
    const detail = await resolveProcurementDetail({
      noticeId: nid,
      url: c.canonicalUrl,
      mirrorUrls: [c.canonicalUrl || "", ...CONTROL.flatMap((x) => [...x.mirrors])].filter(Boolean),
      allowLiveFetch: true,
    });
    if (detail.sourcesUsed.length) {
      await ensureFromDetail(detail);
    }
  }

  const publishSvc = getControlledPublishService();
  const all = await listCandidates();
  for (const c of all) {
    const nid =
      extractNoticeIdFromText(c.sourceObjectId) ||
      extractNoticeIdFromUrl(c.canonicalUrl) ||
      extractNoticeIdFromText(c.title);
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
        amountKnown: c.nmck != null || c.askingPrice != null,
        customer: c.customer,
        officialId: c.sourceObjectId,
        isStub: c.isStub,
        publicationState: c.publicationState,
      },
      needRegions: need.regions,
      needIndustries: ["food", "beverage", "water", "grocery"],
      needKeywords: need.keywords,
      published: c.publicationState === "published",
    });

    const confClaim = c.claims?.find((x) => x.field === "detail_confidence");
    const item: Record<string, unknown> = {
      id: c.id,
      notice: nid,
      title: c.title,
      customer: c.customer,
      subject: (c.description || "").slice(0, 160),
      region: c.region,
      amount: c.nmck ?? c.askingPrice,
      deadline: c.deadlineAt,
      lifecycleHint: c.deadlineAt && Date.parse(c.deadlineAt) < Date.now() ? "EXPIRED?" : "ACTIVE?",
      productFit: q.productFit,
      matched: q.productMatched,
      bucket: q.bucket,
      tier: q.tier,
      classification: q.classification,
      confidence: confClaim?.value || null,
      provenanceNote: confClaim?.note || null,
      sourceLabel: c.sources?.[0]?.name || null,
      url: c.canonicalUrl,
      dup: nid && KNOWN_PUBLISHED.has(nid) ? "known_published_notice" : null,
      pubState: c.publicationState,
      marketId: c.marketplaceOpportunityId,
      isStub: c.isStub,
      isNew: !beforeIds.has(c.id),
    };

    const worthPublish =
      publishBudget > 0 &&
      nid &&
      !KNOWN_PUBLISHED.has(nid) &&
      (q.bucket === "REAL_GOOD" || q.bucket === "REAL_ACCEPTABLE") &&
      q.classification === "CONFIRMED_DEMAND" &&
      !c.isStub &&
      c.publicationState !== "published" &&
      !c.marketplaceOpportunityId &&
      q.productFit >= 14 &&
      !(c.deadlineAt && Date.parse(c.deadlineAt) < Date.now());

    if (worthPublish) {
      const fresh = await getCandidate(c.id);
      if (!fresh) continue;
      const gate = passesPublicationQualityGate(fresh);
      item.gate = gate;
      if (gate.ok) {
        const queued = await publishSvc.queueOne(c.id, ACTOR);
        item.queued = queued;
        if (queued.queued) {
          const approved = await publishSvc.approve(c.id, ACTOR);
          item.approved = {
            id: approved.opportunity?.id,
            status: approved.opportunity?.status,
            title: approved.opportunity?.title,
          };
          if (approved.opportunity?.status === "published") {
            publishedNow.push(nid!);
            KNOWN_PUBLISHED.add(nid!);
            publishBudget -= 1;
            item.publishedNow = true;
          }
        }
      }
    }

    if (
      item.isNew ||
      item.publishedNow ||
      (nid && CONTROL.some((x) => x.id === nid)) ||
      worthPublish
    ) {
      review.push(item);
    }
  }

  console.log("\n=== OWNER_REVIEW ===");
  console.log(JSON.stringify(review, null, 2));
  console.log("PUBLISHED_NOW", publishedNow);

  const after = await tindaGuard("TINDA_AFTER");
  if (
    before.req?.updated_at !== after.req?.updated_at ||
    before.comments !== after.comments ||
    before.events !== after.events ||
    (before.req?.next_step_public || "") !== (after.req?.next_step_public || "") ||
    (before.req?.public_activity_text || "") !==
      (after.req?.public_activity_text || "")
  ) {
    console.error("TINDA_MUTATION_DETECTED");
    process.exitCode = 2;
  } else {
    console.log("TINDA_UNCHANGED_OK");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
