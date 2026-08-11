/**
 * Auction / bankruptcy / government asset lots.
 * Transport: fixture (stub) or legal Serper site-restricted discovery (live).
 * Direct torgi/fedresurs REST requires registration — not wired without credentials.
 */

import auctionFixtures from "@/lib/lia/oi/sources/fixtures/auction.json";
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

function fromFixtures(q: LiaOiSourceAdapterQuery): LiaOiSourceAdapterResult {
  const started = Date.now();
  const budget = q.plan.budgetMax;
  const rows = (auctionFixtures as Array<Record<string, unknown>>).filter(
    (row) => {
      const price = Number(row.startPrice ?? row.currentPrice ?? 0);
      if (budget != null && price > 0 && price > budget) return false;
      return true;
    },
  );
  const candidates = rows.map((row) =>
    buildSpecializedCandidate({
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
      city: null,
      askingPrice: (row.currentPrice as number) ?? (row.startPrice as number),
      assetType: (row.assetType as string) || null,
      objectId: String(row.lotId),
      deadlineRaw: (row.deadline as string) || null,
      isStub: true,
      extraClaims: [
        {
          field: "lotId",
          value: String(row.lotId),
          kind: "FACT",
          sourceName: "fixture",
          sourceUrl: String(row.url),
        },
        {
          field: "organizer",
          value: String(row.organizer || ""),
          kind: "FACT",
          sourceName: "fixture",
          sourceUrl: String(row.url),
        },
      ],
      whyInteresting: [
        "Официальный источник торгов/активов",
        row.organizer ? `Организатор: ${row.organizer}` : "Лот на торгах",
      ],
    }),
  );
  return {
    adapterId: "auction_assets",
    label: "Торги / активы",
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
    return "OK";
  },
  async search(q) {
    if (q.mode !== "live") return fromFixtures(q);

    const started = Date.now();
    const keywords = q.rawQuery
      .replace(/найди|найти|пожалуйста/gi, "")
      .trim()
      .slice(0, 120);
    const queries = [
      `${keywords} лот торги`,
      `имущественный комплекс ${q.plan.budgetMax ? `до ${Math.round(q.plan.budgetMax / 1e6)} млн` : ""}`.trim(),
      `производственные активы торги Россия`,
    ].slice(0, this.budgets.maxRequestsPerRun);

    const { results, errors } = await searchOfficialSites({
      queries,
      sites: SITES,
      limitPerQuery: 5,
      timeoutMs: this.budgets.timeoutMs,
    });

    if (!results.length) {
      // Soft degrade: fixtures marked stub so owner sees structure without claiming live
      const fallback = fromFixtures(q);
      return {
        ...fallback,
        health: errors.length ? "DEGRADED" : "UNAVAILABLE",
        error: errors[0] || "no live results from official domains",
        durationMs: Date.now() - started,
      };
    }

    const candidates = results
      .slice(0, this.budgets.maxResultsPerRun)
      .map((hit) =>
        hitToSpecializedCandidate(hit, {
          adapterId: "auction_assets",
          opportunityType: "AUCTION_ASSET",
          sourceClass: "AUCTIONS_ASSETS",
          category: "AUCTIONS",
          sourceName: "ГИС Торги / ЕФРСБ",
          idKind: "lot",
        }),
      );

    return {
      adapterId: "auction_assets",
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
