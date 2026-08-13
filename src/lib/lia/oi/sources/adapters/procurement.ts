/**
 * Government procurement / tenders (44-FZ / 223-FZ).
 * Stage 2C.3: Official EIS SOAP/XML provider (fixtures without token) → primary;
 * Serper site discovery → fallback. Never crash if official API unavailable.
 */

import {
  mergeCandidatePool,
  officialObjectToCandidate,
  procurementOfficialProvider,
} from "@/lib/lia/oi/sources/providers";
import {
  buildSpecializedCandidate,
  hitToSpecializedCandidate,
} from "@/lib/lia/oi/sources/candidate-factory";
import { searchOfficialSites } from "@/lib/lia/oi/sources/serper-site";
import type {
  LiaOiSourceAdapterQuery,
  OpportunitySourceAdapter,
} from "@/lib/lia/oi/sources/types";
import type { LiaOiCandidate } from "@/types/lia-oi";

/** Official + trusted secondary mirrors reachable from VPS (Stage 4N audit). */
const SITES = [
  "zakupki.gov.ru",
  "star-pro.ru",
  "zakupki360.ru",
  "tektorg.ru",
];

function matchQuery(q: LiaOiSourceAdapterQuery): boolean {
  const text = `${q.rawQuery} ${q.plan.intent}`.toLowerCase();
  return (
    q.plan.intent === "tenders" ||
    (q.plan.sourceClasses || []).includes("TENDERS") ||
    /закупк|тендер|нмцк|44-?фз|223-?фз|заказчик|поставк/.test(text)
  );
}

