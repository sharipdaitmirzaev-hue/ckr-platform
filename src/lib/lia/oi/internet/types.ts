import type { LiaOiSourceCategory } from "@/types/lia-oi";

/** Сырой hit от InternetSearchProvider (ещё до OpportunityCandidate). */
export type InternetSearchHit = {
  id: string;
  title: string;
  snippet: string;
  url: string;
  sourceName: string;
  sourceCategory: LiaOiSourceCategory;
  region?: string;
  city?: string;
  industry?: string;
  askingPrice?: number | null;
  investmentRequired?: number | null;
  publishedAt?: string;
  /** Всегда true для Stub — UI не должен выдавать за live. */
  isStub: true;
  tags?: string[];
};

export type InternetSearchOptions = {
  limit?: number;
  region?: string;
  budgetMax?: number | null;
};

/**
 * Абстракция интернет-поиска для OI.
 * Этап 1: только StubInternetSearchProvider.
 * Этап 2: адаптер над существующим WebSearchProvider (Serper и др.).
 */
export type InternetSearchProvider = {
  id: string;
  label: string;
  mode: "stub" | "live";
  search: (
    query: string,
    options?: InternetSearchOptions,
  ) => Promise<InternetSearchHit[]>;
};
