/**
 * Controlled Publish: tea notice after Stage 4N DETAIL confirmation.
 * TINDA request untouched. No auto mass-publish.
 */
import { evaluateDemandQuality } from "../src/lib/demand-intelligence";
import { resolveProcurementDetail } from "../src/lib/lia/oi/procurement";
import { getControlledPublishService } from "../src/lib/lia/oi/publish";
import { passesPublicationQualityGate } from "../src/lib/lia/oi/publish/quality-gate";
import { buildSpecializedCandidate } from "../src/lib/lia/oi/sources/candidate-factory";
import { getOiStore, getCandidate } from "../src/lib/lia/oi/store";
import { createClient } from "@supabase/supabase-js";

const ACTOR = "0ae8067d-73e5-438e-bcfc-98e96d2c3001";
const REQ = "223decd8-c99a-4d24-ba25-2cb5d91749d3";
const NOTICE = "0303300143726000006";

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const before = await sb
    .from("ckr_requests")
    .select("id,status,updated_at,next_step_public,public_activity_text")
    .eq("id", REQ)
    .single();
  const { count: commentsBefore } = await sb
    .from("ckr_request_comments")
    .select("*", { count: "exact", head: true })
    .eq("request_id", REQ);

  // Already published?
  const { data: pubs } = await sb
    .from("opportunities")
    .select("id,title,canonical_url,source_url")
    .eq("status", "published")
    .eq("type", "procurement");
  const exists = (pubs || []).find((p) =>
    `${p.title} ${p.canonical_url} ${p.source_url}`.includes(NOTICE),
  );
  if (exists) {
    console.log("ALREADY_PUBLISHED", exists.id);
    return;
  }

  const detail = await resolveProcurementDetail({
    noticeId: NOTICE,
    mirrorUrls: [
      "https://star-pro.ru/region/respublika-dagestan/l0303300143726000006-1",
      "https://zakupki360.ru/tender/97804165",
    ],
    allowLiveFetch: true,
    skipCache: true,
  });
  console.log(
    "DETAIL",
    JSON.stringify({
      confidence: detail.confidence,
      sources: detail.sourcesUsed,
      customer: detail.customer,
      amount: detail.amount,
      deadline: detail.deadlineAt,
      lifecycle: detail.lifecycle,
    }),
  );
  if (!detail.customer || detail.amount == null || !detail.deadlineAt) {
    throw new Error("insufficient DETAIL for tea publish");
  }
  if (detail.lifecycle === "EXPIRED" || detail.lifecycle === "CANCELLED") {
    throw new Error(`lifecycle ${detail.lifecycle} — skip publish`);
  }
  if (Date.parse(detail.deadlineAt) < Date.now()) {
    throw new Error("deadline passed — skip publish");
  }

  const store = getOiStore();
  const page = await store.listCandidates({ pageSize: 250 });
  let id = page.items.find(
    (c) =>
      (c.sourceObjectId || "").includes(NOTICE) ||
      (c.title || "").includes(NOTICE) ||
      (c.canonicalUrl || "").includes(NOTICE),
  )?.id;

  if (!id) {
    const cand = buildSpecializedCandidate({
      adapterId: "procurement",
      opportunityType: "PROCUREMENT",
      sourceClass: "TENDERS",
      category: "PROCUREMENT",
      sourceName: `${detail.sourcesUsed[0] || "trusted_secondary"} (зеркало ЕИС)`,
      official: false,
      sourceConfidence: 74,
      title: `Чай черный (ферментированный) · Дагестан · ${NOTICE}`,
      description: [
        "Предмет: чай черный ферментированный в упаковках ≤3 кг.",
        `Заказчик: ${detail.customer}`,
        `НМЦК: ${detail.amount} ₽`,
        `Приём заявок до: ${detail.deadlineAt}`,
        `Проверка: ${detail.confidence}`,
        `Источники: ${detail.sourcesUsed.join(", ")}`,
        "Не официально подтверждено ЕИС с VPS (TCP timeout / credentials missing).",
      ].join(" "),
      url: detail.canonicalUrl || "https://zakupki360.ru/tender/97804165",
      region: detail.region || "Дагестан",
      industry: "beverage",
      askingPrice: detail.amount,
      objectId: NOTICE,
      deadlineRaw: detail.deadlineAt,
      isStub: false,
      whyInteresting: [
        "Активная закупка чая в Дагестане",
        "Соответствует beverage/tea ассортименту оптового поставщика",
      ],
    });
    const enriched = {
      ...cand,
      pageType: "DETAIL" as const,
      contentIntent: "OPPORTUNITY" as const,
      customer: detail.customer,
      nmck: detail.amount,
      sourceObjectId: NOTICE,
      enrichedFromFetch: true,
      detailConfidence: 76,
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
    id = enriched.id;
  }

  const c = await getCandidate(id!);
  if (!c) throw new Error("candidate missing");
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
      amountKnown: true,
      customer: c.customer,
      officialId: NOTICE,
      isStub: false,
    },
    needRegions: ["Дагестан"],
    needIndustries: ["food", "beverage"],
    needKeywords: ["чай", "напитки"],
    published: false,
  });
  console.log("QUALITY", q);
  if (!(q.bucket === "REAL_GOOD" || q.bucket === "REAL_ACCEPTABLE")) {
    throw new Error(`bucket ${q.bucket} — not publishing`);
  }
  const gate = passesPublicationQualityGate(c);
  console.log("GATE", gate);
  if (!gate.ok) throw new Error(`gate fail: ${gate.reasons.join(",")}`);

  const pub = getControlledPublishService();
  const queued = await pub.queueOne(c.id, ACTOR);
  console.log("queued", queued);
  if (!queued.queued) throw new Error(String(queued.reason));
  const approved = await pub.approve(c.id, ACTOR);
  console.log("approved", {
    id: approved.opportunity?.id,
    status: approved.opportunity?.status,
    title: approved.opportunity?.title,
  });

  const after = await sb
    .from("ckr_requests")
    .select("id,status,updated_at,next_step_public,public_activity_text")
    .eq("id", REQ)
    .single();
  const { count: commentsAfter } = await sb
    .from("ckr_request_comments")
    .select("*", { count: "exact", head: true })
    .eq("request_id", REQ);
  if (
    before.data?.updated_at !== after.data?.updated_at ||
    commentsBefore !== commentsAfter
  ) {
    console.error("TINDA_MUTATION");
    process.exitCode = 2;
  } else console.log("TINDA_UNCHANGED_OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
