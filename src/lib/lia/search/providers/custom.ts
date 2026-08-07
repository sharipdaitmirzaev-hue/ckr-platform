import { normalizeExternalResults } from "@/lib/lia/search/normalize";
import type { WebSearchOptions, WebSearchProvider } from "@/lib/lia/search/types";
import type { ExternalSearchResult } from "@/types/lia";

type CustomConfig = {
  apiKey?: string;
  baseUrl: string;
  /** GET или POST */
  method?: "GET" | "POST";
};

/**
 * Custom provider: любой совместимый HTTP endpoint.
 * Ожидаемый JSON: { results: [{ title, url, description, source?, published_at? }] }
 */
export class CustomWebSearchProvider implements WebSearchProvider {
  id = "web-custom";
  label = "Custom Search Provider";
  kind = "external" as const;

  constructor(private readonly config: CustomConfig) {}

  async search(
    query: string,
    options?: WebSearchOptions,
  ): Promise<ExternalSearchResult[]> {
    const limit = options?.limit ?? 5;
    const q = query.trim();
    if (!q) return [];

    const method = this.config.method || "POST";
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
      headers["X-API-KEY"] = this.config.apiKey;
    }

    let response: Response;
    if (method === "GET") {
      const url = new URL(this.config.baseUrl);
      url.searchParams.set("q", q);
      url.searchParams.set("query", q);
      url.searchParams.set("limit", String(limit));
      response = await fetch(url.toString(), {
        method: "GET",
        headers,
        cache: "no-store",
      });
    } else {
      response = await fetch(this.config.baseUrl, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: q,
          q,
          limit,
          region: options?.region,
          category: options?.category,
        }),
        cache: "no-store",
      });
    }

    if (!response.ok) {
      throw new Error(`Custom search HTTP ${response.status}`);
    }

    const json = (await response.json()) as {
      results?: Record<string, unknown>[];
      items?: Record<string, unknown>[];
      data?: Record<string, unknown>[];
    };

    const rows = json.results || json.items || json.data || [];
    return normalizeExternalResults(
      rows.map((item) => ({ ...(item as object), query: q })),
      { query: q, source: "custom", trustScore: 0.35 },
    ).slice(0, limit);
  }
}
