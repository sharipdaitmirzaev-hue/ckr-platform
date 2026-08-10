import { LiveInternetSearchProvider } from "@/lib/lia/oi/internet/live";
import { StubInternetSearchProvider } from "@/lib/lia/oi/internet/stub";
import type { InternetSearchProvider } from "@/lib/lia/oi/internet/types";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";
import { getWebSearchProvider } from "@/lib/lia/search/web-provider";

export { StubInternetSearchProvider } from "@/lib/lia/oi/internet/stub";
export { LiveInternetSearchProvider, mapExternalResultToHit } from "@/lib/lia/oi/internet/live";
export type {
  InternetSearchHit,
  InternetSearchOptions,
  InternetSearchProvider,
} from "@/lib/lia/oi/internet/types";

/**
 * Фабрика OI internet provider.
 * LIVE только при web_api + API key; иначе STUB.
 * MockWebSearchProvider никогда не используется как LIVE.
 */
export function getInternetSearchProvider(): InternetSearchProvider {
  const mode = resolveOiSearchMode();
  if (mode.mode !== "live") {
    return new StubInternetSearchProvider();
  }

  const web = getWebSearchProvider();
  // Защита: если фабрика внезапно вернула mock — не выдаём за live.
  if (web.id === "web-mock") {
    return new StubInternetSearchProvider();
  }

  const engineLabel =
    mode.engine === "serper"
      ? "Serper"
      : mode.engine.charAt(0).toUpperCase() + mode.engine.slice(1);

  return new LiveInternetSearchProvider(web, engineLabel);
}
