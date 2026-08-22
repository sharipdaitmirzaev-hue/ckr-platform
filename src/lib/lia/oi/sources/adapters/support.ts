/**
 * Government support programs / grants / subsidies.
 * MSP.RF has no public unauthenticated bulk API in this environment —
 * Stage 2C uses fixtures + legal site-restricted discovery.
 */

import supportFixtures from "@/lib/lia/oi/sources/fixtures/support.json";
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

function matchQuery(q: LiaOiSourceAdapterQuery): boolean {
  const text = `${q.rawQuery} ${q.plan.intent}`.toLowerCase();
  return (
    q.plan.intent === "support_programs" ||
    (q.plan.sourceClasses || []).includes("SUPPORT_PROGRAMS") ||
    /поддержк|субсид|грант|льготн|мсп|господдерж|финансирован/.test(text)
  );
}

function fromFixtures(q: LiaOiSourceAdapterQuery): LiaOiSourceAdapterResult {
  const started = Date.now();
  const qText = q.rawQuery.toLowerCase();
  const rows = (supportFixtures as Array<Record<string, unknown>>).filter(
    (row) => {
      if (
        /пищев|производ/.test(qText) &&
        !/пищев|производ/.test(
          `${row.title} ${row.industry} ${row.program}`.toLowerCase(),
        )
      ) {
        return false;
      }
      return true;
    },
  );
  const candidates = rows.map((row) =>
    buildSpecializedCandidate({
      adapterId: "support_programs",
      opportunityType: "SUPPORT_PROGRAM",
      sourceClass: "SUPPORT_PROGRAMS",
      category: "SUPPORT_PROGRAMS",
      sourceName: "МСП.РФ / меры поддержки (fixture)",
      official: true,
      sourceConfidence: 86,
      title: String(row.title),
      description: `${row.program}. ${row.requirements || ""} Тип: ${row.supportType}. Оператор: ${row.operator}.`,
      url: String(row.url),
      region: (row.region as string) || null,
      industry: (row.industry as string) || null,
      investmentRequired: (row.amountMax as number) ?? null,
      objectId: String(row.programId),
      deadlineRaw: (row.deadline as string) || null,
      isStub: true,
      extraClaims: [
        {
          field: "programId",
          value: String(row.programId),
          kind: "FACT",
          sourceName: "fixture",
          sourceUrl: String(row.url),
        },
        {
          field: "supportType",
          value: String(row.supportType || ""),
          kind: "FACT",
          sourceName: "fixture",
          sourceUrl: String(row.url),
        },
        {
          field: "amount",
          value: String(row.amountText || ""),
          kind: "FACT",
          sourceName: "fixture",
          sourceUrl: String(row.url),
        },
      ],
      whyInteresting: [
        "Официальная мера господдержки",
        String(row.amountText || "Размер уточнять в программе"),
      ],
    }),
  );
  return {
    adapterId: "support_programs",
    label: "Господдержка",
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

export const supportProgramSourceAdapter: OpportunitySourceAdapter = {
  id: "support_programs",
  label: "Господдержка",
  category: "SUPPORT_PROGRAMS",
  sourceClass: "SUPPORT_PROGRAMS",
  opportunityType: "SUPPORT_PROGRAM",
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
      `${keywords} мера поддержки`,
      `${keywords} грант субсидия МСП`,
      `льготный кредит ${keywords}`,
    ].slice(0, this.budgets.maxRequestsPerRun);

    const { results, errors } = await searchOfficialSites({
      queries,
      sites: ["xn--l1agf.xn--p1ai", "corpmsp.ru", "мойбизнес.рф", "мсп.рф"],
      limitPerQuery: 5,
      timeoutMs: this.budgets.timeoutMs,
    });

    if (!results.length) {
      const fallback = fromFixtures(q);
      return {
        ...fallback,
        health: errors.length ? "DEGRADED" : "UNAVAILABLE",
        error: errors[0] || "no live support-program results",
        durationMs: Date.now() - started,
      };
    }

    const candidates = results
      .slice(0, this.budgets.maxResultsPerRun)
      .map((hit) =>
        hitToSpecializedCandidate(hit, {
          adapterId: "support_programs",
          opportunityType: "SUPPORT_PROGRAM",
          sourceClass: "SUPPORT_PROGRAMS",
          category: "SUPPORT_PROGRAMS",
          sourceName: "МСП.РФ / господдержка",
          idKind: "program",
        }),
      );

    return {
      adapterId: "support_programs",
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
