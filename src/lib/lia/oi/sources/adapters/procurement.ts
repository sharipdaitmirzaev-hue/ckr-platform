/**
 * Government procurement / tenders (44-FZ / 223-FZ).
 * EIS SOAP requires registration token — Stage 2C uses legal site-restricted discovery + fixtures.
 */

import procurementFixtures from "@/lib/lia/oi/sources/fixtures/procurement.json";
import {
  buildSpecializedCandidate,
  hitToSpecializedCandidate,
} from "@/lib/lia/oi/sources/candidate-factory";
import { searchOfficialSites } from "@/lib/lia/oi/sources/serper-site";
import type {
  LiaOiSourceAdapterQuery,
  LiaOiSourceAdapterResult,
  OpportunitySourceAdapter,
} from "@/lib/lia/oi/sources/types";

const SITES = ["zakupki.gov.ru"];

function matchQuery(q: LiaOiSourceAdapterQuery): boolean {
  const text = `${q.rawQuery} ${q.plan.intent}`.toLowerCase();
  return (
    q.plan.intent === "tenders" ||
    (q.plan.sourceClasses || []).includes("TENDERS") ||
    /закупк|тендер|нмцк|44-?фз|223-?фз|заказчик|поставк/.test(text)
  );
}

function fromFixtures(q: LiaOiSourceAdapterQuery): LiaOiSourceAdapterResult {
  const started = Date.now();
  const budget = q.plan.budgetMax;
  const qText = q.rawQuery.toLowerCase();
  const rows = (procurementFixtures as Array<Record<string, unknown>>).filter(
    (row) => {
      const nmck = Number(row.nmck ?? 0);
      if (budget != null && nmck > 0 && nmck > budget) return false;
      if (
        /вод|напит|пищев|продукт/.test(qText) &&
        !/вод|напит|пищев|продукт|упаков/.test(
          `${row.title} ${row.subject} ${row.industry}`.toLowerCase(),
        )
      ) {
        return false;
      }
      return true;
    },
  );
  const candidates = rows.map((row) =>
    buildSpecializedCandidate({
      adapterId: "procurement",
      opportunityType: "PROCUREMENT",
      sourceClass: "TENDERS",
      category: "PROCUREMENT",
      sourceName: "ЕИС Закупки (fixture)",
      official: true,
      sourceConfidence: 90,
      title: String(row.title),
      description: `${row.subject}. Заказчик: ${row.customer}. Этап: ${row.stage}.`,
      url: String(row.url),
      region: (row.region as string) || null,
      industry: (row.industry as string) || null,
      askingPrice: (row.nmck as number) ?? null,
      objectId: String(row.procurementId),
      deadlineRaw: (row.deadline as string) || null,
      isStub: true,
      extraClaims: [
        {
          field: "procurementId",
          value: String(row.procurementId),
          kind: "FACT",
          sourceName: "fixture",
          sourceUrl: String(row.url),
        },
        {
          field: "customer",
          value: String(row.customer || ""),
          kind: "FACT",
          sourceName: "fixture",
          sourceUrl: String(row.url),
        },
        {
          field: "stage",
          value: String(row.stage || ""),
          kind: "FACT",
          sourceName: "fixture",
          sourceUrl: String(row.url),
        },
      ],
      whyInteresting: [
        "Официальная закупка ЕИС",
        `НМЦК/сумма: ${row.nmck ?? "—"}`,
      ],
    }),
  );
  return {
    adapterId: "procurement",
    label: "Закупки / тендеры",
    health: "OK",
    durationMs: Date.now() - started,
    rawCount: rows.length,
    normalizedCount: candidates.length,
    candidates,
    error: null,
    official: true,
    transport: "fixture",
  };
}

export const procurementSourceAdapter: OpportunitySourceAdapter = {
  id: "procurement",
  label: "Закупки / тендеры",
  category: "PROCUREMENT",
  sourceClass: "TENDERS",
  opportunityType: "PROCUREMENT",
  official: true,
  budgets: {
    maxRequestsPerRun: 3,
    timeoutMs: 12_000,
    maxRetries: 1,
    maxResultsPerRun: 12,
  },
  matches: matchQuery,
  async healthcheck() {
    return "OK";
  },
  async search(q) {
    if (q.mode !== "live") return fromFixtures(q);
    const started = Date.now();
    const keywords = q.rawQuery.replace(/найди|найти/gi, "").trim().slice(0, 120);
    const queries = [
      `${keywords} закупка`,
      `${keywords} извещение 44-ФЗ`,
      `поставка ${keywords} НМЦК`,
    ].slice(0, this.budgets.maxRequestsPerRun);

    const { results, errors } = await searchOfficialSites({
      queries,
      sites: SITES,
      limitPerQuery: 5,
      timeoutMs: this.budgets.timeoutMs,
    });

    if (!results.length) {
      const fallback = fromFixtures(q);
      return {
        ...fallback,
        health: errors.length ? "DEGRADED" : "UNAVAILABLE",
        error: errors[0] || "no live EIS results",
        durationMs: Date.now() - started,
      };
    }

    const candidates = results
      .slice(0, this.budgets.maxResultsPerRun)
      .map((hit) =>
        hitToSpecializedCandidate(hit, {
          adapterId: "procurement",
          opportunityType: "PROCUREMENT",
          sourceClass: "TENDERS",
          category: "PROCUREMENT",
          sourceName: "ЕИС Закупки",
          idKind: "procurement",
        }),
      );

    return {
      adapterId: "procurement",
      label: this.label,
      health: errors.length ? "DEGRADED" : "OK",
      durationMs: Date.now() - started,
      rawCount: results.length,
      normalizedCount: candidates.length,
      candidates,
      error: errors[0] || null,
      official: true,
      transport: "serper_site",
    };
  },
};
