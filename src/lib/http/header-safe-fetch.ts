import {
  firstNonByteStringIndex,
  isByteString,
} from "@/lib/http/byte-string";

type Fetch = typeof fetch;

function iterateHeaderPairs(init?: HeadersInit): Array<[string, string]> {
  if (!init) return [];
  if (init instanceof Headers) {
    const pairs: Array<[string, string]> = [];
    init.forEach((value, key) => {
      pairs.push([key, value]);
    });
    return pairs;
  }
  if (Array.isArray(init)) {
    return init.map(([key, value]) => [key, String(value)]);
  }
  return Object.entries(init)
    .filter((entry): entry is [string, string] => entry[1] != null)
    .map(([key, value]) => [key, String(value)]);
}

/**
 * Собирает Headers только из ByteString-значений.
 * Если в apikey/Authorization попадает кириллица (битый ключ в env) —
 * бросает понятную ошибку вместо сырого undici TypeError.
 */
export function buildHeaderSafeHeaders(init?: HeadersInit): Headers {
  const headers = new Headers();
  const pairs = iterateHeaderPairs(init);
  for (let i = 0; i < pairs.length; i += 1) {
    const [key, value] = pairs[i];
    if (!isByteString(key)) {
      throw new Error(
        `HTTP header name is not ByteString (index ${firstNonByteStringIndex(key)}).`,
      );
    }
    if (!isByteString(value)) {
      const idx = firstNonByteStringIndex(value);
      const kind =
        key.toLowerCase() === "apikey" ||
        key.toLowerCase() === "authorization"
          ? "Проверьте NEXT_PUBLIC_SUPABASE_ANON_KEY / PUBLISHABLE_KEY в /etc/ckr/ckr.env (кириллица в ключе недопустима)."
          : `Header "${key}" contains a non-ByteString character.`;
      throw new Error(
        `${kind} ByteString violation at index ${idx}.`,
      );
    }
    headers.set(key, value);
  }
  return headers;
}

/** fetch-обёртка для Supabase client: не допускает Unicode в headers. */
export function createHeaderSafeFetch(baseFetch: Fetch = fetch): Fetch {
  return async (input, init) => {
    const headers = buildHeaderSafeHeaders(init?.headers);
    return baseFetch(input, { ...init, headers });
  };
}
