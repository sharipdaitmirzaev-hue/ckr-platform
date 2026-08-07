import { isByteString, toByteStringSafe } from "../http/byte-string";

/**
 * Сессия в cookies только с JWT (tokens-only) + base64url.
 *
 * Почему: по умолчанию @supabase/ssr кладёт весь user object
 * (включая user_metadata.full_name с кириллицей) в auth-cookie.
 * Если значение когда-либо попадает в Headers/Set-Cookie как raw Unicode,
 * undici бросает TypeError ByteString и ломает signUp / analytics / middleware.
 */
export const SUPABASE_COOKIE_ENCODING = "base64url" as const;
export const SUPABASE_COOKIE_ENCODE = "tokens-only" as const;

export type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/** Готовит cookie value к Set-Cookie (строго ByteString). */
export function sanitizeCookieValue(name: string, value: string): string {
  if (isByteString(value)) return value;
  console.warn(
    `[supabase] non-ByteString cookie value for "${name}" — percent-encoding`,
  );
  return toByteStringSafe(value);
}

/**
 * Отбрасывает auth-cookie chunks с «сырой» кириллицей (legacy raw encoding),
 * чтобы они не попали в Authorization/Set-Cookie повторно.
 */
export function filterReadableAuthCookies(
  cookies: { name: string; value: string }[],
): { name: string; value: string }[] {
  return cookies.filter((cookie) => {
    if (!cookie.name.includes("-auth-token")) return true;
    if (isByteString(cookie.value)) return true;
    console.warn(
      `[supabase] dropping non-ByteString auth cookie "${cookie.name}"`,
    );
    return false;
  });
}
