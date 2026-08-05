import type { ExternalSearchResult, InternalMatch } from "@/types/lia";

/** Базовый контракт поискового провайдера Лии. */
export type SearchProvider = {
  id: string;
  label: string;
  kind: "internal" | "external";
};

export type InternalSearchProvider = SearchProvider & {
  kind: "internal";
  searchProjects: (query: string, limit?: number) => Promise<InternalMatch[]>;
  searchOpportunities: (
    query: string,
    limit?: number,
  ) => Promise<InternalMatch[]>;
  searchInvestments: (
    query: string,
    limit?: number,
  ) => Promise<InternalMatch[]>;
  searchExperts: (query: string, limit?: number) => Promise<InternalMatch[]>;
};

export type WebSearchProvider = SearchProvider & {
  kind: "external";
  search: (
    query: string,
    options?: { limit?: number; region?: string; category?: string },
  ) => Promise<ExternalSearchResult[]>;
};

export type SearchBundle = {
  projects: InternalMatch[];
  opportunities: InternalMatch[];
  investments: InternalMatch[];
  experts: InternalMatch[];
  external: ExternalSearchResult[];
};
