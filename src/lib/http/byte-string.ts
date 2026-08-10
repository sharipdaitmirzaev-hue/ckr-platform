/**
 * HTTP Headers / Cookie values в Fetch/undici — ByteString (коды 0–255).
 * Кириллица и прочий Unicode (>255) в headers.set / Set-Cookie даёт:
 *   TypeError: Cannot convert argument to a ByteString ...
 */

export function isByteString(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) > 255) return false;
  }
  return true;
}

/** Первая позиция с кодом > 255, либо -1. */
export function firstNonByteStringIndex(value: string): number {
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) > 255) return i;
  }
  return -1;
}

export function isByteStringError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /ByteString/i.test(message) || /greater than 255/i.test(message);
}

/**
 * Значение для Cookie / header: если уже ByteString — как есть,
 * иначе percent-encoding (ASCII-безопасно).
 */
export function toByteStringSafe(value: string): string {
  if (isByteString(value)) return value;
  return encodeURIComponent(value);
}
