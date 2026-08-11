/**
 * Auction / bankruptcy / government asset lots.
 * Stage 2C.3: FedresursOfficialProvider (REST fixtures without credentials) → primary;
 * Serper site discovery (torgi/fedresurs) → fallback. Soft-fail if API unavailable.
 */

import {
  fedresursOfficialProvider,
  mergeCandidatePool,
  officialObjectToCandidate,
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

const SITES = ["torgi.gov.ru", "bankrot.fedresurs.ru"];

function matchQuery(q: LiaOiSourceAdapterQuery): boolean {
  const text = `${q.rawQuery} ${(q.plan.sourceClasses || []).join(" ")} ${q.plan.intent}`.toLowerCase();
  return (
    q.plan.intent === "assets" ||
    (q.plan.sourceClasses || []).includes("AUCTIONS_ASSETS") ||
    (q.plan.sourceClasses || []).includes("PRODUCTION_ASSETS") ||
    /торг|аукцион|банкрот|имущественн|актив|лот|росимуществ|федресурс|torgi/.test(
      text,
    )
  );
}

function tagSerper(c: LiaOiCandidate): LiaOiCandidate {
  return {
    ...c,
    dataChannel: "SERPER_DISCOVERY",
    officialApiProvider: "fedresurs",
    officialApiStatus: fedresursOfficialProvider.getConnectionStatus(),
    sourceConfidence: c.sourceConfidence ?? 82,
  };
}

export const auctionSourceAdapter: OpportunitySourceAdapter = {
  id: "auction_assets",
  label: "Торги / активы",
  category: "AUCTIONS",
  sourceClass: "AUCTIONS_ASSETS",
  opportunityType: "AUCTION_ASSET",
  official: true,
  budgets: {
    maxRequestsPerRun: 3,
    timeoutMs: 12_000,
    maxRetries: 1,
    maxResultsPerRun: 12,
  },
  matches: matchQuery,
  async healthcheck() {
    try {
      fedresursOfficialProvider.getConnectionStatus();
      return "OK";
    } catch {
      return "UNAVAILABLE";
    }
  },
  async search(q) {
    const started = Date.now();
    const connectionStatus = fedresursOfficialProvider.getConnectionStatus();
    let officialCandidates: LiaOiCandidate[] = [];
    let officialTransport: "fixture" | "http_api" | "serper_site" = "fixture";
    let officialError: string | null = null;

    const wantOfficialPrimary =
      q.mode !== "live" || connectionStatus === "CONNECTED";
    if (wantOfficialPrimary) {
      try {
        const official = await fedresursOfficialProvider.search({
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
            const price = o.currentPrice ?? o.startingPrice ?? 0;
            if (budget != null && price > 0 && price > budget) return false;
            return true;
          })
          .map((o) =>
            officialObjectToCandidate(o, {
              adapterId: "auction_assets",
              opportunityType: "AUCTION_ASSET",
              sourceClass: "AUCTIONS_ASSETS",
              category: "AUCTIONS",
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
          error instanceof Error ? error.message : "fedresurs_provider_error";
      }
    }

    if (q.mode !== "live") {
      return {
        adapterId: "auction_assets",
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

    const keywords = q.rawQuery
      .replace(/найди|найти|пожалуйста/gi, "")
      .trim()
      .slice(0, 120);
    const queries = [
      `${keywords} лот торги`,
      `имущественный комплекс ${q.plan.budgetMax ? `до ${Math.round(q.plan.budgetMax / 1e6)} млн` : ""}`.trim(),
      `производственные активы торги Россия`,
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
              adapterId: "auction_assets",
              opportunityType: "AUCTION_ASSET",
              sourceClass: "AUCTIONS_ASSETS",
              category: "AUCTIONS",
              sourceName: "ГИС Торги / ЕФРСБ (Serper discovery)",
              idKind: "lot",
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
      try {
        const fixtures = await fedresursOfficialProvider.search({
          rawQuery: q.rawQuery,
          limit: this.budgets.maxResultsPerRun,
          allowLive: false,
          useFixtures: true,
        });
        const candidates = fixtures.objects.map((o) =>
          officialObjectToCandidate(o, {
            adapterId: "auction_assets",
            opportunityType: "AUCTION_ASSET",
            sourceClass: "AUCTIONS_ASSETS",
            category: "AUCTIONS",
          }),
        );
        return {
          adapterId: "auction_assets",
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
          adapterId: "auction_assets",
          label: this.label,
          health: "UNAVAILABLE",
          durationMs: Date.now() - started,
          rawCount: 0,
          normalizedCount: 0,
          candidates: [],
          error: officialError || serperErrors[0] || "auction unavailable",
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
      adapterId: "auction_assets",
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

export function buildAuctionFixtureCandidate(
  row: Record<string, unknown>,
): LiaOiCandidate {
  return buildSpecializedCandidate({
    adapterId: "auction_assets",
    opportunityType: "AUCTION_ASSET",
    sourceClass: "AUCTIONS_ASSETS",
    category: "AUCTIONS",
    sourceName: "ГИС Торги / ЕФРСБ (fixture)",
    official: true,
    sourceConfidence: 88,
    title: String(row.title),
    description: String(row.description),
    url: String(row.url),
    region: (row.region as string) || null,
    askingPrice: (row.currentPrice as number) ?? (row.startPrice as number),
    assetType: (row.assetType as string) || null,
    objectId: String(row.lotId),
    deadlineRaw: (row.deadline as string) || null,
    isStub: true,
  });
}
