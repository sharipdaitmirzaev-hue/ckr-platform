/**
 * Абсолютные URL публичного сайта — только из NEXT_PUBLIC_SITE_URL.
 * Не хардкодить localhost / vercel preview в production-ссылках.
 */

const LOCAL_FALLBACK = "http://localhost:3000";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    // Без домена абсолютные URL собрать нельзя — вернём пустую строку
    // (canonical/sitemap должны задаваться через env).
    return "";
  }
  return LOCAL_FALLBACK;
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized;
  return `${base}${normalized === "/" ? "" : normalized}`;
}

export function isProductionSiteUrlConfigured(): boolean {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  if (!raw) return false;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host.includes("vercel.app") ||
      host.includes("127.0.0.1")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Redirect URL для Supabase Auth (confirmation / reset). */
export function authCallbackUrl(nextPath = "/dashboard"): string {
  const next =
    nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/dashboard";
  return absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`);
}
