import { siteConfig } from "@/config/site";

const DEFAULT_NEXT = "/dashboard";
const PRODUCTION_ORIGIN = "https://ckr-center.ru";

function isLocalhostUrl(value: string): boolean {
  return (
    /localhost/i.test(value) ||
    /127\.0\.0\.1/.test(value) ||
    /\[::1\]/.test(value)
  );
}

/** Канонический origin сайта (production: https://ckr-center.ru). */
export function getSiteOrigin(): string {
  const origin = siteConfig.url.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production" && isLocalhostUrl(origin)) {
    console.error(
      "[auth/redirects] origin был localhost в production — принудительно",
      PRODUCTION_ORIGIN,
    );
    return PRODUCTION_ORIGIN;
  }
  return origin;
}

/** Безопасный относительный путь после auth (только same-origin path). */
export function safeAuthNextPath(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return DEFAULT_NEXT;
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_NEXT;
  if (/localhost|127\.0\.0\.1/i.test(value)) return DEFAULT_NEXT;
  return value;
}

/** Абсолютный URL приложения (никогда localhost в production). */
export function absoluteAppUrl(
  path: string,
  searchParams?: Record<string, string | undefined>,
): string {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(safePath, `${getSiteOrigin()}/`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }
  const href = url.toString();
  if (process.env.NODE_ENV === "production" && isLocalhostUrl(href)) {
    throw new Error(
      "absoluteAppUrl: localhost в production — проверьте NEXT_PUBLIC_SITE_URL",
    );
  }
  return href;
}

/**
 * URL для Supabase emailRedirectTo / redirectTo.
 * Должен быть в allowlist Redirect URLs проекта Supabase.
 */
export function getAuthCallbackUrl(next: string = DEFAULT_NEXT): string {
  return absoluteAppUrl("/auth/callback", { next: safeAuthNextPath(next) });
}

/** Ссылка из письма восстановления пароля → callback → /reset-password. */
export function getPasswordRecoveryUrl(): string {
  return getAuthCallbackUrl("/reset-password");
}

/** Абсолютный URL личного кабинета. */
export function getDashboardUrl(): string {
  return absoluteAppUrl("/dashboard");
}
