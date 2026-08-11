/**
 * Legal site-restricted discovery via existing Serper WebSearchProvider.
 * This is NOT HTML scraping and NOT the general Serper discovery path.
 */

import { getWebSearchProvider } from "@/lib/lia/search/web-provider";
import type { ExternalSearchResult } from "@/types/lia";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";

export async function searchOfficialSites(options: {
  queries: string[];
  sites: string[];
  limitPerQuery: number;
  timeoutMs: number;
}): Promise<{ results: ExternalSearchResult[]; errors: string[]; transportOk: boolean }> {
  const mode = resolveOiSearchMode();
  if (mode.mode !== "live" || !mode.liveAvailable) {
    return { results: [], errors: ["live search unavailable"], transportOk: false };
  }

  const web = getWebSearchProvider();
  if (web.id === "web-mock") {
    return { results: [], errors: ["web provider is mock"], transportOk: false };
  }

  const results: ExternalSearchResult[] = [];
  const errors: string[] = [];

  for (const q of options.queries) {
    const siteClauses = options.sites.map((s) => `site:${s}`).join(" OR ");
    const query = `${q} (${siteClauses})`;
    try {
      const chunk = await Promise.race([
        web.search(query, {
          limit: options.limitPerQuery,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`timeout ${options.timeoutMs}ms`)),
            options.timeoutMs,
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
