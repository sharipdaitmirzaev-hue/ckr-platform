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

export type WebSearchOptions = {
  limit?: number;
  region?: string;
  category?: string;
  /** Контекст проекта — не отправлять приватные документы. */
  projectTitle?: string;
};

/** Внешний поиск через абстракцию (не привязан к одному сервису). */
export type WebSearchProvider = SearchProvider & {
  kind: "external";
  search: (
    query: string,
    options?: WebSearchOptions,
  ) => Promise<ExternalSearchResult[]>;
};

export type SearchBundle = {
  projects: InternalMatch[];
  opportunities: InternalMatch[];
  investments: InternalMatch[];
  experts: InternalMatch[];
  external: ExternalSearchResult[];
  searchQueries: string[];
  externalProvider: string;
};

export type WebSearchProviderName = "mock" | "web_api" | "custom";

export type WebSearchEngine = "serper" | "brave" | "tavily" | "generic";
