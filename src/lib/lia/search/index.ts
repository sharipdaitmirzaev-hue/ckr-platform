import { internalSearchProvider } from "@/lib/lia/search/internal-provider";
import { getWebSearchProvider } from "@/lib/lia/search/web-provider";
import type { SearchBundle } from "@/lib/lia/search/types";

export type {
  SearchProvider,
  InternalSearchProvider,
  WebSearchProvider,
  SearchBundle,
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
  MockWebSearchProvider,
  webSearchProvider,
} from "@/lib/lia/search/web-provider";

/** Комплексный поиск: внутренние каталоги ЦКР + внешний mock. */
export async function searchSolutionsBundle(
  query: string,
  options?: {
    region?: string;
    category?: string;
    internalLimit?: number;
    externalLimit?: number;
    includeExternal?: boolean;
  },
): Promise<SearchBundle> {
  const internalLimit = options?.internalLimit ?? 3;
  const externalLimit = options?.externalLimit ?? 5;
  const includeExternal = options?.includeExternal !== false;
  const web = getWebSearchProvider();

  const [projects, opportunities, investments, experts, external] =
    await Promise.all([
      internalSearchProvider.searchProjects(query, internalLimit),
      internalSearchProvider.searchOpportunities(query, internalLimit),
      internalSearchProvider.searchInvestments(query, internalLimit),
      internalSearchProvider.searchExperts(query, internalLimit),
      includeExternal
        ? web.search(query, {
            limit: externalLimit,
            region: options?.region,
            category: options?.category,
          })
        : Promise.resolve([]),
    ]);

  return { projects, opportunities, investments, experts, external };
}