function tagSerper(c: LiaOiCandidate): LiaOiCandidate {
  return {
    ...c,
    dataChannel: "SERPER_DISCOVERY",
    officialApiProvider: "eis",
    officialApiStatus: procurementOfficialProvider.getConnectionStatus(),
    sourceConfidence: c.sourceConfidence ?? 82,
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
    // Adapter operational health (fixtures/Serper soft-fail). Credentials → separate status UI.
    try {
      procurementOfficialProvider.getConnectionStatus();
      return "OK";
    } catch {
      return "UNAVAILABLE";
    }
  },
  async search(q) {
    const started = Date.now();
    const connectionStatus = procurementOfficialProvider.getConnectionStatus();
    let officialCandidates: LiaOiCandidate[] = [];
    let officialTransport: "fixture" | "http_api" | "serper_site" = "fixture";
    let officialError: string | null = null;

    // Stub → official-format fixtures. Live + CONNECTED → live SOAP.
    // Live without credentials → skip fixtures in primary path (Serper discovery).
    const wantOfficialPrimary =
      q.mode !== "live" || connectionStatus === "CONNECTED";
    if (wantOfficialPrimary) {
      try {
        const official = await procurementOfficialProvider.search({
          rawQuery: q.rawQuery,
          limit: this.budgets.maxResultsPerRun,
          allowLive: q.mode === "live" && connectionStatus === "CONNECTED",
          useFixtures: q.mode !== "live" || connectionStatus !== "CONNECTED",
        });
        officialTransport = official.transport;
        officialError = official.error || null;
        const budget = q.plan.budgetMax;
        officialCandidates = official.objects
          .filter((o) => {
            if (budget != null && o.nmck != null && o.nmck > budget) return false;
            return true;
          })
          .map((o) =>
            officialObjectToCandidate(o, {
              adapterId: "procurement",
              opportunityType: "PROCUREMENT",
              sourceClass: "TENDERS",
              category: "PROCUREMENT",
            }),
          )
          .map((c) => ({
            ...c,
            officialApiStatus:
              official.connectionStatus === "UNAVAILABLE"
                ? "UNAVAILABLE"
                : c.officialApiStatus,
          }));
      } catch (error) {
        officialError =
          error instanceof Error ? error.message : "eis_provider_error";
        // soft-fail — continue with Serper/fixtures
      }
    }

    if (q.mode !== "live") {
      return {
        adapterId: "procurement",
        label: this.label,
        health: "OK",
        durationMs: Date.now() - started,
        rawCount: officialCandidates.length,
        normalizedCount: officialCandidates.length,
        candidates: officialCandidates,
        error: officialError,
        official: true,
        transport: "fixture",
      };
    }

    // Live: Serper discovery / fallback
    const keywords = q.rawQuery.replace(/найди|найти/gi, "").trim().slice(0, 120);
    const queries = [
      `${keywords} закупка`,
      `${keywords} извещение 44-ФЗ`,
      `поставка ${keywords} НМЦК`,
    ].slice(0, this.budgets.maxRequestsPerRun);

    let serperCandidates: LiaOiCandidate[] = [];
    let serperErrors: string[] = [];
    try {
      const { results, errors } = await searchOfficialSites({
        queries,
        sites: SITES,
        limitPerQuery: 5,
        timeoutMs: this.budgets.timeoutMs,
      });
      serperErrors = errors;
      serperCandidates = results
        .slice(0, this.budgets.maxResultsPerRun)
        .map((hit) =>
          tagSerper(
            hitToSpecializedCandidate(hit, {
              adapterId: "procurement",
              opportunityType: "PROCUREMENT",
              sourceClass: "TENDERS",
              category: "PROCUREMENT",
              sourceName: (() => {
                const link = hit.link || "";
                if (/zakupki\.gov\.ru/i.test(link)) {
                  return "ЕИС Закупки (Serper discovery)";
                }
                try {
                  return `Закупки · зеркало (${new URL(link).hostname})`;
                } catch {
                  return "Закупки · зеркало (Serper discovery)";
                }
              })(),
              idKind: "procurement",
            }),
          ),
        );
    } catch (error) {
      serperErrors.push(
        error instanceof Error ? error.message : "serper_site_error",
      );
    }

    const merged = mergeCandidatePool([
      ...officialCandidates,
      ...serperCandidates,
    ]).slice(0, this.budgets.maxResultsPerRun);

    if (!merged.length) {
      // Last-resort structured fixtures so Owner still sees schema (marked FIXTURE)
      try {
        const fixtures = await procurementOfficialProvider.search({
          rawQuery: q.rawQuery,
          limit: this.budgets.maxResultsPerRun,
          allowLive: false,
          useFixtures: true,
        });
        const candidates = fixtures.objects.map((o) =>
          officialObjectToCandidate(o, {
            adapterId: "procurement",
            opportunityType: "PROCUREMENT",
            sourceClass: "TENDERS",
            category: "PROCUREMENT",
          }),
        );
        return {
          adapterId: "procurement",
          label: this.label,
          health: "DEGRADED",
          durationMs: Date.now() - started,
          rawCount: candidates.length,
          normalizedCount: candidates.length,
          candidates,
          error:
            officialError ||
            serperErrors[0] ||
            "official API unavailable; fixture fallback",
          official: true,
          transport: "fixture",
        };
      } catch {
        return {
          adapterId: "procurement",
          label: this.label,
          health: "UNAVAILABLE",
          durationMs: Date.now() - started,
          rawCount: 0,
          normalizedCount: 0,
          candidates: [],
          error: officialError || serperErrors[0] || "procurement unavailable",
          official: true,
          transport: "serper_site",
        };
      }
    }

    const transport =
      officialCandidates.some((c) => c.dataChannel === "OFFICIAL_API") &&
      officialTransport === "http_api"
        ? "http_api"
        : serperCandidates.length
          ? "serper_site"
          : "fixture";

    return {
      adapterId: "procurement",
      label: this.label,
      health:
        officialError && !serperCandidates.length
          ? "DEGRADED"
          : serperErrors.length
            ? "DEGRADED"
            : "OK",
      durationMs: Date.now() - started,
      rawCount: officialCandidates.length + serperCandidates.length,
      normalizedCount: merged.length,
      candidates: merged,
      error: officialError || serperErrors[0] || null,
      official: true,
      transport,
    };
  },
};

/** @deprecated retained for tests that import fixture builder shape */
export function buildProcurementFixtureCandidate(
  row: Record<string, unknown>,
): LiaOiCandidate {
  return buildSpecializedCandidate({
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
  });
}
