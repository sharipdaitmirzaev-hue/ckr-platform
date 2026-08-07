import { CustomWebSearchProvider } from "@/lib/lia/search/providers/custom";
import { MockWebSearchProvider } from "@/lib/lia/search/providers/mock-web";
import { WebApiSearchProvider } from "@/lib/lia/search/providers/web-api";
import type {
  WebSearchEngine,
  WebSearchProvider,
  WebSearchProviderName,
} from "@/lib/lia/search/types";

export { MockWebSearchProvider } from "@/lib/lia/search/providers/mock-web";
export { WebApiSearchProvider } from "@/lib/lia/search/providers/web-api";
export { CustomWebSearchProvider } from "@/lib/lia/search/providers/custom";

function readProviderName(): WebSearchProviderName {
  const raw = (process.env.LIA_WEB_SEARCH_PROVIDER || "mock").toLowerCase();
  if (raw === "web_api" || raw === "web-api" || raw === "api") return "web_api";
  if (raw === "custom") return "custom";
  return "mock";
}

function readEngine(): WebSearchEngine {
  const raw = (process.env.LIA_WEB_SEARCH_ENGINE || "serper").toLowerCase();
  if (raw === "brave") return "brave";
  if (raw === "tavily") return "tavily";
  if (raw === "generic") return "generic";
  return "serper";
}

/**
 * Фабрика внешнего провайдера.
 * LIA_WEB_SEARCH_PROVIDER=mock|web_api|custom
 *
 * При ошибке конфигурации или отсутствии ключа — безопасный mock.
 */
export function getWebSearchProvider(): WebSearchProvider {
  const name = readProviderName();
  const apiKey = process.env.LIA_WEB_SEARCH_API_KEY?.trim();
  const baseUrl = process.env.LIA_WEB_SEARCH_BASE_URL?.trim();

  if (name === "mock") {
    return new MockWebSearchProvider();
  }

  if (name === "custom") {
    if (!baseUrl) {
      return new MockWebSearchProvider();
    }
    return new CustomWebSearchProvider({
      apiKey,
      baseUrl,
      method:
        (process.env.LIA_WEB_SEARCH_METHOD || "POST").toUpperCase() === "GET"
          ? "GET"
          : "POST",
    });
  }

  // web_api
  if (!apiKey && readEngine() !== "generic") {
    return new MockWebSearchProvider();
  }
  if (readEngine() === "generic" && !baseUrl) {
    return new MockWebSearchProvider();
  }

  return new WebApiSearchProvider({
    apiKey: apiKey || "",
    baseUrl,
    engine: readEngine(),
  });
}

/** Singleton для простых импортов; для тестов лучше вызывать getWebSearchProvider(). */
export const webSearchProvider = getWebSearchProvider();

export function getWebSearchProviderInfo() {
  const provider = getWebSearchProvider();
  return {
    id: provider.id,
    label: provider.label,
    configured: provider.id !== "web-mock",
    name: readProviderName(),
    engine: readEngine(),
  };
}
