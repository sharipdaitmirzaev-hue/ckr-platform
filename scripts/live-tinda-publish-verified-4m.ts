/**
 * Controlled Publish of additional manually verified ACTIVE Dagestan demand.
 * TINDA request/need/comments untouched.
 */
import { evaluateDemandQuality } from "../src/lib/demand-intelligence";
import { getOiStore, getCandidate } from "../src/lib/lia/oi/store";
import { getControlledPublishService } from "../src/lib/lia/oi/publish";
import { passesPublicationQualityGate } from "../src/lib/lia/oi/publish/quality-gate";
import { buildSpecializedCandidate } from "../src/lib/lia/oi/sources/candidate-factory";
import { createClient } from "@supabase/supabase-js";

const ACTOR = "0ae8067d-73e5-438e-bcfc-98e96d2c3001";
const REQ = "223decd8-c99a-4d24-ba25-2cb5d91749d3";

const NEED = {
  regions: ["Дагестан"],
  industries: ["food", "beverage", "water", "grocery"],
  keywords: ["сок", "вода", "напитки", "чай", "продукты питания"],
};

type Verified = {
  notice: string;
  title: string;
  description: string;
  url: string;
  customer: string;
  nmck: number;
  deadlineRaw: string;
  city?: string;
};

const VERIFIED: Verified[] = [
  {
    notice: "0303300143726000006",
    title:
      "Чай черный (ферментированный) · Дагестан · 0303300143726000006",
    description:
      "Электронный аукцион 44-ФЗ. Заказчик: МКОУ «Аверьяновская СОШ». Предмет: чай черный ферментированный в упаковках ≤3 кг. НМЦК 26 000 ₽. Подача заявок до 19.08.2026 06:10. Источник: zakupki360.ru/tender/97804165.",
    url: "https://zakupki360.ru/tender/97804165",
    customer: 'МКОУ "Аверьяновская СОШ"',
    nmck: 26000,
    deadlineRaw: "2026-08-19T06:10:00+03:00",
  },
  {
    notice: "0103200008426006801",
    title: "Продукты питания 2026 · Дагестан · 0103200008426006801",
    description:
      "Закупка продуктов питания. Заказчик: ГБУ РД РЦИБ им. С.М. Магомедова. НМЦК 244 839 ₽. Подача заявок до 25.08.2026 04:00. Источник: zakupki360.ru/tender/97775690.",
    url: "https://zakupki360.ru/tender/97775690",
    customer: "ГБУ РД РЦИБ им. С.М. Магомедова",
    nmck: 244839,
    deadlineRaw: "2026-08-25T04:00:00+03:00",
    city: "Махачкала",
  },
  {
    notice: "0103200008426006533",
    title:
      'Поставка продуктов питания · лагерь «Планета» · 0103200008426006533',
    description:
      "Поставка продуктов питания для организации отдыха детей в лагере «Планета» Буйнакского района. Заказчик: ГБУ ДО РД ДОЛ «Планета». НМЦК 469 300 ₽. Подача заявок до 14.08.2026 04:00. Источник: zakupki360.ru/tender/97586804.",
    url: "https://zakupki360.ru/tender/97586804",
    customer: 'ГБУ ДО РД ДОЛ "Планета"',
    nmck: 469300,
    deadlineRaw: "2026-08-14T04:00:00+03:00",
    city: "Буйнакский район",
  },
];

async function ensure(v: Verified) {
  const store = getOiStore();
  const page = await store.listCandidates({ pageSize: 200 });
  const found = page.items.find(
    (c) =>
      (c.sourceObjectId && c.sourceObjectId.includes(v.notice)) ||
      (c.canonicalUrl || "").includes(v.notice) ||
      (c.title || "").includes(v.notice),
  );
  if (found) return found.id;

  const cand = buildSpecializedCandidate({
    adapterId: "procurement",
    opportunityType: "PROCUREMENT",
    sourceClass: "PROCUREMENT",
    category: "PROCUREMENT",
    sourceName: "zakupki360.ru (зеркало ЕИС)",
    official: false,
    sourceConfidence: 70,
    title: v.title,
    description: v.description,
    url: v.url,
    region: "Дагестан",
    city: v.city || null,
    industry: "food",
    askingPrice: v.nmck,
    objectId: v.notice,
    deadlineRaw: v.deadlineRaw,
    isStub: false,
    whyInteresting: [
      "Активная закупка в Дагестане",
      `Заказчик: ${v.customer}`,
      `НМЦК ${v.nmck} ₽`,
    ],
  });
  const enriched = {
    ...cand,
    pageType: "DETAIL" as const,
    contentIntent: "OPPORTUNITY" as const,
    customer: v.customer,
    nmck: v.nmck,
    sourceObjectId: v.notice,
    resultBucket: "NEEDS_RESEARCH" as const,
    detailConfidence: 70,
    enrichedFromFetch: true,
  };
  await store.upsertCandidates([enriched]);
  return enriched.id;
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const before = await sb
    .from("ckr_requests")
    .select("updated_at")
    .eq("id", REQ)
    .single();
  const { count: evBefore } = await sb
    .from("ckr_request_events")
    .select("*", { count: "exact", head: true })
    .eq("request_id", REQ);

  const svc = getControlledPublishService();
  const out: unknown[] = [];

  for (const v of VERIFIED) {
    const id = await ensure(v);
    const c = await getCandidate(id);
    if (!c) throw new Error("missing " + id);
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
        officialId: c.sourceObjectId,
        isStub: c.isStub,
      },
      needRegions: NEED.regions,
      needIndustries: NEED.industries,
      needKeywords: NEED.keywords,
      published: false,
    });
    const gate = passesPublicationQualityGate(c);
    const row: Record<string, unknown> = {
      notice: v.notice,
      id,
      bucket: q.bucket,
      tier: q.tier,
      classification: q.classification,
      productFit: q.productFit,
      gate: gate.ok ? "ok" : gate.reasons,
      pubState: c.publicationState,
    };
    if (
      (q.bucket === "REAL_GOOD" || q.bucket === "REAL_ACCEPTABLE") &&
      q.classification === "CONFIRMED_DEMAND" &&
      gate.ok &&
      c.publicationState !== "published" &&
      !c.marketplaceOpportunityId
    ) {
      const queued = await svc.queueOne(id, ACTOR);
      row.queued = queued;
      if (queued.queued) {
        const approved = await svc.approve(id, ACTOR);
        row.marketplaceId = approved.opportunity.id;
        row.status = approved.opportunity.status;
      }
    } else if (c.publicationState === "published") {
      row.alreadyPublished = c.marketplaceOpportunityId;
    } else {
      row.skipped = true;
    }
    out.push(row);
    console.log(JSON.stringify(row));
  }

  const after = await sb
    .from("ckr_requests")
    .select("updated_at")
    .eq("id", REQ)
    .single();
  const { count: evAfter } = await sb
    .from("ckr_request_events")
    .select("*", { count: "exact", head: true })
    .eq("request_id", REQ);
  console.log(
    "TINDA",
    before.data?.updated_at === after.data?.updated_at && evBefore === evAfter
      ? "UNCHANGED_OK"
      : "MUTATION",
    { evBefore, evAfter },
  );
  console.log("DONE", JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
