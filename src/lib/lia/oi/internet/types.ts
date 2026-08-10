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
  /** Когда hit обнаружен OI (ISO). */
  discoveredAt?: string;
  /** true = stub/demo; false = live web. Не смешивать без маркировки. */
  isStub: boolean;
  tags?: string[];
  contactPhone?: string;
  contactEmail?: string;
};

export type InternetSearchOptions = {
  limit?: number;
  region?: string;
  budgetMax?: number | null;
};

/**
 * Абстракция интернет-поиска для OI.
 * Stage 1/2A: StubInternetSearchProvider | LiveInternetSearchProvider (WebSearchProvider).
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
