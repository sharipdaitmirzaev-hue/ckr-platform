/**
 * Supabase env helpers.
 * Поддерживаются:
 * - новые ключи: sb_publishable_... / sb_secret_...
 * - legacy JWT: anon / service_role
 *
 * Значения ключей никогда не логируются.
 */

function trimEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Публичный ключ: anon (legacy) или publishable (новый). */
export function getSupabasePublishableKey(): string | undefined {
  return (
    trimEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    trimEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  );
}

/** Серверный ключ: service_role (legacy) или secret (новый). Только server-side. */
export function getSupabaseSecretKey(): string | undefined {
  return (
    trimEnv("SUPABASE_SERVICE_ROLE_KEY") || trimEnv("SUPABASE_SECRET_KEY")
  );
}

export function isNewSupabaseApiKey(key: string): boolean {
  return (
    key.startsWith("sb_publishable_") || key.startsWith("sb_secret_")
  );
}

export function isLegacyJwtSupabaseApiKey(key: string): boolean {
  if (key.startsWith("sb_")) return false;
  const parts = key.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

export function describeSupabaseKeyKind(
  key: string,
): "publishable" | "secret" | "legacy_jwt" | "unknown" {
  if (key.startsWith("sb_publishable_")) return "publishable";
  if (key.startsWith("sb_secret_")) return "secret";
  if (isLegacyJwtSupabaseApiKey(key)) return "legacy_jwt";
  return "unknown";
}

export function getSupabaseEnv() {
  const url = trimEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getSupabasePublishableKey();

  if (!url || !anonKey) {
    throw new Error(
      "Не заданы NEXT_PUBLIC_SUPABASE_URL и публичный ключ (NEXT_PUBLIC_SUPABASE_ANON_KEY или NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). См. .env.example.",
    );
  }

  const kind = describeSupabaseKeyKind(anonKey);
  if (kind === "secret") {
    throw new Error(
      "В публичной переменной указан secret-ключ (sb_secret_...). Используйте publishable или legacy anon.",
    );
  }

  return { url, anonKey };
}

export function hasSupabaseEnv() {
  return Boolean(
    trimEnv("NEXT_PUBLIC_SUPABASE_URL") && getSupabasePublishableKey(),
  );
}

export function hasSupabaseSecretEnv() {
  return Boolean(
    trimEnv("NEXT_PUBLIC_SUPABASE_URL") && getSupabaseSecretKey(),
  );
}
