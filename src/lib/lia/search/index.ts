import { internalSearchProvider } from "@/lib/lia/search/internal-provider";
import { getWebSearchProvider } from "@/lib/lia/search/web-provider";
import type { SearchBundle, WebSearchOptions } from "@/lib/lia/search/types";
import type { ExternalSearchResult } from "@/types/lia";

export type {
  SearchProvider,
  InternalSearchProvider,
  WebSearchProvider,
  SearchBundle,
  WebSearchOptions,
  WebSearchProviderName,
  WebSearchEngine,
} from "@/lib/lia/search/types";

export {
  internalSearchProvider,
  CkrInternalSearchProvider,
  searchProjects,
  searchOpportunities,
  searchInvestments,
  searchExperts,
} from "@/lib/lia/search/internal-provider";

export {
  getWebSearchProvider,
  getWebSearchProviderInfo,
  MockWebSearchProvider,
  WebApiSearchProvider,
  CustomWebSearchProvider,
  webSearchProvider,
} from "@/lib/lia/search/web-provider";

export { buildExternalSearchQueries } from "@/lib/lia/search/query-builder";
export {
  normalizeExternalResult,
  normalizeExternalResults,
  coerceExternalResult,
} from "@/lib/lia/search/normalize";

async function searchExternalMulti(
  queries: string[],
  options?: WebSearchOptions & { perQueryLimit?: number; totalLimit?: number },
): Promise<ExternalSearchResult[]> {
  const web = getWebSearchProvider();
  const perQueryLimit = options?.perQueryLimit ?? 3;
  const totalLimit = options?.totalLimit ?? options?.limit ?? 8;

  const batches = await Promise.all(
    queries.map(async (query) => {
      try {
        return await web.search(query, {
          ...options,
          limit: perQueryLimit,
        });
      } catch {
        // Сбой внешнего API не должен ломать анализ — пустой набор по запросу.
        return [] as ExternalSearchResult[];
      }
    }),
  );

  const seen = new Set<string>();
  const merged: ExternalSearchResult[] = [];
  for (const batch of batches) {
    for (const item of batch) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      merged.push({ ...item, trusted: false });
      if (merged.length >= totalLimit) return merged;
    }
  }
  return merged;
}

/** Комплексный поиск: каталоги ЦКР + внешние провайдеры. */
export async function searchSolutionsBundle(
  query: string,
  options?: {
    region?: string;
    category?: string;
    internalLimit?: number;
    externalLimit?: number;
    includeExternal?: boolean;
    externalQueries?: string[];
    projectTitle?: string;
  },
): Promise<SearchBundle> {
  const internalLimit = options?.internalLimit ?? 3;
  const externalLimit = options?.externalLimit ?? 8;
  const includeExternal = options?.includeExternal !== false;
  const web = getWebSearchProvider();
  const externalQueries =
    options?.externalQueries && options.externalQueries.length > 0
      ? options.externalQueries
      : [query];

  const [projects, opportunities, investments, experts, external] =
    await Promise.all([
      internalSearchProvider.searchProjects(query, internalLimit),
      internalSearchProvider.searchOpportunities(query, internalLimit),
      internalSearchProvider.searchInvestments(query, internalLimit),
      internalSearchProvider.searchExperts(query, internalLimit),
      includeExternal
        ? searchExternalMulti(externalQueries, {
            limit: externalLimit,
            totalLimit: externalLimit,
            perQueryLimit: 3,
            region: options?.region,
            category: options?.category,
            projectTitle: options?.projectTitle,
          })
        : Promise.resolve([]),
    ]);

  return {
    projects,
    opportunities,
    investments,
    experts,
    external,
    searchQueries: includeExternal ? externalQueries : [],
    externalProvider: web.id,
  };
}

/** Прямой внешний поиск (для API / отладки). */
export async function runExternalSearch(
  query: string,
  options?: WebSearchOptions,
): Promise<{ provider: string; results: ExternalSearchResult[] }> {
  const web = getWebSearchProvider();
  try {
    const results = await web.search(query, options);
    return {
      provider: web.id,
      results: results.map((item) => ({ ...item, trusted: false })),
    };
  } catch {
    return {
      provider: web.id,
      results: [],
    };
  }
}
