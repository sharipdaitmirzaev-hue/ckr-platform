/**
 * Stage 2C adapter registry + fan-out runner with failure isolation.
 */

import { auctionSourceAdapter } from "@/lib/lia/oi/sources/adapters/auction";
import { procurementSourceAdapter } from "@/lib/lia/oi/sources/adapters/procurement";
import { supportProgramSourceAdapter } from "@/lib/lia/oi/sources/adapters/support";
import type {
  LiaOiAdapterRunStat,
  LiaOiSourceAdapterQuery,
  LiaOiSourceAdapterResult,
  LiaOiSourceHealthStatus,
  OpportunitySourceAdapter,
} from "@/lib/lia/oi/sources/types";
import type { LiaOiCandidate } from "@/types/lia-oi";

const ADAPTERS: OpportunitySourceAdapter[] = [
  auctionSourceAdapter,
  procurementSourceAdapter,
  supportProgramSourceAdapter,
];

export function listSourceAdapters(): OpportunitySourceAdapter[] {
  return [...ADAPTERS];
}

export function getSourceAdapter(id: string): OpportunitySourceAdapter | null {
  return ADAPTERS.find((a) => a.id === id) ?? null;
}

export async function getSourceHealthSnapshot(): Promise<
  Array<{
    id: string;
    label: string;
    official: boolean;
    health: LiaOiSourceHealthStatus;
    category: string;
  }>
> {
  const out = [];
  for (const a of ADAPTERS) {
    let health: LiaOiSourceHealthStatus = "OK";
    try {
      health = await a.healthcheck();
    } catch {
      health = "UNAVAILABLE";
    }
    out.push({
      id: a.id,
      label: a.label,
      official: a.official,
      health,
      category: a.category,
    });
  }
  return out;
}

export async function runMatchingSourceAdapters(
  query: LiaOiSourceAdapterQuery,
): Promise<{
  results: LiaOiSourceAdapterResult[];
  candidates: LiaOiCandidate[];
  stats: LiaOiAdapterRunStat[];
}> {
  const selected = ADAPTERS.filter((a) => a.matches(query));
  const results: LiaOiSourceAdapterResult[] = [];

  // Sequential with isolation — one failure must not break others
  for (const adapter of selected) {
    const started = Date.now();
    try {
      const result = await adapter.search(query);
      results.push(result);
    } catch (error) {
      results.push({
        adapterId: adapter.id,
        label: adapter.label,
        health: "UNAVAILABLE",
        durationMs: Date.now() - started,
        rawCount: 0,
        normalizedCount: 0,
        candidates: [],
        error: error instanceof Error ? error.message : String(error),
        official: adapter.official,
        transport: "fixture",
      });
    }
  }

  const candidates = results.flatMap((r) => r.candidates);
  const stats: LiaOiAdapterRunStat[] = results.map((r) => ({
    adapterId: r.adapterId,
    label: r.label,
    health: r.health,
    durationMs: r.durationMs,
    rawCount: r.rawCount,
    normalizedCount: r.normalizedCount,
    error: r.error,
    official: r.official,
    transport: r.transport,
  }));

  return { results, candidates, stats };
}

export const LIA_OI_SOURCE_FILTER_OPTIONS = [
  { id: "serper_general", label: "Serper" },
  { id: "auction_assets", label: "Торги" },
  { id: "procurement", label: "Закупки" },
  { id: "support_programs", label: "Господдержка" },
] as const;

export const LIA_OI_OPPORTUNITY_TYPE_LABELS: Record<string, string> = {
  WEB_LISTING: "Веб-объявление",
  AUCTION_ASSET: "Актив на торгах",
  PROCUREMENT: "Закупка / тендер",
  SUPPORT_PROGRAM: "Господдержка",
  GOVERNMENT_ASSET: "Госимущество",
  REGIONAL_INVESTMENT: "Региональный инвестпроект",
  OTHER: "Другое",
};
