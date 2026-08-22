/**
 * Выбор режима внешнего поиска для LIA OI (STUB | LIVE).
 *
 * LIA_OI_SEARCH_MODE=stub|live|auto (default: auto)
 * LIVE доступен только при LIA_WEB_SEARCH_PROVIDER=web_api + API key.
 * MockWebSearchProvider никогда не считается LIVE для OI.
 */

export type LiaOiExternalMode = "stub" | "live";

export type LiaOiModeInfo = {
  mode: LiaOiExternalMode;
  reason: string;
  providerEnv: string;
  engine: string;
  liveAvailable: boolean;
  /** Человекочитаемая строка для UI-баннера. */
  bannerTitle: string;
  bannerBody: string;
  providerLabel: string;
};

function readProviderEnv(): string {
  return (process.env.LIA_WEB_SEARCH_PROVIDER || "mock").toLowerCase();
}

function readEngine(): string {
  return (process.env.LIA_WEB_SEARCH_ENGINE || "serper").toLowerCase();
}

function hasApiKey(): boolean {
  return Boolean(process.env.LIA_WEB_SEARCH_API_KEY?.trim());
}

function isWebApiProvider(name: string): boolean {
  return name === "web_api" || name === "web-api" || name === "api";
}

/** Можно ли реально ходить во внешний search API (не mock). */
export function isOiLiveConfigured(): boolean {
  return isWebApiProvider(readProviderEnv()) && hasApiKey();
}

export function resolveOiSearchMode(): LiaOiModeInfo {
  const providerEnv = readProviderEnv();
  const engine = readEngine();
  const liveAvailable = isOiLiveConfigured();
  const forced = (process.env.LIA_OI_SEARCH_MODE || "auto").toLowerCase();

  if (forced === "stub") {
    return {
      mode: "stub",
      reason: "LIA_OI_SEARCH_MODE=stub",
      providerEnv,
      engine,
      liveAvailable,
      bannerTitle: "Внешний поиск: DEMO/STUB",
      bannerBody:
        "Режим stub принудительно. Результаты не из живого интернета.",
      providerLabel: "StubInternetSearchProvider",
    };
  }

  if (forced === "live") {
    if (!liveAvailable) {
      return {
        mode: "stub",
        reason:
          "LIA_OI_SEARCH_MODE=live, но нет web_api + API key — fallback STUB",
        providerEnv,
        engine,
        liveAvailable: false,
        bannerTitle: "Внешний поиск: DEMO/STUB",
        bannerBody:
          "LIVE запрошен, но ключ Serper / web_api не настроен. Используется stub. Добавьте LIA_WEB_SEARCH_PROVIDER=web_api и LIA_WEB_SEARCH_API_KEY.",
        providerLabel: "StubInternetSearchProvider (fallback)",
      };
    }
    return liveInfo(providerEnv, engine, "LIA_OI_SEARCH_MODE=live");
  }

  // auto
  if (liveAvailable) {
    return liveInfo(providerEnv, engine, "auto: web_api + API key");
  }

  return {
    mode: "stub",
    reason: "auto: нет web_api + API key",
    providerEnv,
    engine,
    liveAvailable: false,
    bannerTitle: "Внешний поиск: DEMO/STUB",
    bannerBody:
      "Внешний поиск работает в demo/stub режиме. Результаты не являются живыми данными из интернета. Для LIVE задайте LIA_WEB_SEARCH_PROVIDER=web_api и LIA_WEB_SEARCH_API_KEY.",
    providerLabel: "StubInternetSearchProvider",
  };
}

function liveInfo(
  providerEnv: string,
  engine: string,
  reason: string,
): LiaOiModeInfo {
  const engineLabel =
    engine === "serper"
      ? "Serper"
      : engine === "brave"
        ? "Brave"
        : engine === "tavily"
          ? "Tavily"
          : engine;
  return {
    mode: "live",
    reason,
    providerEnv,
    engine,
    liveAvailable: true,
    bannerTitle: `Внешний поиск: LIVE — ${engineLabel}`,
    bannerBody:
      "Результаты из реального интернет-поиска. Каждый hit помечен как live; stub-корпус не смешивается. Проверяйте первоисточник перед решениями.",
    providerLabel: `WebSearchProvider (${engineLabel})`,
  };
}

/** Безопасное логирование ошибок провайдера — без API key и без секретов. */
export function safeProviderErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "unknown_error";
  let msg = error.message || "error";
  const key = process.env.LIA_WEB_SEARCH_API_KEY?.trim();
  if (key && msg.includes(key)) {
    msg = msg.split(key).join("[REDACTED]");
  }
  // не отдаём сырые body/HTML
  return msg.slice(0, 200);
}
