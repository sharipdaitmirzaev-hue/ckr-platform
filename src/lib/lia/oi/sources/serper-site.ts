/**
 * Legal site-restricted discovery via existing Serper WebSearchProvider.
 * This is NOT HTML scraping and NOT the general Serper discovery path.
 */

import { getWebSearchProvider } from "@/lib/lia/search/web-provider";
import type { ExternalSearchResult } from "@/types/lia";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";
import {
  canConsumeDiscovery,
  getActiveOwnIdeaBudget,
  noteActiveExternalHttp,
  requestTimeoutMs,
  shouldStopDiscoveryForReserve,
} from "@/lib/ckr-own-ideas/run-budget";

export async function searchOfficialSites(options: {
  queries: string[];
  sites: string[];
  limitPerQuery: number;
  timeoutMs: number;
  /** Tests: inject one HTTP-equivalent search without a new provider. */
  searchFn?: (query: string, limit: number) => Promise<ExternalSearchResult[]>;
}): Promise<{ results: ExternalSearchResult[]; errors: string[]; transportOk: boolean }> {
  const mode = resolveOiSearchMode();
  const injected = Boolean(options.searchFn);
  if (!injected && (mode.mode !== "live" || !mode.liveAvailable)) {
    return { results: [], errors: ["live search unavailable"], transportOk: false };
  }

  const web = injected ? null : getWebSearchProvider();
  if (!injected && web?.id === "web-mock") {
    return { results: [], errors: ["web provider is mock"], transportOk: false };
  }

  const results: ExternalSearchResult[] = [];
  const errors: string[] = [];

  for (const q of options.queries) {
    const ownBudget = getActiveOwnIdeaBudget();
    if (ownBudget) {
      if (shouldStopDiscoveryForReserve(ownBudget) || !canConsumeDiscovery(ownBudget)) {
        ownBudget.discoveryStoppedForResolutionReserve = true;
        break;
      }
      if (!noteActiveExternalHttp("discovery")) {
        ownBudget.discoveryStoppedForResolutionReserve = true;
        break;
      }
    }
    const siteClauses = options.sites.map((s) => `site:${s}`).join(" OR ");
    const query = `${q} (${siteClauses})`;
    const perRequestTimeout = ownBudget
      ? requestTimeoutMs(ownBudget, options.timeoutMs, "discovery")
      : options.timeoutMs;
    try {
      const searchCall = options.searchFn
        ? options.searchFn(query, options.limitPerQuery)
        : web!.search(query, {
            limit: options.limitPerQuery,
          });
      const chunk = await Promise.race([
        searchCall,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`timeout ${perRequestTimeout}ms`)),
            perRequestTimeout,
          ),
        ),
      ]);
      const filtered = chunk.filter((r) => {
        try {
          const host = new URL(r.url).hostname.replace(/^www\./, "");
          return options.sites.some(
            (s) => host === s || host.endsWith(`.${s}`),
          );
        } catch {
          return false;
        }
      });
      results.push(...filtered);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  return {
    results,
    errors,
    transportOk: results.length > 0 || errors.length === 0,
  };
}
