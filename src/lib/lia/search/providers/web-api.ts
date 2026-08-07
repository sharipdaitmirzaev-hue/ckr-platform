import { normalizeExternalResults } from "@/lib/lia/search/normalize";
import type {
  WebSearchEngine,
  WebSearchOptions,
  WebSearchProvider,
} from "@/lib/lia/search/types";
import type { ExternalSearchResult } from "@/types/lia";

type WebApiConfig = {
  apiKey: string;
  baseUrl?: string;
  engine: WebSearchEngine;
};

/**
 * Адаптер к распространённым Web Search API.
 * Не привязан к одному вендору: serper | brave | tavily | generic.
 */
export class WebApiSearchProvider implements WebSearchProvider {
  id = "web-api";
  label = "Web Search API";
  kind = "external" as const;

  constructor(private readonly config: WebApiConfig) {}

  async search(
    query: string,
    options?: WebSearchOptions,
  ): Promise<ExternalSearchResult[]> {
    const limit = options?.limit ?? 5;
    const q = query.trim();
    if (!q) return [];

    switch (this.config.engine) {
      case "serper":
        return this.searchSerper(q, limit);
      case "brave":
        return this.searchBrave(q, limit);
      case "tavily":
        return this.searchTavily(q, limit);
      case "generic":
      default:
        return this.searchGeneric(q, limit);
    }
  }

  private async searchSerper(query: string, limit: number) {
    const base =
      this.config.baseUrl?.replace(/\/$/, "") || "https://google.serper.dev";
    const response = await fetch(`${base}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": this.config.apiKey,
      },
      body: JSON.stringify({ q: query, num: limit }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Serper HTTP ${response.status}`);
    }

    const json = (await response.json()) as {
      organic?: {
        title?: string;
        link?: string;
        snippet?: string;
        date?: string;
      }[];
    };

    return normalizeExternalResults(
      (json.organic ?? []).map((item, index) => ({
        title: item.title,
        url: item.link,
        description: item.snippet,
        published_at: item.date,
        source: "serper",
        trust_score: Math.max(0.25, 0.55 - index * 0.04),
        query,
      })),
      { query, source: "serper", trustScore: 0.4 },
    ).slice(0, limit);
  }

  private async searchBrave(query: string, limit: number) {
    const base =
      this.config.baseUrl?.replace(/\/$/, "") ||
      "https://api.search.brave.com/res/v1/web/search";
    const url = new URL(base);
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(limit));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": this.config.apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Brave HTTP ${response.status}`);
    }

    const json = (await response.json()) as {
      web?: {
        results?: {
          title?: string;
          url?: string;
          description?: string;
          age?: string;
          meta_url?: { hostname?: string };
        }[];
      };
    };

    return normalizeExternalResults(
      (json.web?.results ?? []).map((item, index) => ({
        title: item.title,
        url: item.url,
        description: item.description,
        published_at: item.age,
        source: item.meta_url?.hostname || "brave",
        trust_score: Math.max(0.25, 0.55 - index * 0.04),
        query,
      })),
      { query, source: "brave", trustScore: 0.4 },
    ).slice(0, limit);
  }

  private async searchTavily(query: string, limit: number) {
    const base =
      this.config.baseUrl?.replace(/\/$/, "") || "https://api.tavily.com/search";
    const response = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: this.config.apiKey,
        query,
        max_results: limit,
        include_answer: false,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Tavily HTTP ${response.status}`);
    }

    const json = (await response.json()) as {
      results?: {
        title?: string;
        url?: string;
        content?: string;
        score?: number;
        published_date?: string;
      }[];
    };

    return normalizeExternalResults(
      (json.results ?? []).map((item) => ({
        title: item.title,
        url: item.url,
        description: item.content,
        published_at: item.published_date,
        source: "tavily",
        trust_score: item.score,
        query,
      })),
      { query, source: "tavily", trustScore: 0.4 },
    ).slice(0, limit);
  }

  private async searchGeneric(query: string, limit: number) {
    const base = this.config.baseUrl?.replace(/\/$/, "");
    if (!base) {
      throw new Error("LIA_WEB_SEARCH_BASE_URL обязателен для engine=generic");
    }

    const response = await fetch(base, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ query, limit, q: query, num: limit }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Web Search API HTTP ${response.status}`);
    }

    const json = (await response.json()) as {
      results?: Record<string, unknown>[];
      organic?: Record<string, unknown>[];
      data?: Record<string, unknown>[];
    };

    const rows = json.results || json.organic || json.data || [];
    return normalizeExternalResults(
      rows.map((item) => ({
        ...(item as object),
        query,
      })),
      { query, source: "web_api", trustScore: 0.4 },
    ).slice(0, limit);
  }
}
