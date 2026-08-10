/**
 * Supabase env helpers.
 * Поддерживаются:
 * - новые ключи: sb_publishable_... / sb_secret_...
 * - legacy JWT: anon / service_role
 *
 * Значения ключей никогда не логируются.
 */

import { firstNonByteStringIndex, isByteString } from "@/lib/http/byte-string";

function trimEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Ключи/URL уходят в HTTP headers (apikey, Authorization) — только ByteString. */
export function assertHeaderSafeEnv(name: string, value: string): void {
  if (isByteString(value)) return;
  const idx = firstNonByteStringIndex(value);
  throw new Error(
    `${name} содержит символ вне ByteString (index ${idx}). Проверьте /etc/ckr/ckr.env — в ключах и URL не должно быть кириллицы.`,
  );
}

/** Диагностика без утечки секрета: safe + index первого плохого символа. */
export function describeHeaderSafety(value: string | undefined): {
  safe: boolean;
  badIndex: number | null;
  length: number;
} {
  if (!value) return { safe: false, badIndex: null, length: 0 };
  const badIndex = firstNonByteStringIndex(value);
  return {
    safe: badIndex < 0,
    badIndex: badIndex < 0 ? null : badIndex,
    length: value.length,
  };
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

  assertHeaderSafeEnv("NEXT_PUBLIC_SUPABASE_URL", url);
  assertHeaderSafeEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY|PUBLISHABLE_KEY",
    anonKey,
  );

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

/** Публичная диагностика для /api/health — без значений секретов. */
export function getSupabaseHeaderSafetyReport() {
  const url = trimEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getSupabasePublishableKey();
  const urlSafety = describeHeaderSafety(url);
  const keySafety = describeHeaderSafety(anonKey);
  return {
    urlSafe: urlSafety.safe,
    urlBadIndex: urlSafety.badIndex,
    anonKeySafe: keySafety.safe,
    anonKeyBadIndex: keySafety.badIndex,
    anonKeyLength: keySafety.length,
    anonKeyKind: anonKey ? describeSupabaseKeyKind(anonKey) : "missing",
  };
}
